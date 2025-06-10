export type ChainType = 'base' | 'arbitrum' | 'optimism';
export type WalletType = 'metamask' | 'coinbase' | 'walletconnect';
export type SmartAccountProvider = 'biconomy' | 'zerodev' | 'alchemy';

export interface PaymentOptions {
  price: string;
  deadline?: number;
  mock?: boolean;
  useBalance?: boolean;
  gasless?: boolean;
  chain?: ChainType;
}

export interface ModelConfig {
  modelId: string;
  endpoint: string;
  price: string;
  token?: string;
  description?: string;
}

export interface PaymentData {
  modelId: string;
  inputHash: string;
  amount: string;
  deadline: number;
  smartWalletSig: string;
  v: number;
  r: string;
  s: string;
}

export interface WalletInfo {
  address: string;
  isSmartAccount: boolean;
  provider?: SmartAccountProvider;
  client: any;
  features: {
    gasless: boolean;
    batchTransactions: boolean;
    socialRecovery: boolean;
  };
}

export interface WalletConnectionOptions {
  smart?: boolean;
  provider?: SmartAccountProvider;
  features?: ('gasless' | 'batching' | 'social-recovery')[];
  chain?: ChainType;
}

export interface ModelInfo {
  owner: string;
  endpoint: string;
  price: string;
  token: string;
  active: boolean;
  totalCalls: number;
  totalRevenue: string;
}

export interface FinancialOverview {
  earnings: string;
  balance: string;
  totalSpent: string;
  netPosition: string;
}

export interface PaymentProof {
  txHash: string;
  signature: string;
  payer: string;
  amount: string;
  timestamp: number;
  verified: boolean;
}

export interface APICallMetadata {
  payer: string;
  paymentAmount: string;
  timestamp: number;
  verified: boolean;
  apiEndpoint?: string;
}

// Event types
export interface PaymentProcessedEvent {
  modelId: string;
  payer: string;
  payee: string;
  amount: string;
  inputHash: string;
  blockNumber: number;
  transactionHash: string;
}

export interface ModelRegisteredEvent {
  modelId: string;
  owner: string;
  price: string;
  blockNumber: number;
  transactionHash: string;
}

// Error types
export class AgentPayError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'AgentPayError';
  }
}

export class PaymentError extends AgentPayError {
  constructor(message: string) {
    super(message, 'PAYMENT_ERROR');
  }
}

export class WalletError extends AgentPayError {
  constructor(message: string) {
    super(message, 'WALLET_ERROR');
  }
}

export class ContractError extends AgentPayError {
  constructor(message: string) {
    super(message, 'CONTRACT_ERROR');
  }
} 