/**
 * Publisher SDK Type Definitions
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

export interface X402Config {
  payToAddress: string;
  network?: 'base' | 'bnb' | 'ethereum' | 'polygon';
  facilitator?: string;
  refundPolicy?: string;
  defaultPrice?: string;
}

export interface RouteConfig {
  [path: string]: string | ((req: any) => string);
}

export interface VerificationResult {
  valid: boolean;
  receipt?: {
    transactionHash: string;
    amount: string;
    network: string;
    from: string;
    to: string;
  };
  error?: string;
}

