<div align="center">
  <img src="./AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPayy Logo" width="200"/>
</div>

# AgentPayy

**Privacy-first API payment protocol for the agent economy**

AgentPayy enables developers to monetize APIs with sub-cent crypto payments while preserving user privacy. Built on Layer 2 networks with deployed smart contracts ready for immediate integration.

## Why AgentPayy?

Traditional payment systems fail for micro-transactions. Credit cards have $0.30+ fees, making $0.01 API calls impossible. AgentPayy solves this with:

- **Sub-cent fees**: ~$0.001 transaction costs on Base L2
- **Privacy-first**: Only payment hashes stored on-chain, raw data stays private
- **No infrastructure**: Connect to deployed contracts, no blockchain setup required
- **Direct communication**: Client pays, API validates, no middleware

## Quick Start

### Install SDK
```bash
npm install @agentpayy/sdk
# or
pip install agentpayy
```

### Pay for API Call
```typescript
import { AgentPayySDK } from '@agentpayy/sdk';

const agentPay = new AgentPayySDK({
  network: 'base', // Connects to deployed AgentPayy contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call with automatic validation
const result = await agentPay.pay(
  'weather-api',
  { city: 'New York' },
  { price: '0.01' }
);

console.log(result); // Weather data + payment receipt
```

### Validate Payments (API Providers)
```typescript
// In your API endpoint
const isValid = await agentPay.validatePayment(txHash, inputData);
if (!isValid) {
  return { error: 'Payment required' };
}

// Process request and mark as validated
const response = await processRequest(inputData);
await agentPay.markValidated(txHash);
return response;
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
Netflix-style prepaid balance system:

```typescript
// Deposit to balance (one-time setup)
await agentPay.depositBalance('10.0'); // $10 USDC

// Check balance
const balance = await agentPay.getUserBalance();
console.log(`Balance: $${balance} USDC`);

// Automatic balance usage (no wallet popups)
const result = await agentPay.pay('weather-api', data, { price: '0.01' });

// Withdraw from prepaid balance (specific amount)
await agentPay.withdrawBalance('5.0'); // Withdraw $5 from balance

// Withdraw all earnings from API sales
await agentPay.withdraw(); // Withdraw all earnings to wallet
```

### Reputation System
Built-in agent discovery and reliability scoring:

```typescript
import { ReputationModule } from '@agentpayy/sdk';

const reputation = new ReputationModule(gatewayUrl);

// Get agent reputation
const agentRep = await reputation.getReputation(agentAddress);
console.log(`Rating: ${agentRep.rating}/5.0`);
console.log(`Success rate: ${agentRep.successRate}%`);

// Find specialists
const specialists = await reputation.findAgentsBySpecialty('weather-data', 4.0);

// Get leaderboard
const topAgents = await reputation.getLeaderboard(10);
```

## Architecture

```
Developer → AgentPayy SDK → Deployed Smart Contracts → API Provider
```

1. **Client** pays for API access via SDK
2. **Smart contract** processes payment and stores input hash
3. **API provider** validates payment and processes request
4. **Privacy preserved**: Only hashes on-chain, raw data direct to API

## Supported Networks

AgentPayy contracts are deployed and ready on:

- **Base** (8453) - Recommended for lowest fees
- **Arbitrum** (42161) - Fast finality
- **Optimism** (10) - Ethereum-compatible
- **Polygon** (137) - High throughput

## Framework Integrations

- **CrewAI**: Automatic payment handling for AI agents
- **LangChain**: Paid tool integration
- **Express**: Payment validation middleware
- **FastAPI**: Payment decorator system

## Use Cases

### AI Agent Workflows
```python
# CrewAI agent with paid API access
from crewai import Agent
from agentpayy import AgentPayyKit

agentpay = AgentPayyKit(private_key="0x...", chain="base")

def paid_market_data(symbol):
    return agentpay.pay_and_call(
        "market-data-api",
        {"symbol": symbol},
        {"price": "0.02"}
    )

trading_agent = Agent(
    role="Market Analyst",
    tools=[paid_market_data]
)
```

### Multi-Agent Revenue Sharing
```typescript
// Research pipeline with automatic attribution
const researchPipeline = await agentPay.payWithAttribution(
  'comprehensive-analysis',
  { topic: 'AI market trends' },
  [
    { recipient: '0xDataCollector', basisPoints: 2000 },  // 20%
    { recipient: '0xAnalyzer', basisPoints: 5000 },      // 50%
    { recipient: '0xSummarizer', basisPoints: 3000 }     // 30%
  ],
  { price: '0.25' }
);
```

### API Monetization
```typescript
// Express API with payment validation
app.post('/api/analysis', validatePayment, async (req, res) => {
  const analysis = await runAnalysis(req.body);
  await agentPay.markValidated(req.headers['x-agentpay-tx']);
  res.json(analysis);
});
```

### API Registration & Discovery
Register your API on-chain for automatic discovery:

```typescript
// Register API for monetization
await agentPay.registerModel({
  modelId: 'weather-api-v1',
  endpoint: 'https://api.myservice.com/weather',
  price: '0.02', // $0.02 per call
  category: 'Weather & Environment',
  tags: ['weather', 'forecast', 'temperature']
});

// Discover APIs by category
const weatherAPIs = await agentPay.getAPIsByCategory('Weather & Environment');

// Search APIs by tags
const forecastAPIs = await agentPay.searchAPIsByTag('forecast');

// Get API marketplace stats
const stats = await agentPay.getMarketplaceStats();
console.log(`${stats.totalAPIs} APIs available`);
```

## Key Features

- **Zero Setup**: No contract deployment, connect to existing network
- **Privacy-First**: Input/output data never stored on-chain
- **Sub-Cent Costs**: Enable $0.001-$0.01 API calls economically
- **Multi-Chain**: Deploy once, work across L2 networks
- **Attribution Engine**: Automatic revenue splitting across agents
- **Balance System**: Prepaid usage like Netflix/Spotify
- **Reputation Scoring**: Built-in agent discovery and reliability
- **API Discovery**: On-chain registry with categories and search
- **Framework Ready**: Integrations for popular AI/web frameworks
- **Open Source**: MIT license, community-driven development

## Getting Started

1. **[Deployment Status](./DEPLOYMENT_STEPS.md)** - ✅ Live on Base network!
2. **[TypeScript SDK Guide](./sdk/typescript/README.md)** - Single package installation
3. **[Python SDK Guide](./sdk/python/README.md)** - Python integration guide  
4. **[Integration Examples](./examples/)** - Framework-specific guides
5. **[AI Agent Guide](./AI_AGENT_GUIDE.md)** - Quick reference for AI agents

## Quick Install

```bash
# TypeScript/JavaScript
npm install @agentpayy/sdk

# Python  
pip install agentpayy
```

## Basic Usage

### TypeScript
```typescript
import { AgentPayySDK } from '@agentpayy/sdk';

const agentPay = new AgentPayySDK({
  network: 'base', // Uses deployed AgentPayy contracts
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const result = await agentPay.pay(
  'weather-api-v1',
  { city: 'New York' },
  { price: '0.01' }
);
```

### Python
```python
from agentpayy import AgentPayyKit

agentpay = AgentPayyKit(
    private_key="0x...",
    chain="base"  # Uses deployed AgentPayy contracts
)

# Pay for API call
result = agentpay.pay_and_call(
    "weather-api-v1",
    {"city": "New York"},
    {"price": "0.01"}
)
```

## Community

- **GitHub**: Issues, PRs, and discussions
- **Documentation**: Comprehensive guides and examples
- **Examples**: Real-world integration patterns

## License

MIT License - see [LICENSE](./LICENSE) for details.

---

*Built for the agent economy. Privacy-first by design.* 