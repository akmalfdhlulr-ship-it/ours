export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface UserSummary {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    displayName: string;
    avatarUrl: string | null;
  };
}

export interface RegisterResponse {
  user: UserSummary;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
  pushToken?: string;
}

export interface SessionInfo {
  token: string;
  expiresAt: string;
}

export interface ActiveSpaceSummary {
  id: string;
  name: string | null;
  status: string;
}

export interface LoginResponse {
  user: UserSummary;
  session: SessionInfo;
  coupleSpace: ActiveSpaceSummary | null;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  verified: boolean;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  passwordReset: boolean;
}

export interface SessionItem {
  id: string;
  deviceInfo: string | null;
  ipAddress: string | null;
  lastActiveAt: string;
  isCurrent: boolean;
}

export interface LogoutResponse {
  loggedOut: boolean;
}

export interface RevokeSessionResponse {
  revoked: boolean;
}
