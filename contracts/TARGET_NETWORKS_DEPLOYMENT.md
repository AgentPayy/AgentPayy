# 🎯 AgentPayy Target Networks Deployment

Complete deployment guide for AgentPayy across your target networks: **Optimism**, **Arbitrum**, **Ethereum mainnet**, **Base**, **Worldchain**, and **Unichain**.

## 🌐 Target Networks Overview

| Network | Chain ID | Type | Timelock Delay | Priority |
|---------|----------|------|----------------|----------|
| **Base** | 8453 | L2 (Optimistic) | 24 hours | 🔥 Primary |
| **Arbitrum** | 42161 | L2 (Optimistic) | 24 hours | 🔥 Primary |
| **Optimism** | 10 | L2 (Optimistic) | 24 hours | 🔥 Primary |
| **Ethereum** | 1 | L1 | 48 hours | 🏛️ Mainnet |
| **Worldchain** | 480 | L2 (World ID) | 24 hours | 🌍 Identity |
| **Unichain** | 1301 | L2 (DeFi) | 24 hours | 🦄 DeFi |

## 🚀 Quick Deployment

### Step 1: Prerequisites

```bash
# Install dependencies
cd contracts
npm install

# Set up environment variables
export PRIVATE_KEY="0x..."                    # Your deployer private key
export ALCHEMY_API_KEY="..."                  # For Ethereum mainnet
export ETHERSCAN_API_KEY="..."                # For contract verification
export BASESCAN_API_KEY="..."                 # For Base verification
export ARBISCAN_API_KEY="..."                 # For Arbitrum verification
export OPTIMISTIC_ETHERSCAN_API_KEY="..."     # For Optimism verification
```

### Step 2: Create Gnosis Safes

```bash
# Create Gnosis Safes on all target networks
npm run safe:create:target -- --owners 0xYourAddr1,0xYourAddr2,0xYourAddr3 --threshold 2

# This creates 2/3 multisig safes on:
# - Base, Arbitrum, Optimism, Ethereum, Worldchain, Unichain
```

### Step 3: Deploy with Governance

```bash
# Deploy to all target networks
npm run governance:deploy:target

# Or deploy individually:
npm run governance:deploy:base
npm run governance:deploy:arbitrum
npm run governance:deploy:optimism
npm run governance:deploy:ethereum
npm run governance:deploy:worldchain
npm run governance:deploy:unichain
```

## 🔧 Detailed Network Setup

### 🔵 Base (Primary L2)

**Why Base?**
- Coinbase's L2 with massive user base
- Low gas costs and fast transactions
- Strong ecosystem support

```bash
# Deploy to Base
npm run governance:deploy:base

# Expected costs: ~$1-5 USD
# Transaction time: ~2 seconds
```

**Base-Specific Features:**
- Coinbase Smart Wallet integration
- Fiat on-ramps
- Consumer-friendly UX

### 🔴 Arbitrum (Leading L2)

**Why Arbitrum?**
- Largest L2 by TVL
- Mature DeFi ecosystem
- Excellent developer tools

```bash
# Deploy to Arbitrum
npm run governance:deploy:arbitrum

# Expected costs: ~$1-5 USD
# Transaction time: ~1-2 seconds
```

**Arbitrum-Specific Features:**
- Fast finality
- EVM equivalence
- Strong DeFi integrations

### 🔴 Optimism (Superchain)

**Why Optimism?**
- Part of Superchain ecosystem
- Strong governance and grants
- Public goods focus

```bash
# Deploy to Optimism
npm run governance:deploy:optimism

# Expected costs: ~$1-5 USD
# Transaction time: ~2 seconds
```

**Optimism-Specific Features:**
- OP Stack technology
- Retroactive public goods funding
- Superchain interoperability

### 🏛️ Ethereum Mainnet (Security)

**Why Ethereum?**
- Maximum security and decentralization
- Largest developer ecosystem
- Institutional adoption

```bash
# Deploy to Ethereum (higher gas costs)
npm run governance:deploy:ethereum

# Expected costs: ~$50-200 USD
# Transaction time: ~15 seconds
# Timelock delay: 48 hours (enhanced security)
```

**Ethereum-Specific Features:**
- Maximum security
- Institutional trust
- Premium positioning

### 🌍 Worldchain (Identity)

**Why Worldchain?**
- World ID integration for human verification
- Privacy-preserving identity
- Growing ecosystem

```bash
# Deploy to Worldchain
npm run governance:deploy:worldchain

# Expected costs: ~$0.50-2 USD
# Transaction time: ~2 seconds
```

**Worldchain-Specific Features:**
- Human verification via World ID
- Privacy-preserving proofs
- Sybil resistance

### 🦄 Unichain (DeFi)

**Why Unichain?**
- Uniswap's dedicated L2
- DeFi-optimized infrastructure
- MEV protection

```bash
# Deploy to Unichain
npm run governance:deploy:unichain

# Expected costs: ~$0.50-2 USD
# Transaction time: ~1 second
```

**Unichain-Specific Features:**
- Uniswap V4 hooks
- MEV protection
- DeFi-first design

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] Private key funded on all networks
- [ ] API keys configured for verification
- [ ] Team addresses collected for Gnosis Safes
- [ ] Environment variables set

### Gnosis Safe Creation
- [ ] Base Safe created
- [ ] Arbitrum Safe created
- [ ] Optimism Safe created
- [ ] Ethereum Safe created
- [ ] Worldchain Safe created
- [ ] Unichain Safe created

### Contract Deployment
- [ ] Base contracts deployed
- [ ] Arbitrum contracts deployed
- [ ] Optimism contracts deployed
- [ ] Ethereum contracts deployed
- [ ] Worldchain contracts deployed
- [ ] Unichain contracts deployed

### Verification
- [ ] All contracts verified on explorers
- [ ] Governance setup tested
- [ ] Safe URLs documented
- [ ] Environment variables updated

## 💰 Cost Breakdown

| Network | Safe Creation | Contract Deployment | Total Est. |
|---------|---------------|-------------------|------------|
| **Base** | ~$0.50 | ~$3 | ~$3.50 |
| **Arbitrum** | ~$0.50 | ~$3 | ~$3.50 |
| **Optimism** | ~$0.50 | ~$3 | ~$3.50 |
| **Ethereum** | ~$10 | ~$100 | ~$110 |
| **Worldchain** | ~$0.25 | ~$1 | ~$1.25 |
| **Unichain** | ~$0.25 | ~$1 | ~$1.25 |
| **TOTAL** | ~$12 | ~$111 | ~$123 |

*Costs vary with gas prices and network congestion*

## 🔐 Security Configuration

### Timelock Delays
- **Ethereum**: 48 hours (maximum security)
- **All L2s**: 24 hours (balanced security/agility)

### Gnosis Safe Thresholds
- **Recommended**: 2/3 for small teams, 3/5 for larger teams
- **Emergency**: Consider lower threshold for urgent actions

### Multi-Network Governance
Each network has independent governance but same team controls all Safes.

## 🛠️ Post-Deployment Setup

### 1. Update SDK Addresses

```typescript
// Update sdk/typescript/src/core/contracts.ts
export const CONTRACTS = {
  base: '0x...AgentPayyCoreAddress',
  arbitrum: '0x...AgentPayyCoreAddress',
  optimism: '0x...AgentPayyCoreAddress',
  ethereum: '0x...AgentPayyCoreAddress',
  worldchain: '0x...AgentPayyCoreAddress',
  unichain: '0x...AgentPayyCoreAddress'
};
```

### 2. Register Initial Models

```bash
# Register USDC payment models on each network
# Base USDC: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
# Arbitrum USDC: 0xaf88d065e77c8cC2239327C5EDb3A432268e5831
# Optimism USDC: 0x0b2C639c533813f4AA9D7837CAf62653d097Ff85
# Ethereum USDC: 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
```

### 3. Monitor Governance

Access your Gnosis Safes:
- **Base**: https://app.safe.global/base:0xYourSafeAddress
- **Arbitrum**: https://app.safe.global/arb1:0xYourSafeAddress
- **Optimism**: https://app.safe.global/oeth:0xYourSafeAddress
- **Ethereum**: https://app.safe.global/eth:0xYourSafeAddress
- **Worldchain**: https://app.safe.global/worldchain:0xYourSafeAddress
- **Unichain**: https://app.safe.global/unichain:0xYourSafeAddress

## 🎯 Network-Specific Strategies

### Base Strategy
- Focus on consumer applications
- Integrate Coinbase Smart Wallet
- Leverage Coinbase's user base

### Arbitrum Strategy
- Target DeFi protocols
- Leverage high TVL ecosystem
- Focus on complex financial products

### Optimism Strategy
- Apply for OP grants
- Focus on public goods
- Leverage Superchain ecosystem

### Ethereum Strategy
- Premium positioning
- Institutional clients
- Maximum security features

### Worldchain Strategy
- Human-verified APIs
- Identity-based features
- Privacy-preserving applications

### Unichain Strategy
- DeFi-first features
- MEV-protected transactions
- Uniswap ecosystem integration

## 🚨 Emergency Procedures

### Network-Specific Issues
If one network has issues:
1. **Pause affected network** contracts
2. **Continue operations** on other networks
3. **Communicate** with users about status
4. **Fix and redeploy** when ready

### Cross-Network Coordination
- Use same Gnosis Safe team across networks
- Coordinate governance actions
- Maintain consistent policies

## 📊 Success Metrics

### Deployment Success
- [ ] All 6 networks deployed
- [ ] All contracts verified
- [ ] All Safes operational
- [ ] Governance tested

### Operational Success
- [ ] First API models registered
- [ ] First payments processed
- [ ] SDK updated and tested
- [ ] Documentation complete

## 🎉 Launch Ready!

Once deployed across all target networks, you'll have:

✅ **Multi-Chain Presence** across 6 major networks  
✅ **Unified Governance** with Gnosis Safe control  
✅ **Network-Specific Optimization** for each ecosystem  
✅ **Production-Ready Security** with timelocks  
✅ **Future-Proof Architecture** for scaling  

Your AgentPayy ecosystem is now ready for multi-chain production deployment! 🚀

## 🆘 Support

- **Documentation**: See `GOVERNANCE_DEPLOYMENT.md` for detailed governance guide
- **Issues**: Create GitHub issues for problems
- **Community**: Join Discord for support (coming soon)

---

**Ready to deploy?** Run `npm run safe:create:target` to get started! 🎯 