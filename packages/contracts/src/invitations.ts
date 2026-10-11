export interface CreateInvitationResponse {
  id: string;
  token: string;
  pairingCode: string;
  inviteUrl: string;
  status: string;
  expiresAt: string;
}

export interface InvitationMetadata {
  id: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

export interface RevokeInvitationResponse {
  id: string;
  status: string;
}

export interface InvitationPreviewResponse {
  status: string;
  spaceName: string | null;
  createdByName: string;
  expiresAt: string;
}

export interface JoinByTokenRequest {
  token: string;
}

export interface JoinByCodeRequest {
  pairingCode: string;
}

export interface JoinResponse {
  coupleSpace: {
    id: string;
    name: string | null;
    status: string;
  };
  membership: {
    id: string;
    role: string;
    status: string;
  };
}
