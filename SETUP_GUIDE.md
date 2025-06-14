# AgentPayy Setup & Deployment Guide

## 🚀 Quick Start

AgentPayy is ready for production deployment! This guide covers:
- Setting up publishing secrets
- Deploying smart contracts  
- Publishing SDKs to npm and PyPI
- Complete automation setup

## 📋 Current Status

✅ **Contracts**: 34 tests passing, production-ready  
✅ **TypeScript SDK**: 36 tests passing, ready for npm  
✅ **Python SDK**: Built and tested, ready for PyPI  
✅ **CI/CD Pipeline**: Automated testing and publishing configured  
⏳ **Secrets**: Need NPM_TOKEN and PYPI_TOKEN for publishing  

## 🔐 Required Secrets Setup

### 1. NPM Token (for @agentpayy/sdk)

**Create npm account** (if needed):
```bash
npm adduser
```

**Generate automation token**:
1. Go to https://www.npmjs.com/settings/tokens
2. Click "Generate New Token" 
3. Select "Automation" (for CI/CD)
4. Copy token (starts with `npm_`)

### 2. PyPI Token (for agentpayy package)

**Create PyPI account** (if needed):
- Register at https://pypi.org/account/register/

**Generate API token**:
1. Go to https://pypi.org/manage/account/token/
2. Click "Add API token"
3. Name: "AgentPayy GitHub Actions"
4. Scope: "Entire account" 
5. Copy token (starts with `pypi-`)

### 3. Add Secrets to GitHub

1. Go to https://github.com/AgentPayy/agentpayy
2. Navigate: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"** and add:

```
Name: NPM_TOKEN
Value: npm_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```
Name: PYPI_TOKEN  
Value: pypi-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 📦 Publishing SDKs

Once secrets are configured, publish with conventional commits:

```bash
# Initial release (minor version)
git commit -m "feat: initial SDK release with payment processing"
git push origin main

# Bug fixes (patch version)
git commit -m "fix: resolve contract interaction issues"

# Breaking changes (major version)
git commit -m "feat!: redesign payment API"
```

**Automated Publishing**:
- Pushes to `main` trigger GitHub Actions
- Semantic-release analyzes commits
- Automatically publishes to npm and PyPI
- Creates GitHub releases with changelogs

## 🌐 Smart Contract Deployment

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Set environment variables
export PRIVATE_KEY="0x..."           # Deployer private key
export TREASURY_ADDRESS="0x..."     # Treasury wallet address
export ETHERSCAN_API_KEY="..."      # For contract verification
```

### Deploy to Networks

**Single Network**:
```bash
cd contracts

# Deploy to Base (recommended first)
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $BASE_RPC_URL \
  --private-key $PRIVATE_KEY \
  --broadcast \
  --verify
```

**Multiple Networks**:
```bash
# Tier 1 Networks (Priority)
forge script script/Deploy.s.sol:DeployScript --rpc-url $BASE_RPC_URL --broadcast --verify
forge script script/Deploy.s.sol:DeployScript --rpc-url $ARBITRUM_RPC_URL --broadcast --verify  
forge script script/Deploy.s.sol:DeployScript --rpc-url $OPTIMISM_RPC_URL --broadcast --verify
forge script script/Deploy.s.sol:DeployScript --rpc-url $ETHEREUM_RPC_URL --broadcast --verify

# Tier 2 Networks
forge script script/Deploy.s.sol:DeployScript --rpc-url $UNICHAIN_RPC_URL --broadcast --verify
forge script script/Deploy.s.sol:DeployScript --rpc-url $WORLDCHAIN_RPC_URL --broadcast --verify
```

### Update Contract Addresses

After deployment, update addresses in:
- `sdk/typescript/src/core/contracts.ts`
- `sdk/python/agentpayy/contracts.py`

## 🌐 Supported Networks

| Network | Chain ID | Status | Priority |
|---------|----------|--------|----------|
| **Base** | 8453 | Ready | 🔥 Tier 1 |
| **Arbitrum** | 42161 | Ready | 🔥 Tier 1 |
| **Optimism** | 10 | Ready | 🔥 Tier 1 |
| **Ethereum** | 1 | Ready | 🔥 Tier 1 |
| **Unichain** | 1301 | Ready | ⚡ Tier 2 |
| **World Chain** | 480 | Ready | ⚡ Tier 2 |
| **Linea** | 59144 | Ready | ⚡ Tier 2 |
| **Blast** | 81457 | Ready | ⚡ Tier 2 |
| **Scroll** | 534352 | Ready | ⚡ Tier 2 |
| **Polygon zkEVM** | 1101 | Ready | ⚡ Tier 2 |
| **Mantle** | 5000 | Ready | ⚡ Tier 2 |

## 🧪 Testing

**Local Testing**:
```bash
# Test contracts
cd contracts && forge test --gas-report

# Test TypeScript SDK  
cd sdk/typescript && npm test

# Test Python SDK
cd sdk/python && python -m pytest
```

**CI/CD Testing**:
- All tests run automatically on push
- 70 total tests across all components
- Foundry integration for smart contracts

## 💰 Deployment Costs

| Network | Deployment Cost | Transaction Cost |
|---------|-----------------|------------------|
| Ethereum | $50-200 | $5-20 |
| Base | $1-5 | $0.001-0.01 |
| Arbitrum | $1-5 | $0.001-0.01 |
| Optimism | $1-5 | $0.001-0.01 |
| Other L2s | $0.5-2 | $0.0001-0.001 |

## 📋 Production Checklist

### Pre-Deployment
- [ ] Private key funded with gas tokens
- [ ] Treasury address configured  
- [ ] NPM_TOKEN added to GitHub secrets
- [ ] PYPI_TOKEN added to GitHub secrets
- [ ] RPC endpoints configured

### Deployment
- [ ] Contracts deployed to Base
- [ ] Contracts deployed to Arbitrum  
- [ ] Contracts deployed to Optimism
- [ ] Contracts verified on block explorers
- [ ] Contract addresses updated in SDKs

### Publishing
- [ ] TypeScript SDK published to npm
- [ ] Python SDK published to PyPI
- [ ] GitHub releases created
- [ ] Documentation updated

### Testing
- [ ] SDK installation tested
- [ ] Payment flows tested
- [ ] Multi-network functionality verified

## 🔧 Environment Variables

**Required for Deployment**:
```bash
PRIVATE_KEY=0x...                    # Deployer wallet
TREASURY_ADDRESS=0x...               # Treasury wallet
```

**Optional for Verification**:
```bash
ETHERSCAN_API_KEY=...               # Ethereum verification
BASESCAN_API_KEY=...                # Base verification  
ARBISCAN_API_KEY=...                # Arbitrum verification
OPTIMISTIC_ETHERSCAN_API_KEY=...    # Optimism verification
```

**Generated After Deployment**:
```bash
AGENTPAY_BASE_CORE=0x...            # Base contract addresses
AGENTPAY_BASE_ATTRIBUTION=0x...
AGENTPAY_BASE_RECEIPTS=0x...
```

## 🚨 Security Best Practices

- ✅ Never commit private keys to git
- ✅ Use hardware wallets for mainnet deployments
- ✅ Verify all contract addresses before use
- ✅ Monitor treasury address for unusual activity
- ✅ Test on testnets before mainnet deployment
- ✅ Keep deployment scripts and addresses backed up

## 🆘 Troubleshooting

### Common Issues

**Publishing Fails**:
```bash
# Check npm login
npm whoami

# Verify PyPI token
pip install --upgrade twine
```

**Contract Deployment Fails**:
```bash
# Check gas estimation
forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL

# Verify constructor arguments
forge verify-contract <address> <contract> --constructor-args <args>
```

**SDK Connection Issues**:
```bash
# Verify contract addresses
# Check RPC endpoints
# Test with mock mode first
```

### Getting Help

- 📖 Check [GitHub Issues](https://github.com/AgentPayy/agentpayy/issues)
- 📚 Review component READMEs
- 🧪 Test with mock mode first
- 💬 Join community discussions

## 🎯 Next Steps

1. **Set up secrets** (NPM_TOKEN, PYPI_TOKEN)
2. **Deploy to Base** (lowest cost, high adoption)
3. **Publish SDKs** with conventional commit
4. **Deploy to other networks** as needed
5. **Update documentation** with contract addresses

## 🚀 Ready to Launch!

Your AgentPayy project is production-ready with:
- ✅ 70 passing tests across all components
- ✅ Automated CI/CD pipeline
- ✅ Multi-network smart contract support
- ✅ TypeScript and Python SDKs
- ✅ Comprehensive documentation
- ✅ Security best practices

**Start with**: Add NPM_TOKEN and PYPI_TOKEN to GitHub secrets, then make your first release commit! 