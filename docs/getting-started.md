<div align="center">
  <img src="../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="150"/>
</div>

# Getting Started

## Install
```bash
npm install @agentpay/sdk
```

## Setup
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});
```

## Call API
```typescript
// Direct API call with payment proof
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);
```

## For API Providers
```typescript
// Validate payment
const isValid = await agentPay.validatePayment(txHash, inputData);

// Mark as validated
await agentPay.markValidated(txHash);
``` 