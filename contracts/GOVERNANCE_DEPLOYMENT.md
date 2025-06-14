# 🏛️ AgentPayy Governance Deployment Guide

Complete guide for deploying AgentPayy with production-ready governance using OpenZeppelin timelocks and Gnosis Safe multi-signature wallets.

## 🎯 Overview

This deployment system provides:
- **Timelock Governance**: 24-48 hour delays for security
- **Gnosis Safe Integration**: Multi-signature control
- **Factory Pattern**: Deterministic addresses across networks
- **Multi-Chain Support**: Deploy to 10+ networks simultaneously
- **Future-Proof**: Upgradeable and extensible architecture

## 🚀 Quick Start

### 1. Prerequisites

```bash
# Install dependencies
npm install

# Required environment variables
export PRIVATE_KEY="0x..."              # Deployer private key
export ALCHEMY_API_KEY="..."            # For Ethereum mainnet
export ETHERSCAN_API_KEY="..."          # For contract verification
```

### 2. Create Gnosis Safes

```bash
# Create Safes on all major networks
npm run safe:create:all -- --owners 0xYourAddress1,0xYourAddress2,0xYourAddress3 --threshold 2

# Or create on specific network
npm run safe:create:base -- --owners 0xAddr1,0xAddr2 --threshold 2
```

### 3. Deploy with Governance

```bash
# Deploy to Base with governance
npm run governance:deploy:base

# Deploy to all tier 1 networks
npm run governance:deploy:ethereum
npm run governance:deploy:arbitrum
npm run governance:deploy:optimism
```

## 🔧 Detailed Setup

### Step 1: Team Setup

First, gather your team's wallet addresses:

```bash
# Example team addresses
FOUNDER_ADDRESS="0x742d35Cc6634C0532925a3b8D0C9e3e0C8b0e4c2"
CTO_ADDRESS="0x8ba1f109551bD432803012645Hac136c22C501e"
ADVISOR_ADDRESS="0x123456789abcdef123456789abcdef123456789"
```

### Step 2: Create Multi-Network Gnosis Safes

```bash
# Create 2/3 multisig safes across networks
node script/CreateGnosisSafe.js \
  --networks base,arbitrum,optimism,ethereum \
  --owners $FOUNDER_ADDRESS,$CTO_ADDRESS,$ADVISOR_ADDRESS \
  --threshold 2
```

This will:
- Deploy Gnosis Safes on each network
- Generate `.env.safes` with addresses
- Create `gnosis-safes.json` config file

### Step 3: Configure Environment

Add the generated Safe addresses to your `.env`:

```bash
# Copy from .env.safes
GNOSIS_SAFE_BASE=0x...
GNOSIS_SAFE_ARBITRUM=0x...
GNOSIS_SAFE_OPTIMISM=0x...
GNOSIS_SAFE_ETHEREUM=0x...

# Use for deployment
GNOSIS_SAFE_ADDRESS=$GNOSIS_SAFE_BASE
```

### Step 4: Deploy Governance Ecosystem

```bash
# Deploy to Base (recommended first)
forge script script/DeployWithGovernance.s.sol:DeployWithGovernance \
  --rpc-url base \
  --broadcast \
  --verify

# Deploy to other networks
npm run governance:deploy:arbitrum
npm run governance:deploy:optimism
npm run governance:deploy:ethereum
```

## 🏗️ Architecture

### Governance Structure

```
Gnosis Safe (Your Team)
    ↓ controls
GovernanceTimelock (24h delay)
    ↓ owns
AgentPayy Contracts
    ├── AgentPayyCore
    ├── AttributionEngine
    ├── ReceiptManager
    └── APIRegistry
```

### Contract Ownership Flow

1. **Factory** deploys all contracts
2. **Timelock** becomes owner of all contracts
3. **Gnosis Safe** controls the timelock
4. **Your team** controls the Gnosis Safe

### Security Features

- **24-48 hour timelock** delays for all changes
- **Multi-signature** requirements (2/3, 3/5, etc.)
- **Emergency functions** with 1-hour delay
- **Routine functions** with 24-hour delay
- **Transparent governance** with event logging

## 🌐 Multi-Chain Deployment

### Supported Networks

| Network | Chain ID | Timelock Delay | Status |
|---------|----------|----------------|---------|
| **Ethereum** | 1 | 48 hours | 🟢 Ready |
| **Base** | 8453 | 24 hours | 🟢 Ready |
| **Arbitrum** | 42161 | 24 hours | 🟢 Ready |
| **Optimism** | 10 | 24 hours | 🟢 Ready |
| **Linea** | 59144 | 24 hours | 🟢 Ready |

### Deployment Commands

```bash
# Individual networks
npm run governance:deploy:ethereum
npm run governance:deploy:base
npm run governance:deploy:arbitrum
npm run governance:deploy:optimism
npm run governance:deploy:linea

# Batch deployment (coming soon)
npm run governance:deploy:all
```

## 🔐 Governance Operations

### Making Changes to Contracts

All contract changes must go through the timelock:

1. **Propose** transaction in Gnosis Safe
2. **Schedule** in timelock (24h delay)
3. **Execute** after delay period
4. **Verify** changes took effect

### Example: Change Platform Fee

```solidity
// 1. Schedule in timelock
timelock.scheduleRoutine(
    agentPayyCore,           // target
    0,                       // value
    abi.encodeWithSignature("setPlatformFee(uint256)", 500), // 5%
    bytes32(0),              // predecessor
    keccak256("fee-change-1") // salt
);

// 2. Wait 24 hours

// 3. Execute
timelock.execute(
    agentPayyCore,
    0,
    abi.encodeWithSignature("setPlatformFee(uint256)", 500),
    bytes32(0),
    keccak256("fee-change-1")
);
```

### Emergency Actions

For urgent fixes (1-hour delay):

```solidity
timelock.scheduleEmergency(
    target,
    value,
    data,
    predecessor,
    salt
);
```

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] Team wallet addresses collected
- [ ] Gnosis Safes created on target networks
- [ ] Environment variables configured
- [ ] Private key funded with gas tokens
- [ ] API keys configured for verification

### Deployment

- [ ] Factory contract deployed
- [ ] Governance timelock deployed
- [ ] Core contracts deployed
- [ ] Ownership transferred to timelock
- [ ] Contracts verified on explorers

### Post-Deployment

- [ ] Test governance functions
- [ ] Register initial API models
- [ ] Update SDK with new addresses
- [ ] Monitor timelock events
- [ ] Document Safe URLs for team

## 🛠️ Advanced Configuration

### Custom Timelock Delays

Modify delays in `DeployWithGovernance.s.sol`:

```solidity
function getTimelockDelay(uint256 chainId) internal pure returns (uint256) {
    if (chainId == 1) {
        return 48 hours; // Ethereum - longer for security
    } else {
        return 24 hours; // L2s - shorter for agility
    }
}
```

### Multi-Signature Thresholds

Recommended thresholds:
- **2/3**: Small teams (3-5 people)
- **3/5**: Medium teams (5-7 people)
- **5/9**: Large teams (9+ people)

### Network-Specific Safes

Create different Safe configurations per network:

```bash
# Conservative mainnet (3/5)
node script/CreateGnosisSafe.js --network ethereum --threshold 3

# Agile L2s (2/3)
node script/CreateGnosisSafe.js --networks base,arbitrum --threshold 2
```

## 🔍 Monitoring & Maintenance

### Timelock Events

Monitor these events for governance activity:

```solidity
event CallScheduled(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data, bytes32 predecessor, uint256 delay);
event CallExecuted(bytes32 indexed id, uint256 indexed index, address target, uint256 value, bytes data);
event Cancelled(bytes32 indexed id);
```

### Safe URLs

Access your Gnosis Safes:
- Base: `https://app.safe.global/base:0xYourSafeAddress`
- Arbitrum: `https://app.safe.global/arb1:0xYourSafeAddress`
- Optimism: `https://app.safe.global/oeth:0xYourSafeAddress`
- Ethereum: `https://app.safe.global/eth:0xYourSafeAddress`

### Health Checks

Regular maintenance tasks:
- [ ] Verify Safe signers are active
- [ ] Check timelock queue for pending actions
- [ ] Monitor contract events for anomalies
- [ ] Update Safe thresholds as team grows
- [ ] Rotate keys periodically

## 🆘 Emergency Procedures

### Lost Safe Access

If you lose access to your Gnosis Safe:

1. **Check remaining signers** - Can threshold still be met?
2. **Use recovery mechanisms** - Social recovery if configured
3. **Emergency timelock** - Use emergency functions if available
4. **Factory upgrade** - Deploy new ecosystem if necessary

### Compromised Keys

If a signer key is compromised:

1. **Remove compromised signer** from Safe immediately
2. **Change threshold** if necessary
3. **Monitor timelock** for unauthorized transactions
4. **Cancel pending** malicious transactions
5. **Rotate all keys** as precaution

### Contract Bugs

If critical bugs are found:

1. **Use emergency timelock** (1-hour delay)
2. **Pause affected functions** if available
3. **Deploy fixes** through governance
4. **Communicate** with users transparently
5. **Post-mortem** and process improvements

## 📚 Resources

### Documentation
- [OpenZeppelin Governance](https://docs.openzeppelin.com/contracts/4.x/governance)
- [Gnosis Safe Documentation](https://docs.safe.global/)
- [Foundry Book](https://book.getfoundry.sh/)

### Tools
- [Gnosis Safe App](https://app.safe.global/)
- [OpenZeppelin Defender](https://defender.openzeppelin.com/)
- [Tenderly](https://tenderly.co/) for monitoring

### Support
- [AgentPayy GitHub](https://github.com/DLhugly/AgentPayy)
- [Discord Community](#) (coming soon)
- [Documentation Site](#) (coming soon)

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Production-ready governance** with timelocks
- ✅ **Multi-signature security** with Gnosis Safe
- ✅ **Multi-chain presence** across major L2s
- ✅ **Future-proof architecture** for scaling
- ✅ **Transparent operations** with full audit trails

Your AgentPayy ecosystem is now ready for production use with enterprise-grade security and governance! 🚀 