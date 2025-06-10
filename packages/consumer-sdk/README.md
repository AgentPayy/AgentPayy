# @agentpay/consumer-sdk

> **SDK for consuming AI APIs with automatic payments and smart wallet integration**

The consumer SDK enables developers to easily integrate API payments into their applications using smart accounts, gasless transactions, and automatic payment routing.

## 🚀 Quick Start

### Installation

```bash
npm install @agentpay/consumer-sdk
```

### Basic Usage

```typescript
import { AgentPayKit } from '@agentpay/consumer-sdk';

const agentpay = new AgentPayKit();

// Generate smart wallet
const wallet = await agentpay.generateWallet({
  smart: true,
  provider: 'biconomy',
  features: ['gasless', 'batching']
});

// Setup agent with dual capabilities
const agent = await agentpay.setupAgent({
  name: 'My AI Agent',
  endpoints: [
    { modelId: 'weather-api', endpoint: 'https://api.weather.com', price: '0.05' }
  ]
});

// Universal API call with smart routing
const result = await agentpay.payAndCall('weather-api', { city: 'NYC' }, {
  price: '0.05',
  useBalance: true,
  gasless: true
});
```

## 📚 Features

- **Universal Wallet Management** - Generate, import, or connect existing wallets
- **Smart Account Integration** - Gasless transactions with Biconomy, ZeroDev, Alchemy
- **Dual Usage Pattern** - Both consume and provide APIs from same wallet
- **Automatic Payment Routing** - Balance → Permit → Smart account fallbacks
- **Batch Operations** - Multiple API calls in single transaction
- **Multi-chain Support** - Base, Arbitrum, Optimism

## 🔧 API Reference

### Wallet Management

```typescript
// Generate new wallet
const wallet = await agentpay.generateWallet(options);

// Connect existing wallet
const wallet = await agentpay.connectWallet('metamask', options);

// Import from private key
const wallet = await agentpay.importWallet(privateKey, options);
```

### API Consumption

```typescript
// Pay and call registered API
const result = await agentpay.payAndCall(modelId, input, options);

// Call API directly with payment proof
const result = await agentpay.callAPI(endpoint, input, options);

// Batch multiple calls
const results = await agentpay.batchPayAndCall(calls);
```

### Balance Management

```typescript
// Deposit to prepaid balance
await agentpay.depositBalance('10.0');

// Check balance
const balance = await agentpay.getUserBalance();

// Withdraw from balance
await agentpay.withdrawBalance('5.0');
```

### Financial Overview

```typescript
// Complete financial picture
const overview = await agentpay.getFinancialOverview();
// {
//   earnings: '12.50',  // From providing APIs
//   balance: '25.00',   // Prepaid for consuming APIs
//   totalSpent: '8.75', // Total API consumption
//   netPosition: '+28.75' // Overall position
// }
```

## 🎯 Use Cases

### AI Trading Bot
```typescript
const agentpay = new AgentPayKit();
await agentpay.generateWallet({ smart: true });
await agentpay.depositBalance('50.0');

// Bot can now call market data APIs
const marketData = await agentpay.payAndCall('market-api', {
  symbols: ['BTC', 'ETH']
}, { price: '0.01' });
```

### Content Analysis Agent
```typescript
// Agent that processes content using multiple AI APIs
const results = await agentpay.batchPayAndCall([
  { modelId: 'sentiment-api', input: { text: content }, options: { price: '0.02' } },
  { modelId: 'summary-api', input: { text: content }, options: { price: '0.05' } },
  { modelId: 'translate-api', input: { text: content, to: 'es' }, options: { price: '0.03' } }
]);
```

### Research Assistant
```typescript
// Register your own research API
await agentpay.registerModel({
  modelId: 'research-api',
  endpoint: 'https://api.myresearch.com',
  price: '0.10'
});

// Use other research APIs
const papers = await agentpay.payAndCall('academic-search', {
  query: 'machine learning 2024'
}, { price: '0.08' });
```

## 🔗 Related Packages

- **[@agentpay/paywall-sdk](../paywall-sdk)** - For API providers to monetize their APIs
- **[@agentpay/core](../core)** - Shared utilities and types

## 📖 Documentation

- [Complete API Reference](../../docs/CONSUMER_SDK_API.md)
- [User Journey Guide](../../docs/USER_JOURNEY.md)
- [Examples & Tutorials](../../examples/consumer-sdk)

## 🆘 Support

- [GitHub Issues](https://github.com/agentpay/agentpay/issues)
- [Discord Community](https://discord.gg/agentpaykit)
- [Documentation](../../docs)

## License

MIT - see [LICENSE](../../LICENSE) for details. 