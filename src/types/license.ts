export type LicenseTier = "ENTERPRISE" | "COMMERCIAL" | "TRIAL";
export type LicenseStatus = "ACTIVE" | "REVOKED" | "EXPIRED" | "SUSPENDED";

export interface Product {
  id: string;
  code: string; // e.g. "13C_GATEWAY", "EXP_P2P", "ERP_PRO"
  name: string;
  description: string;
  created_at: string;
}

export interface LicensePayload {
  license_id: string;
  product_code: string;
  licensee: string;
  domain: string;
  tier: LicenseTier;
  issued_at: string;
  expires_at: string;
  heartbeat_url: string;
  custom_features?: string[];
}

export interface DeploymentRecord {
  license_id: string;
  product_code: string;
  licensee: string;
  domain: string;
  tier: LicenseTier;
  ip: string;
  user_agent: string;
  last_seen: string;
  is_revoked: boolean;
  expires_at: string;
}

export interface GenerateLicenseRequest {
  product_code: string;
  licensee: string;
  domain: string;
  tier: LicenseTier;
  duration_days: number;
  custom_features?: string[];
}

