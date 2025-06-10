# AgentPayKit Documentation

> **Pay-per-call SDK for AI agents** - Monetize any API endpoint with sub-cent stablecoin payments on Layer 2s.

## 🚀 Quick Start

### TypeScript/JavaScript
```typescript
import { AgentPayKit } from '@agentpay/sdk';
import { ethers } from 'ethers';

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
const agentpay = new AgentPayKit(wallet, 'base');

// Make a paid API call
const result = await agentpay.payAndCall('weather-v1', 
  { city: 'NYC' }, 
  { price: '0.005' }
);
```

### Python
```python
from agentpay import pay_and_call

# One-line paid API call
result = pay_and_call('weather-v1', {'city': 'NYC'}, '0.005')
```

### CrewAI Integration
```python
from agentpay.crewai import WeatherTool

# Use paid tools in CrewAI agents
weather_tool = WeatherTool()
agent = Agent(tools=[weather_tool])
```

### LangChain Integration
```python
from agentpay.langchain import WeatherTool

# Use paid tools in LangChain agents
tools = [WeatherTool()]
agent = initialize_agent(tools, llm)
```

## 📖 Core Concepts

### Models
A **model** is a registered API endpoint that accepts payments:
- **Model ID**: Unique identifier (e.g., "weather-v1")
- **Endpoint**: URL where requests are sent
- **Price**: Cost per call in USDC
- **Owner**: Address that receives payments

### Payment Flow
1. **Register** your API endpoint as a model
2. **Users pay** with USDC on Layer 2 (Base/Arbitrum)
3. **Gateway forwards** the request to your API
4. **You receive** 90% of payment (10% platform fee)

### Smart Wallet Support
AgentPayKit automatically detects and supports:
- ✅ **Smart Contract Wallets** (Account Abstraction)
- ✅ **EOA Wallets** with EIP-2612 permit()
- ✅ **Multi-sig wallets**
- ✅ **Social recovery wallets**

## 🛠️ Installation

### TypeScript SDK
```bash
npm install @agentpay/sdk ethers
```

### Python SDK
```bash
pip install agentpay

# With AI framework support
pip install agentpay[crewai,langchain]
```

### CLI Tool
```bash
npm install -g @agentpay/cli
```

## 🔧 API Reference

### TypeScript SDK

#### AgentPayKit Class
```typescript
class AgentPayKit {
  constructor(
    signerOrProvider: Wallet | JsonRpcProvider,
    chain: 'base' | 'arbitrum' | 'optimism' = 'base'
  )

  async payAndCall(
    modelId: string,
    input: any,
    options: PaymentOptions
  ): Promise<any>

  async registerModel(config: ModelConfig): Promise<string>
  async getModel(modelId: string): Promise<Model>
}
```

#### Payment Options
```typescript
interface PaymentOptions {
  price: string;           // Price in USDC (e.g., "0.01")
  chain?: string;          // Network: "base", "arbitrum", "optimism"
  deadline?: number;       // Unix timestamp (default: 1 hour)
}
```

### Python SDK

#### AgentPayKit Class
```python
class AgentPayKit:
    def __init__(self, private_key: str, chain: str = "base")
    
    def pay_and_call(
        self, 
        model_id: str, 
        input_data: Any, 
        options: PaymentOptions
    ) -> Dict[str, Any]
    
    def register_model(self, config: ModelConfig) -> str
```

#### Convenience Function
```python
def pay_and_call(
    model_id: str, 
    input_data: Any, 
    price: str, 
    private_key: str = None, 
    chain: str = "base"
) -> Dict[str, Any]
```

## 🏗️ Building Paid APIs

### 1. Create Your API
```python
# FastAPI example
from fastapi import FastAPI, Request
from agentpay.fastapi import agentpay

app = FastAPI()

@app.post("/weather")
@agentpay.paywall("weather-v1", "0.01", "Weather data API")
async def get_weather(request: Request, data: dict):
    city = data.get("city")
    return {"city": city, "temp": 72, "condition": "sunny"}
```

### 2. Register Your Model
```bash
agentpay register
# Model ID: weather-v1
# Endpoint: https://your-api.com/weather
# Price: 0.01
```

### 3. Start Earning
Your API is now monetized! Users pay USDC to call it.

## 🤖 AI Framework Integrations

### CrewAI Tools
```python
from agentpay.crewai import PayableTool, paid_tool

# Class-based tool
class WeatherTool(PayableTool):
    model_id = "weather-v1"
    price = "0.01"
    
    def _run(self, city: str) -> str:
        return super()._run(city=city)

# Decorator-based tool
@paid_tool("analysis-v1", "0.05")
def market_analysis(payment_result, **kwargs):
    return f"Analysis: {payment_result}"
```

### LangChain Tools
```python
from agentpay.langchain import PayableLangChainTool

class WeatherTool(PayableLangChainTool):
    name = "weather_lookup"
    description = "Get weather data. Costs 0.01 USDC."
    model_id = "weather-v1"
    price = "0.01"
```

## 🌐 Network Support

### Base (Recommended)
- **RPC**: `https://mainnet.base.org`
- **Chain ID**: 8453
- **USDC**: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- **Gas**: ~$0.01 per transaction

### Arbitrum One
- **RPC**: `https://arb1.arbitrum.io/rpc`
- **Chain ID**: 42161
- **USDC**: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- **Gas**: ~$0.02 per transaction

### Optimism
- **RPC**: `https://mainnet.optimism.io`
- **Chain ID**: 10
- **USDC**: `0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85`
- **Gas**: ~$0.01 per transaction

## 💰 Economics

### Pricing Guidelines
- **Simple data**: $0.001 - $0.005 per call
- **API aggregation**: $0.005 - $0.02 per call
- **AI/ML inference**: $0.02 - $0.10 per call
- **Premium analysis**: $0.05 - $0.50 per call

### Revenue Split
- **API Owner**: 90% of payment
- **Platform Fee**: 10% of payment
- **Gas costs**: Paid by user (~$0.01 on L2s)

### Example Economics
```
100 calls/day × $0.01 = $1.00/day
Your share: $0.90/day = $27/month
Platform fee: $0.10/day = $3/month
```

## 🔐 Security

### Payment Security
- ✅ **On-chain verification**: All payments verified on blockchain
- ✅ **Replay protection**: Nonces prevent duplicate payments
- ✅ **Deadline protection**: Payments expire automatically
- ✅ **Smart wallet support**: Works with multi-sig and social recovery

### API Security
- ✅ **Payment headers**: Verify `x-agentpay-txhash` and `x-agentpay-payer`
- ✅ **Gateway verification**: Requests come from trusted gateway
- ✅ **Rate limiting**: Built-in protection against abuse
- ✅ **Input validation**: Always validate request data

## 🚀 Deployment

### Environment Variables
```bash
# Required
PRIVATE_KEY=0x...                    # Your Ethereum private key
AGENTPAY_GATEWAY_URL=http://...      # Gateway URL

# Network contracts (set automatically)
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...
```

### Docker Deployment
```dockerfile
FROM node:18
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
```

### Vercel Deployment
```json
{
  "functions": {
    "api/**/*.js": {
      "runtime": "@vercel/node"
    }
  },
  "env": {
    "PRIVATE_KEY": "@private_key",
    "AGENTPAY_GATEWAY_URL": "https://gateway.agentpay.org"
  }
}
```

## 📊 Analytics & Monitoring

### Model Statistics
```typescript
const model = await agentpay.getModel("weather-v1");
console.log({
  totalCalls: model.totalCalls,
  totalRevenue: model.totalRevenue,
  active: model.active
});
```

### Payment Tracking
```python
# Track payments in your API
def track_payment(tx_hash: str, payer: str, amount: str):
    print(f"Payment received: {amount} USDC from {payer}")
    # Log to your analytics system
```

## 🛠️ Advanced Usage

### Cross-Chain Payments
```typescript
// Pay on Base, execute on Arbitrum (coming soon)
const result = await agentpay.payAndCall("model-v1", input, {
  price: "0.01",
  paymentChain: "base",
  executionChain: "arbitrum"
});
```

### Batch Payments
```typescript
// Pay for multiple calls at once (coming soon)
const results = await agentpay.batchPayAndCall([
  { modelId: "weather-v1", input: { city: "NYC" }, price: "0.01" },
  { modelId: "prices-v1", input: { symbol: "BTC" }, price: "0.005" }
]);
```

### Custom Payment Logic
```python
# Custom payment verification
class CustomPaymentVerifier:
    def verify_payment(self, tx_hash: str) -> bool:
        # Your custom verification logic
        return True
```

## 🤝 Community & Support

### Resources
- **GitHub**: [github.com/agentpaykit/agentpaykit](https://github.com/agentpaykit/agentpaykit)
- **Discord**: [discord.gg/agentpaykit](https://discord.gg/agentpaykit)
- **Twitter**: [@agentpaykit](https://twitter.com/agentpaykit)
- **Docs**: [docs.agentpay.org](https://docs.agentpay.org)

### Getting Help
1. **Check the docs** - Most questions are answered here
2. **Search GitHub issues** - Someone might have asked already
3. **Join Discord** - Get help from the community
4. **Open an issue** - Report bugs or request features

### Contributing
We welcome contributions! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built for the agent economy. Ready for production. Open source forever.** 