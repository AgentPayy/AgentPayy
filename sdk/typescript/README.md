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

## Advanced Features

### Attribution Payments
```typescript
// Split payment across multiple agents
const attributions = [
  { recipient: '0xAgent1', basisPoints: 6000 }, // 60%
  { recipient: '0xAgent2', basisPoints: 4000 }  // 40%
];

const result = await agentPay.payWithAttribution(
  'complex-analysis',
  { data: 'input' },
  attributions,
  { price: '0.10' }
);
```

### Balance Management
```typescript
// Deposit to prepaid balance
await agentPay.depositBalance('25.0'); // $25 USDC

// Check balance
const balance = await agentPay.getUserBalance();
console.log(`Balance: $${balance} USDC`);

// Withdraw earnings
await agentPay.withdraw();

// Get financial overview
const overview = await agentPay.getFinancialOverview();
console.log(`Net position: $${overview.netPosition}`);
```

### Reputation System
```typescript
// Get agent reputation
const reputation = await agentPay.getReputation(agentAddress);
console.log(`Rating: ${reputation.rating}/5.0`);

// Find specialists
const weatherExperts = await agentPay.findAgentsBySpecialty('weather', 4.0);

// Get top performers
const leaderboard = await agentPay.getLeaderboard(10);
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
- Attribution engine for revenue sharing
- Prepaid balance system
- Reputation scoring and agent discovery 