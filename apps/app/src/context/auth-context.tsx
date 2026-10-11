import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Platform } from 'react-native';
import {
  ArchivedSpaceMetadata,
  CreateInvitationResponse,
  InvitationMetadata,
  ResendVerificationResponse,
  SpaceDetails,
  UserMeResponse,
} from '@ours/contracts';
import { api, ApiError } from '../services/api';

export type LifecycleState =
  | 'UNAUTHENTICATED'
  | 'AUTHENTICATED_UNVERIFIED'
  | 'VERIFIED_WITHOUT_SPACE'
  | 'VERIFIED_WITH_PENDING_SPACE'
  | 'VERIFIED_WITH_ACTIVE_SPACE';

interface AuthContextValue {
  user: UserMeResponse | null;
  coupleSpace: SpaceDetails | null;
  pendingInvitation: CreateInvitationResponse | null;
  lifecycleState: LifecycleState;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refresh: () => Promise<void>;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name?: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  resendVerification: () => Promise<ResendVerificationResponse>;
  logout: () => Promise<void>;
  createSpace: (name?: string, anniversaryDate?: string) => Promise<void>;
  generateInvitation: () => Promise<CreateInvitationResponse>;
  listInvitations: () => Promise<InvitationMetadata[]>;
  revokeInvitation: (id: string) => Promise<void>;
  joinByToken: (token: string) => Promise<void>;
  joinByCode: (code: string) => Promise<void>;
  archiveSpace: (confirmationPhrase: string) => Promise<void>;
  getArchivedSpaces: () => Promise<ArchivedSpaceMetadata[]>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<UserMeResponse | null>(null);
  const [coupleSpace, setCoupleSpace] = useState<SpaceDetails | null>(null);
  const [pendingInvitation, setPendingInvitation] =
    useState<CreateInvitationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refresh = useCallback(async () => {
    try {
      const token = await api.getStoredToken();
      if (!token) {
        setUser(null);
        setCoupleSpace(null);
        return;
      }

      const userData = await api.users.getMe();
      setUser(userData);

      if (userData.emailVerified) {
        try {
          const spaceData = await api.spaces.getCurrent();
          setCoupleSpace(spaceData);
        } catch {
          setCoupleSpace(null);
        }
      } else {
        setCoupleSpace(null);
      }
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 401) {
        await api.clearStoredToken();
        setUser(null);
        setCoupleSpace(null);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await refresh();
      setIsLoading(false);
    })();
  }, [refresh]);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.login({ email, password: pass });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, pass: string, name?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const regRes = await api.auth.register({
        email,
        password: pass,
        displayName: name || 'Partner',
      });
      // Automatically log in after registration
      await api.auth.login({ email, password: pass });

      // Automatically verify email if verification token was provided (mock/dev environment)
      if (regRes.verificationToken) {
        try {
          await api.auth.verifyEmail({ token: regRes.verificationToken });
        } catch {
          // If auto-verify fails, continue to let user verify manually
        }
      }

      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.verifyEmail({ token: code });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Email verification failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resendVerification = async (): Promise<ResendVerificationResponse> => {
    setError(null);
    try {
      const res = await api.auth.resendVerification();
      return res;
    } catch (err: any) {
      setError(err?.message || 'Failed to resend code');
      throw err;
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.auth.logout();
    } catch {
      // Ignored
    } finally {
      setUser(null);
      setCoupleSpace(null);
      setPendingInvitation(null);
      setIsLoading(false);
    }
  };

  const createSpace = async (name?: string, anniversaryDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.spaces.create({
        name: name || undefined,
        anniversaryDate: anniversaryDate || undefined,
      });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to create couple space');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const generateInvitation = async (): Promise<CreateInvitationResponse> => {
    if (!coupleSpace) {
      throw new Error('No active couple space found');
    }
    setError(null);
    try {
      const inv = await api.invitations.create(coupleSpace.id);
      setPendingInvitation(inv);
      return inv;
    } catch (err: any) {
      setError(err?.message || 'Failed to generate invitation');
      throw err;
    }
  };

  const listInvitations = async (): Promise<InvitationMetadata[]> => {
    if (!coupleSpace) return [];
    return api.invitations.list(coupleSpace.id);
  };

  const revokeInvitation = async (id: string) => {
    if (!coupleSpace) return;
    setError(null);
    try {
      await api.invitations.revoke(coupleSpace.id, id);
      setPendingInvitation(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to revoke invitation');
      throw err;
    }
  };

  const joinByToken = async (token: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.spaces.joinByToken({ token });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to join couple space');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const joinByCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await api.spaces.joinByCode({ pairingCode: code });
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired pairing code');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const archiveSpace = async (confirmationPhrase: string) => {
    if (!coupleSpace) return;
    setIsLoading(true);
    setError(null);
    try {
      await api.spaces.archive(coupleSpace.id, { confirmationPhrase });
      setCoupleSpace(null);
      setPendingInvitation(null);
      await refresh();
    } catch (err: any) {
      setError(err?.message || 'Failed to archive space');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const getArchivedSpaces = async (): Promise<ArchivedSpaceMetadata[]> => {
    return api.spaces.getArchived();
  };

  // Determine computed state
  let lifecycleState: LifecycleState = 'UNAUTHENTICATED';
  if (user) {
    if (!user.emailVerified) {
      lifecycleState = 'AUTHENTICATED_UNVERIFIED';
    } else if (!coupleSpace) {
      lifecycleState = 'VERIFIED_WITHOUT_SPACE';
    } else if (coupleSpace.status === 'PENDING') {
      lifecycleState = 'VERIFIED_WITH_PENDING_SPACE';
    } else {
      lifecycleState = 'VERIFIED_WITH_ACTIVE_SPACE';
    }
  }

  const value: AuthContextValue = {
    user,
    coupleSpace,
    pendingInvitation,
    lifecycleState,
    isLoading,
    error,
    clearError,
    refresh,
    login,
    register,
    verifyEmail,
    resendVerification,
    logout,
    createSpace,
    generateInvitation,
    listInvitations,
    revokeInvitation,
    joinByToken,
    joinByCode,
    archiveSpace,
    getArchivedSpaces,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
