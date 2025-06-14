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

## Advanced Features

### Attribution Payments
Split payments across multiple agents automatically:

```typescript
// Multi-agent workflow with revenue sharing
const attributions = [
  { recipient: '0xDataAgent', basisPoints: 3000 },    // 30%
  { recipient: '0xAnalysisAgent', basisPoints: 7000 } // 70%
];

const result = await agentPay.payWithAttribution(
  'market-analysis',
  { query: 'NVDA analysis' },
  attributions,
  { price: '0.05' }
);
```

### Balance Management
Netflix-style prepaid system:

```typescript
// Deposit once, use seamlessly
await agentPay.depositBalance('10.0'); // $10 USDC

// Check balance
const balance = await agentPay.getUserBalance();

// Automatic usage (no wallet popups)
const result = await agentPay.callAPI(endpoint, data, modelId);

// Withdraw earnings
await agentPay.withdraw();
```

### Reputation System
Built-in agent discovery:

```typescript
// Get agent reputation
const reputation = await agentPay.getReputation(agentAddress);
console.log(`Rating: ${reputation.rating}/5.0`);

// Find specialists
const specialists = await agentPay.findAgentsBySpecialty('weather-data', 4.0);

// Get leaderboard
const topAgents = await agentPay.getLeaderboard(10);
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

### Register API for Monetization
```typescript
await agentPay.registerModel({
  modelId: 'my-weather-api',
  endpoint: 'https://api.myservice.com/weather',
  price: '0.02'
});
```

## API Discovery & Marketplace

### Register API with Full Metadata
```typescript
await agentPay.registerModel({
  modelId: 'advanced-sentiment-v1',
  endpoint: 'https://api.myai.com/sentiment',
  price: '0.01',
  category: 'AI & Machine Learning',
  tags: ['sentiment', 'nlp', 'analysis'],
  description: 'Advanced sentiment analysis with confidence scores'
});
```

### Discover APIs
```typescript
// Find APIs by category
const aiAPIs = await agentPay.getAPIsByCategory('AI & Machine Learning');

// Search by tags
const sentimentAPIs = await agentPay.searchAPIsByTag('sentiment');

// Get marketplace stats
const stats = await agentPay.getMarketplaceStats();
console.log(`${stats.totalAPIs} APIs available`);

// Get trending APIs
const trending = await agentPay.getTrendingAPIs(5);
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
- Revenue attribution across agents
- Prepaid balance system
- Built-in reputation scoring
- Agent discovery and reliability
- On-chain API registry and marketplace
- Searchable API categories and tags

## Integration Examples
- **CrewAI**: [examples/crewai-integration.md](./examples/crewai-integration.md)
- **Express**: [examples/express-integration.md](./examples/express-integration.md)
- **FastAPI**: [examples/fastapi-integration.md](./examples/fastapi-integration.md)

## Contract Addresses
AgentPay contracts are deployed on all supported networks. SDK automatically connects to the correct addresses.

## Support
- GitHub: https://github.com/agentpay/agentpay
- Documentation: [Getting Started](./docs/getting-started.md) 