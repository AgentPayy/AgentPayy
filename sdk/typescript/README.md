<div align="center">
  <img src="../../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="120"/>
</div>

# AgentPay TypeScript SDK

Connect to the AgentPay payment network. No contract deployment needed.

## Install
```bash
npm install @agentpay/sdk
```

## Basic Usage
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base', // Connects to deployed AgentPay contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);
```

## API Provider Integration
```typescript
// Validate payments in your API
const isValid = await agentPay.validatePayment(txHash, inputData);

// Mark payment as processed
await agentPay.markValidated(txHash);
```

## Available Networks
- **base**: Base mainnet (recommended)
- **arbitrum**: Arbitrum One
- **optimism**: Optimism mainnet
- **polygon**: Polygon mainnet

## Key Features
- Uses deployed AgentPay contracts (no setup required)
- Privacy-first (only hashes on-chain)
- Sub-cent fees on L2s
- Direct client-to-API communication
- Built-in payment validation 