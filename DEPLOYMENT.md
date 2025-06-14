# AgentPayy Deployment Guide

## Overview
AgentPayy uses **deployed smart contracts** - developers just install the SDK packages. This guide covers contract deployment for AgentPayy maintainers only.

## For Developers (Recommended)

### Quick Start
```bash
# TypeScript/JavaScript - Single package with all features
npm install @agentpayy/sdk

# Python - Complete integration package  
pip install agentpayy
```

### Usage
```typescript
import { AgentPayyKit } from '@agentpayy/sdk';

const agentPay = new AgentPayyKit({
  network: 'base', // Uses deployed AgentPayy contracts
  privateKey: process.env.PRIVATE_KEY
});
```

**No contract deployment needed** - connect to existing AgentPayy network.

## Package Publishing (For Maintainers)

### TypeScript SDK
```bash
cd sdk/typescript
npm run build
npm publish --access public
```

### Python SDK  
```bash
cd sdk/python
python setup.py sdist bdist_wheel
twine upload dist/*
```

## Smart Contract Deployment (Advanced)

### Prerequisites
- Foundry installed
- Private key with ETH for gas
- RPC URLs for target networks

### Deploy to Base
```bash
cd contracts
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

### Deploy to Multiple Networks
```bash
# Base
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_RPC_URL --broadcast --verify

# Arbitrum  
forge script script/Deploy.s.sol:DeployScript --rpc-url $ARBITRUM_RPC_URL --broadcast --verify

# Optimism
forge script script/Deploy.s.sol:DeployScript --rpc-url $OPTIMISM_RPC_URL --broadcast --verify
```

### Update SDK Contract Addresses
After deployment, update contract addresses in:
- `sdk/typescript/src/core/contracts.ts`
- `sdk/python/agentpay/contracts.py`

## Testing

### Contract Tests
```bash
cd contracts
forge test --gas-report
```

### SDK Tests  
```bash
# TypeScript
cd sdk/typescript
npm test

# Python
cd sdk/python  
python -m pytest
```

## Production Checklist

- [ ] All 34 contract tests pass
- [ ] Contracts deployed to Base, Arbitrum, Optimism
- [ ] SDK packages published to npm/PyPI
- [ ] Contract addresses updated in SDKs
- [ ] Documentation updated
- [ ] Example applications tested

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
npm install @agentpayy/sdk
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

- Check [GitHub Issues](https://github.com/DLhugly/AgentPayy/issues)
- Review component READMEs
- Test with mock mode first 