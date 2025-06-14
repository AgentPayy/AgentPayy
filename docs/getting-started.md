<div align="center">
  <img src="../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="150"/>
</div>

# Getting Started with AgentPay

## Step 1: Install SDK
```bash
npm install @agentpay/sdk
```

## Step 2: Initialize Client
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base', // Uses deployed AgentPay contracts
  privateKey: process.env.PRIVATE_KEY
});
```

## Step 3: Pay for API Call
```typescript
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);
```

## For API Providers

### Validate Payments
```typescript
// In your API endpoint
const isValid = await agentPay.validatePayment(txHash, inputData);
if (!isValid) return { error: 'Invalid payment' };

// Process request and mark as validated
await agentPay.markValidated(txHash);
```

### Integration Examples
- **Express**: Add payment validation middleware
- **FastAPI**: Use payment decorator
- **Next.js**: Validate in API routes

## Networks Available
- **base** (recommended): Lowest fees
- **arbitrum**: Fast finality  
- **optimism**: Ethereum-compatible
- **polygon**: High throughput 