// Main paywall middleware
export { AgentPayWall } from './AgentPayWall';

// Types and interfaces
export type {
  PaywallOptions,
  RouteOptions,
  PaymentRequest,
  Analytics
} from './AgentPayWall';

// Re-export types from core
export type {
  PaymentOptions,
  ChainType,
  PaymentProof,
  APICallMetadata,
  PaymentError,
  AgentPayError
} from '../core'; 