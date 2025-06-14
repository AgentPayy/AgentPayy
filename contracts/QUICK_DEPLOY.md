# 🚀 Quick Deploy Guide

Deploy AgentPayy to **Optimism**, **Arbitrum**, **Ethereum mainnet**, **Base**, **Worldchain**, and **Unichain** in 3 steps.

## Prerequisites

```bash
export PRIVATE_KEY="0x..."                    # Your deployer private key
export ALCHEMY_API_KEY="..."                  # For Ethereum mainnet
export ETHERSCAN_API_KEY="..."                # For verification
export BASESCAN_API_KEY="..."                 # For Base verification
export ARBISCAN_API_KEY="..."                 # For Arbitrum verification
export OPTIMISTIC_ETHERSCAN_API_KEY="..."     # For Optimism verification
```

## Step 1: Create Gnosis Safes

```bash
# Create 2/3 multisig safes on all target networks
npm run safe:create:target -- --owners 0xAddr1,0xAddr2,0xAddr3 --threshold 2
```

## Step 2: Deploy Contracts

```bash
# Deploy to all target networks
npm run governance:deploy:target

# Or use the convenience script
./deploy-target-networks.sh
```

## Step 3: Verify & Test

```bash
# Check deployment status
forge script script/DeployWithGovernance.s.sol --rpc-url base --broadcast --verify
```

## 🎯 Target Networks

| Network | Chain ID | Cost | Time | Features |
|---------|----------|------|------|----------|
| **Base** | 8453 | ~$3 | 2s | Consumer apps, Coinbase integration |
| **Arbitrum** | 42161 | ~$3 | 1s | DeFi ecosystem, high TVL |
| **Optimism** | 10 | ~$3 | 2s | Superchain, public goods |
| **Ethereum** | 1 | ~$100 | 15s | Maximum security, institutions |
| **Worldchain** | 480 | ~$1 | 2s | World ID, human verification |
| **Unichain** | 1301 | ~$1 | 1s | DeFi-first, MEV protection |

**Total Cost: ~$111** (varies with gas prices)

## 🔐 Security Features

- **Gnosis Safe**: Multi-signature control
- **Timelock**: 24-48 hour delays
- **Roles**: Emergency + routine governance
- **Upgradeable**: Future-proof architecture

## 📱 Quick Commands

```bash
# Individual network deployment
npm run governance:deploy:base
npm run governance:deploy:arbitrum
npm run governance:deploy:optimism
npm run governance:deploy:ethereum
npm run governance:deploy:worldchain
npm run governance:deploy:unichain

# Create safes for specific networks
npm run safe:create -- --networks base,arbitrum --owners 0x... --threshold 2

# Build and test
npm run build
npm run test
```

## 🎉 Success!

After deployment you'll have:
- ✅ Multi-chain presence across 6 networks
- ✅ Production-ready security
- ✅ Unified governance system
- ✅ Network-specific optimizations

Ready to process payments! 🚀 