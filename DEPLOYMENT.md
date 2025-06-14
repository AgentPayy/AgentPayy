# AgentPay Integration Guide

## For Developers (Recommended)

### Install SDK
```bash
npm install @agentpay/sdk
```

### Connect to Network
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base', // Uses deployed AgentPay contracts
  privateKey: process.env.PRIVATE_KEY
});
```

### Available Networks
- **base**: 0x... (recommended - lowest fees)
- **arbitrum**: 0x... (fast finality)
- **optimism**: 0x... (Ethereum-compatible)
- **polygon**: 0x... (high throughput)

## For API Providers

### Validate Payments
```typescript
// In your API endpoint
const isValid = await agentPay.validatePayment(txHash, inputData);
```

### Integration Examples
- Express middleware
- FastAPI decorators
- Next.js API routes

---

## Contract Deployment (Advanced)

For those who need custom contract deployment:

```bash
cd contracts
forge build
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast --verify
```

### Environment Variables
```bash
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
BASE_RPC_URL=...
```

## Environment Variables

```bash
PRIVATE_KEY=0x...
ETHERSCAN_API_KEY=...
BASE_RPC_URL=...
ARBITRUM_RPC_URL=...
OPTIMISM_RPC_URL=...
```

## Networks
- Base (8453)
- Arbitrum (42161) 
- Optimism (10)
- Polygon (137)

## SDK Installation

```bash
npm install @agentpay/sdk
```

## 🚀 Quick Deploy

### 1. Environment Setup

```bash
# Required
export PRIVATE_KEY="0x..."
export TREASURY_ADDRESS="0x..."

# Optional - For verification
export ETHERSCAN_API_KEY="..."
export BASESCAN_API_KEY="..."
```

### 2. Deploy Smart Contracts

```bash
cd contracts
npm install

# Deploy to top networks
npm run deploy:base
npm run deploy:arbitrum
npm run deploy:optimism
npm run deploy:ethereum

# Deploy to all 13 networks
npm run deploy:all
```

### 3. Install SDK

```bash
npm install @agentpay/sdk
```

## 🌐 Supported Networks

| Network | Chain ID | Command | Priority |
|---------|----------|---------|----------|
| **Base** | 8453 | `npm run deploy:base` | 🔥 Tier 1 |
| **Arbitrum** | 42161 | `npm run deploy:arbitrum` | 🔥 Tier 1 |
| **Optimism** | 10 | `npm run deploy:optimism` | 🔥 Tier 1 |
| **Ethereum** | 1 | `npm run deploy:ethereum` | 🔥 Tier 1 |
| **Unichain** | 1301 | `npm run deploy:unichain` | ⚡ Tier 2 |
| **World Chain** | 480 | `npm run deploy:worldchain` | ⚡ Tier 2 |
| **Starknet** | SN_MAIN | `npm run deploy:starknet` | ⚡ Tier 2 |
| **zkSync Era** | 324 | `npm run deploy:zksync` | ⚡ Tier 2 |
| **Linea** | 59144 | `npm run deploy:linea` | ⚡ Tier 2 |
| **Blast** | 81457 | `npm run deploy:blast` | ⚡ Tier 2 |
| **Scroll** | 534352 | `npm run deploy:scroll` | ⚡ Tier 2 |
| **Polygon zkEVM** | 1101 | `npm run deploy:polygon-zkevm` | ⚡ Tier 2 |
| **Mantle** | 5000 | `npm run deploy:mantle` | ⚡ Tier 2 |

## 📋 Deployment Checklist

- [ ] Private key funded with gas tokens
- [ ] Treasury address configured
- [ ] Contracts deployed to target networks
- [ ] Contract addresses verified on explorers
- [ ] SDK installed and tested
- [ ] SDK packages published to npm

## 🔧 Production Setup



## 🧪 Testing

```bash
# Test SDK
cd sdk/typescript && npm test
cd contracts && forge test
```

## 📊 Cost Estimates

| Network | Deployment Cost | Transaction Cost |
|---------|-----------------|------------------|
| Ethereum | $50-200 | $5-20 |
| Base | $1-5 | $0.001-0.01 |
| Arbitrum | $1-5 | $0.001-0.01 |
| Optimism | $1-5 | $0.001-0.01 |
| Other L2s | $0.5-2 | $0.0001-0.001 |

## 🚨 Security

- Never commit private keys
- Use hardware wallets for mainnet
- Verify contract addresses before use
- Monitor treasury address
- Monitor smart contract events

## 🆘 Troubleshooting

### Common Issues

```bash
# Gas estimation failed
# Solution: Increase gas limit or check network congestion

# Contract verification failed
# Solution: Verify constructor arguments match deployment

# SDK connection failed
# Solution: Check RPC endpoints and contract addresses
```

### Getting Help

- Check [GitHub Issues](https://github.com/DLhugly/AgentPay/issues)
- Review component READMEs
- Test with mock mode first 