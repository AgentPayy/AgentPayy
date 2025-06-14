<div align="center">
  <img src="../../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPayy Logo" width="120"/>
</div>

# AgentPayy TypeScript SDK

**Single package with all features included**. Connect to the AgentPayy payment network with zero setup.

## Install
```bash
npm install @agentpayy/sdk
```

## Basic Usage
```typescript
import { AgentPayyKit } from '@agentpayy/sdk';

const agentPay = new AgentPayyKit({
  network: 'base', // Connects to deployed AgentPayy contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const result = await agentPay.callAPI(
  'https://api.example.com',
  { input: 'data' },
  'model-id'
);
```

## All Features Included

### Core Payment System
```typescript
// Basic API payment
const result = await agentPay.callAPI(endpoint, data, modelId);

// Payment validation (for API providers)
const isValid = await agentPay.validatePayment(txHash, inputData);
await agentPay.markValidated(txHash);
```

### Advanced Features
```typescript
// Import specialized modules
import { 
  AgentPayyKit,
  ReputationModule,
  AttributionModule,
  AgentPayyWall,
  APIRegistry 
} from '@agentpayy/sdk';

// Attribution payments (revenue sharing)
const attributions = [
  { recipient: '0xAgent1', basisPoints: 6000 },  // 60%
  { recipient: '0xAgent2', basisPoints: 4000 }   // 40%
];

const result = await agentPay.payWithAttribution(
  'complex-analysis',
  { data: 'input' },
  attributions,
  { price: '0.10' }
);

// Balance management
await agentPay.depositBalance('10.0'); // Deposit $10 USDC
const balance = await agentPay.getUserBalance();
await agentPay.withdrawBalance('5.0'); // Withdraw specific amount
await agentPay.withdraw(); // Withdraw all earnings

// Reputation system
const reputation = new ReputationModule(gatewayUrl);
const agentRep = await reputation.getReputation(agentAddress);
const specialists = await reputation.findAgentsBySpecialty('weather-data', 4.0);

// API marketplace
const registry = new APIRegistry(gatewayUrl);
await registry.registerModel({
  modelId: 'weather-api-v1',
  endpoint: 'https://api.myservice.com/weather',
  price: '0.02',
  category: 'Weather & Environment'
});

const weatherAPIs = await registry.getAPIsByCategory('Weather & Environment');
```

## API Provider Integration
```typescript
// Validate payments in your API
const isValid = await agentPay.validatePayment(txHash, inputData);

// Mark payment as processed
await agentPay.markValidated(txHash);

// Register your API for monetization
await agentPay.registerModel({
  modelId: 'my-api',
  endpoint: 'https://api.myservice.com',
  price: '0.05'
});
```

## API Discovery & Marketplace
```typescript
// Register API with full metadata
await agentPay.registerModel({
  modelId: 'weather-forecast-v2',
  endpoint: 'https://api.weather.com/forecast',
  price: '0.03',
  category: 'Weather & Environment',
  tags: ['weather', 'forecast', 'climate'],
  description: 'Advanced weather forecasting API'
});

// Discover APIs by category
const weatherAPIs = await agentPay.getAPIsByCategory('Weather & Environment');

// Search APIs by tags
const aiAPIs = await agentPay.searchAPIsByTag('ai');

// Get marketplace statistics
const stats = await agentPay.getMarketplaceStats();
console.log(`${stats.totalAPIs} APIs, ${stats.totalDevelopers} developers`);

// Get trending APIs
const trending = await agentPay.getTrendingAPIs(10);
```

## Available Networks
- **base**: Base mainnet (recommended)
- **arbitrum**: Arbitrum One
- **optimism**: Optimism mainnet
- **polygon**: Polygon mainnet

## Key Features
- **Single Package**: All features included, no separate installs
- **Zero Setup**: Uses deployed AgentPayy contracts (no deployment needed)
- **Privacy-First**: Only payment hashes stored on-chain
- **Sub-Cent Costs**: Enable $0.001-$0.01 API calls economically
- **Multi-Chain**: Works across Base, Arbitrum, Optimism L2s
- **Complete Toolkit**: Core payments + attribution + reputation + marketplace
- **Framework Ready**: Works with Express, FastAPI, CrewAI, and more

## Package Contents
- **AgentPayyKit**: Main payment class
- **ReputationModule**: Agent discovery and scoring
- **AttributionModule**: Multi-party revenue sharing  
- **AgentPayyWall**: Express.js middleware for API monetization
- **APIRegistry**: On-chain API marketplace
- **Wallet Adapters**: MetaMask, Coinbase, WalletConnect, Smart Accounts
- **Core Utilities**: Crypto functions, contract interfaces, type definitions 