<div align="center">
  <img src="./AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="200"/>
</div>

# AgentPay

Privacy-first API payments with crypto. Sub-cent fees on L2s.

## Quick Start

```bash
npm install @agentpay/sdk
```

```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base', // Uses deployed AgentPay contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const result = await agentPay.callAPI(
  'https://api.example.com',
  { data: 'input' },
  'model-id'
);
```

## For API Providers

```typescript
// Validate payments from AgentPay network
const isValid = await agentPay.validatePayment(txHash, inputData);
```

## Integrations

- **CrewAI**: `@agentpay/crewai`
- **LangChain**: `@agentpay/langchain` 
- **FastAPI**: `@agentpay/fastapi`
- **Express**: `@agentpay/express`

## Networks

AgentPay contracts deployed on:
- Base (8453)
- Arbitrum (42161)
- Optimism (10)
- Polygon (137)

## Links

- [SDK Documentation](./sdk/typescript/)
- [Integration Examples](./examples/)
- [Getting Started](./docs/getting-started.md) 