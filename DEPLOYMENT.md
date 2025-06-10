# AgentPayKit Deployment Guide

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

### 3. Start Gateway

```bash
cd gateway
npm install

# Set contract addresses
export AGENTPAY_BASE_CONTRACT="0x..."
export AGENTPAY_ARBITRUM_CONTRACT="0x..."
export REDIS_URL="redis://localhost:6379"

npm start
```

### 4. Install CLI

```bash
npm install -g @agentpay/cli
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
- [ ] Gateway configured with contract addresses
- [ ] Gateway deployed and accessible
- [ ] CLI installed and tested
- [ ] SDK packages published to npm

## 🔧 Production Setup

### Environment Variables

```bash
# Deployment
PRIVATE_KEY=0x...
TREASURY_ADDRESS=0x...

# Gateway
REDIS_URL=redis://localhost:6379
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...
AGENTPAY_OPTIMISM_CONTRACT=0x...
AGENTPAY_ETHEREUM_CONTRACT=0x...

# Smart Wallet Providers (optional)
BICONOMY_PAYMASTER_API_KEY=...
ZERODEV_API_KEY=...
ALCHEMY_API_KEY=...
```

### Docker Deployment

```bash
# Build and deploy gateway
docker build -t agentpay-gateway ./gateway
docker run -p 3000:3000 agentpay-gateway
```

## 🧪 Testing

```bash
# Test CLI
agentpay generate-wallet --smart --name "test-wallet"
agentpay mock weather-api '{"city":"NYC"}'

# Test SDK
cd sdk/typescript && npm test
cd sdk/python && python -m pytest
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
- Keep gateway logs for auditing

## 🆘 Troubleshooting

### Common Issues

```bash
# Gas estimation failed
# Solution: Increase gas limit or check network congestion

# Contract verification failed
# Solution: Verify constructor arguments match deployment

# Gateway connection failed
# Solution: Check Redis connection and contract addresses
```

### Getting Help

- Check [GitHub Issues](https://github.com/DLhugly/AgentPay/issues)
- Review component READMEs
- Test with mock mode first 