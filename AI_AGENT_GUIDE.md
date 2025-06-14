# AgentPayy - AI Agent Integration Guide

## What is AgentPayy?
**Single-package payment system** for AI agents. Uses deployed smart contracts - no blockchain setup required.

## Quick Integration

### Install (One Package)
```bash
# TypeScript/JavaScript
npm install @agentpayy/sdk

# Python
pip install agentpayy
```

### Basic Usage (TypeScript)
```typescript
import { AgentPayyKit } from '@agentpayy/sdk';

const agentPay = new AgentPayyKit({
  network: 'base', // Uses deployed AgentPayy contracts
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
from agentpay import AgentPayyKit

agentpay = AgentPayyKit(
    private_key="0x...",
    chain="base"  # Uses deployed AgentPayy contracts
)

# Pay for API call
result = agentpay.call_api(
    "https://api.example.com",
    {"input": "data"},
    "model-id"
)
```

## All Features in One Package

### Advanced Features (TypeScript)
```typescript
// Import everything from single package
import { 
  AgentPayyKit,
  ReputationModule,
  AttributionModule,
  AgentPayyWall,
  APIRegistry 
} from '@agentpayy/sdk';

// Multi-agent revenue sharing
const attributions = [
  { recipient: '0xAgent1', basisPoints: 6000 },  // 60%
  { recipient: '0xAgent2', basisPoints: 4000 }   // 40%
];

const result = await agentPay.payWithAttribution(
  'complex-task',
  { data: 'input' },
  attributions,
  { price: '0.05' }
);

// Reputation system
const reputation = new ReputationModule(gatewayUrl);
const agentRep = await reputation.getReputation(agentAddress);

// API marketplace
const registry = new APIRegistry(gatewayUrl);
const weatherAPIs = await registry.getAPIsByCategory('Weather & Environment');
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
- **Single Package Install**: Everything included, no complex setup
- **Zero Blockchain Setup**: Uses deployed contracts, just add private key
- **Automatic Payment Handling**: Sub-cent transaction costs
- **Privacy-Preserving**: Input/output data never stored on-chain
- **Multi-Network Support**: Base, Arbitrum, Optimism L2s
- **Direct API Communication**: No intermediary services required
- **Complete Toolkit**: Payments + attribution + reputation + marketplace
- **AI Framework Ready**: Works with CrewAI, AutoGPT, LangChain
- **Production Ready**: All 34 smart contract tests pass

## Integration Examples
- **CrewAI**: [examples/crewai-integration.md](./examples/crewai-integration.md)
- **Express**: [examples/express-integration.md](./examples/express-integration.md)
- **FastAPI**: [examples/fastapi-integration.md](./examples/fastapi-integration.md)

## Contract Addresses
AgentPayy contracts are deployed on all supported networks. SDK automatically connects to the correct addresses.

## Support
- GitHub: https://github.com/agentpay/agentpay
- Documentation: [Getting Started](./docs/getting-started.md) 