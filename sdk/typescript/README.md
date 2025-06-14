<div align="center">
  <img src="../../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="120"/>
</div>

# AgentPay TypeScript SDK

## Install
```bash
npm install @agentpay/sdk
```

## Usage
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});

// Direct API call with payment
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);

// Validate payment (API providers)
const isValid = await agentPay.validatePayment(txHash, inputData);
```

## Features
- Privacy-first (only hashes on-chain)
- Sub-cent fees on L2s
- Direct client-to-API calls
- Payment validation for providers 