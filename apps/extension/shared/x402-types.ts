/**
 * x402 Protocol Type Definitions
 * Based on x402 specification v1.0
 */

export interface PaymentScheme {
  scheme: 'exact' | 'upto';
  network: 'base' | 'bnb' | 'ethereum' | 'polygon';
  payTo: string;
  amount: string;
  currency?: string;
}

export interface PaymentRequiredResponse {
  x402Version: number;
  accepts: PaymentScheme[];
  message?: string;
  refundPolicy?: string;
}

export interface PaymentProof {
  scheme: 'exact' | 'upto';
  network: string;
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
  signature?: string;
}

export interface XPaymentHeader {
  proof: PaymentProof;
  facilitator?: string;
}

export interface PaymentReceipt {
  url: string;
  amount: string;
  network: string;
  transactionHash: string;
  timestamp: number;
  refundable: boolean;
  expiresAt?: number;
}

export interface UserWallet {
  address: string;
  network: string;
  balance: string;
  provider: 'coinbase' | 'metamask' | 'wallet-connect';
}

export interface DailyCap {
  limit: string;
  spent: string;
  resetAt: number;
}

export interface StoredConfig {
  wallet?: UserWallet;
  dailyCap: DailyCap;
  receipts: PaymentReceipt[];
  starterCredits: string;
  autoPayEnabled: boolean;
  maxPerTransaction: string;
}

