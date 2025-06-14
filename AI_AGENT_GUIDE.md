# AgentPay - AI Agent Integration Guide

## What is AgentPay?
Privacy-first API payment system using deployed smart contracts. No contract deployment needed.

## Quick Integration

### Install
```bash
npm install @agentpay/sdk
# or
pip install agentpay
```

### Basic Usage (TypeScript)
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base', // Uses deployed AgentPay contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);
```

### Basic Usage (Python)
```python
from agentpay import AgentPayKit

agentpay = AgentPayKit(
    private_key="0x...",
    chain="base"  # Uses deployed AgentPay contracts
)

# Pay for API call
result = agentpay.call_api(
    "https://api.example.com",
    {"input": "data"},
    "model-id"
)
```

## For API Providers

### Validate Payments
```typescript
// In your API endpoint
const isValid = await agentPay.validatePayment(txHash, inputData);
if (!isValid) return { error: 'Payment required' };

// Process request and mark as validated
await agentPay.markValidated(txHash);
```

## Available Networks
- **base**: Lowest fees (recommended)
- **arbitrum**: Fast finality
- **optimism**: Ethereum-compatible
- **polygon**: High throughput

## Key Benefits for AI Agents
- No blockchain setup required
- Automatic payment handling
- Sub-cent transaction costs
- Privacy-preserving
- Multi-network support
- Direct API communication

## Integration Examples
- **CrewAI**: [examples/crewai-integration.md](./examples/crewai-integration.md)
- **Express**: [examples/express-integration.md](./examples/express-integration.md)
- **FastAPI**: [examples/fastapi-integration.md](./examples/fastapi-integration.md)

## Contract Addresses
AgentPay contracts are deployed on all supported networks. SDK automatically connects to the correct addresses.

## Support
- GitHub: https://github.com/agentpay/agentpay
- Documentation: [Getting Started](./docs/getting-started.md) 