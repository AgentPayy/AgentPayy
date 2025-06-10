# AgentPayKit - Universal Payment Infrastructure for AI Agents

> **Sub-cent API payments with smart wallets across 13 networks**

🚀 **Built for the AI Era**: The first payment system designed for AI agents with gasless transactions, mock mode testing, and network effect monetization.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![Multi-Chain](https://img.shields.io/badge/Networks-13%20Supported-green.svg)](https://github.com/DLhugly/AgentPay)

## ✨ Key Features

### 🔑 Universal Wallets
- **Instant generation** - Smart accounts with gasless transactions
- **BYOW support** - MetaMask, Coinbase, WalletConnect integration
- **13 networks** - Ethereum + top L2s (Base, Arbitrum, Optimism, etc.)
- **Mock mode** - Test APIs without payment setup

### 💰 Smart Payment System  
- **Dual model** - Netflix-style balance + permit fallback
- **Sub-cent payments** - $0.001 minimum on L2s
- **Automatic routing** - Balance first, permit if insufficient
- **Network effects** - Same wallet earns AND spends

### 🤖 AI Agent Ready
- **CrewAI integration** - Native paywall tools
- **LangChain support** - One-line API monetization
- **FastAPI wrapper** - Decorator-based paywalls
- **Python/TypeScript** - Complete SDK coverage

## 🚀 Quick Start

### CLI (Fastest)

```bash
# Install CLI
npm install -g @agentpay/cli

# Generate smart wallet
agentpay generate-wallet --smart --name "my-agent"

# Test API without payment
agentpay mock weather-api '{"city":"NYC"}'

# Setup complete agent
agentpay setup --name "My AI Agent"
```

### TypeScript SDK

```typescript
import { EnhancedAgentPayKit } from '@agentpay/sdk';

const agentpay = new EnhancedAgentPayKit();

// Generate smart wallet
const wallet = await agentpay.generateWallet({ smart: true });

// Make API call with payment
const result = await agentpay.payAndCall('weather-api', 
  { city: 'NYC' }, 
  { price: '0.01' }
);
```

### Python SDK

```python
from agentpay import AgentPayKit

agentpay = AgentPayKit(private_key="0x...", chain="base")

# Make API call with payment
result = agentpay.pay_and_call(
    model_id="weather-api",
    input_data={"city": "NYC"},
    price="0.01"
)
```

## 💡 Examples

### AI Agent (CrewAI)
```python
from agentpay.crewai import AgentPayTool

weather_tool = AgentPayTool("weather-api", "0.01", "Get weather data")
agent = Agent(role="Analyst", tools=[weather_tool])
result = agent.execute("What's the weather in NYC?")
```

### API Monetization
```bash
# Register your API
agentpay register-api my-api 0.05 --endpoint "https://api.example.com"

# Users pay automatically when calling your API
# Withdraw earnings anytime
agentpay earnings withdraw
```

### FastAPI Integration
```python
from agentpay import require_payment

@app.post("/premium")
@require_payment("analysis-api", "0.25")
async def premium_analysis(data: dict):
    return {"analysis": "results...", "paid": True}
```

## 📚 Supported Networks

| Network | Chain ID | Gas Cost | Use Case |
|---------|----------|----------|----------|
| **Ethereum** | 1 | $5-20 | Enterprise |
| **Base** | 8453 | $0.001 | Consumer apps |
| **Arbitrum** | 42161 | $0.001 | DeFi |
| **Optimism** | 10 | $0.001 | Superchain |
| **Unichain** | 1301 | $0.0005 | DEX |
| **World Chain** | 480 | $0.0001 | Identity |
| **Starknet** | SN_MAIN | $0.0001 | ZK privacy |
| **zkSync Era** | 324 | $0.0005 | ZK scale |
| + 5 more L2s | - | $0.0001-0.0005 | Various |

## 🛠️ Components

- **[Smart Contracts](contracts/)** - Solidity contracts for 13 networks
- **[TypeScript SDK](sdk/typescript/)** - Full-featured client library
- **[Python SDK](sdk/python/)** - AI framework integrations
- **[CLI Tool](cli/)** - Developer command-line interface  
- **[Gateway](gateway/)** - Payment processing service
- **[Examples](examples/)** - Working demos and tutorials

## 🚀 Deployment

```bash
# Install dependencies
npm install

# Deploy to top networks
cd contracts
npm run deploy:tier1  # Base, Arbitrum, Optimism, Ethereum

# Start gateway
cd gateway && npm start

# Install CLI globally
npm install -g @agentpay/cli
```

## 📊 Revenue Potential

- **Developers**: $1K-$10K/month from API monetization
- **AI Agents**: $500-$5K/month in consumption efficiency  
- **Enterprise**: $10K-$100K/month from ecosystem usage
- **Network Effects**: 250x revenue potential through dual usage

## 🌐 Multi-Chain Support

## 🔧 Architecture

```
Client/SDK → Gateway → Smart Contract → API Endpoint
     ↓          ↓           ↓            ↓
  Request → Verify → Process → Response
```

## 📈 Roadmap

- ✅ **Core Infrastructure**: Universal wallets, smart accounts, dual payments
- 🚧 **Advanced Features**: Social recovery, session keys, cross-chain  
- 🎯 **Ecosystem Growth**: API marketplace, analytics, white-label
- 🌟 **Viral Scale**: Network amplification, partnerships, global expansion

## 🤝 Contributing

```bash
git clone https://github.com/DLhugly/AgentPay.git
npm install && npm run build && npm test
```

## 📜 License

MIT License

## 🆘 Support

- **Docs**: [Complete guides](docs/)
- **Issues**: [GitHub Issues](https://github.com/DLhugly/AgentPay/issues)

---

**🚀 Ready to monetize the API economy? `npm install -g @agentpay/cli`** 