import { UserSummary } from "./auth";

export interface ActiveMembershipSummary {
  coupleSpaceId: string;
  role: string;
  status: string;
  joinedAt: string;
}

export interface UserMeResponse {
  id: string;
  email: string;
  emailVerified: boolean;
  profile: {
    displayName: string;
    avatarUrl: string | null;
    dateOfBirth: string | null;
    timezone: string;
  };
  activeMembership: ActiveMembershipSummary | null;
}

export interface UpdateProfileRequest {
  displayName?: string;
  dateOfBirth?: string;
  timezone?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ChangePasswordResponse {
  updated: boolean;
}

export interface UserMembershipItem {
  id: string;
  coupleSpaceId: string;
  spaceName: string | null;
  status: string;
  role: string;
  joinedAt: string;
  archivedAt: string | null;
}
