// Minimal TypeScript usage: shared type definitions for clarity.
// These types document the shape of records flowing through the API.

export type UserRole = "user" | "admin";

export interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  balance: number;
  created_at: string;
}

export type QrisStatus = "pending" | "paid" | "expired" | "cancelled";

export interface QrisOrderRecord {
  id: string;
  user_id: string;
  amount: number;
  fee: number;
  net_amount: number;
  reference: string;
  qr_payload: string;
  qr_image: string | null;
  status: QrisStatus;
  expires_at: string;
  paid_at: string | null;
  created_at: string;
}

export type WithdrawalMethod = "bank" | "ewallet";
export type WithdrawalStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed";

export interface WithdrawalRecord {
  id: string;
  user_id: string;
  method: WithdrawalMethod;
  destination: string;
  amount: number;
  fee: number;
  total_debit: number;
  status: WithdrawalStatus;
  created_at: string;
  completed_at: string | null;
}

export interface FeeSettings {
  qris_flat_percent: number;
  withdrawal_bank_fee_idr: number;
  withdrawal_ewallet_fee_idr: number;
  withdrawal_min_idr: number;
}

export interface QrisProviderSettings {
  provider: string;
  api_base_url: string;
  api_key: string;
  merchant_id: string;
  expiry_minutes: number;
}

export interface BrandingSettings {
  logo_url: string;
  banner_url: string;
  site_name: string;
}
