export enum CredentialType {
  DIGITAL_BADGE = 'digital_badge',
  CERTIFICATE = 'certificate',
}

export enum CredentialSubType {
  ACADEMIC = 'academic',
  SKILL_BASED = 'skill_based',
  PARTICIPATION = 'participation',
}

export enum CredentialStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

export enum CredentialPrivacy {
  PUBLIC = 'public',
  PRIVATE = 'private',
  SELECTIVE = 'selective',
}

export interface Credential {
  id: number;
  institution_id: number;
  recipient_id: number;
  issuer_id?: number;
  credential_type: CredentialType;
  sub_type: CredentialSubType;
  title: string;
  description?: string;
  certificate_number: string;
  skills?: string[];
  metadata?: Record<string, unknown>;
  blockchain_hash?: string;
  blockchain_credential_id?: string;
  blockchain_status?: string;
  verification_url?: string;
  qr_code_url?: string;
  issued_at?: string;
  expires_at?: string;
  status: CredentialStatus;
  revoked_at?: string;
  revoked_by?: number;
  revoke_reason?: string;
  course_id?: number;
  exam_id?: number;
  assignment_id?: number;
  grade?: string;
  score?: number;
  created_at: string;
  updated_at: string;
  recipient_name?: string;
  recipient_email?: string;
  issuer_name?: string;
  institution_name?: string;
  verification_count?: number;
  share_count?: number;
  [key: string]: unknown;
}

export interface CredentialShare {
  id: number;
  credential_id: number;
  share_token: string;
  share_url: string;
  recipient_email?: string;
  recipient_name?: string;
  expires_at?: string;
  is_active: boolean;
  view_count: number;
  last_viewed_at?: string;
  created_at: string;
}

export interface CredentialVerification {
  id: number;
  credential_id: number;
  verifier_name?: string;
  verifier_email?: string;
  verifier_organization?: string;
  verifier_ip?: string;
  verification_method: string;
  verification_result: string;
  metadata?: Record<string, unknown>;
  verified_at: string;
}

export interface BlockchainVerification {
  transaction_hash: string;
  block_number: number;
  timestamp: string;
  issuer_address: string;
  credential_id: string;
  verified: boolean;
}

export interface CredentialStatistics {
  total_issued: number;
  active_credentials: number;
  revoked_credentials: number;
  expired_credentials: number;
  pending_credentials: number;
  by_type: Record<string, number>;
  by_subtype: Record<string, number>;
  recent_issuances: Credential[];
}

export interface ShareCredentialRequest {
  recipient_email?: string;
  recipient_name?: string;
  expires_at?: string;
}

export interface VerifyCredentialRequest {
  credential_id?: number;
  certificate_number?: string;
  blockchain_credential_id?: string;
  verifier_name?: string;
  verifier_email?: string;
  verifier_organization?: string;
}

export interface PublicCredentialVerificationResponse {
  valid: boolean;
  credential?: Credential;
  message: string;
  verified_at: string;
  blockchain_verified: boolean;
}
