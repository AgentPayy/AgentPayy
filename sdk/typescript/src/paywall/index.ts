// Main paywall middleware
export { AgentPayWall } from './AgentPayWall';

// Types and interfaces
export type {
  PaywallOptions,
  RouteOptions,
  PaymentRequest,
  Analytics
} from './AgentPayWall';

// Re-export useful core types
export type {
  ChainType,
  PaymentProof,
  APICallMetadata
} from '@agentpay/core'; 