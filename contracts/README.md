# AgentPayKit Smart Contracts

> Production-ready payment contracts for the API economy

## Overview

The AgentPayKit smart contract enables sub-cent API payments with dual payment models, smart wallet support, and multi-chain deployment across 13 networks.

## Contract Features

- **Dual Payment Model**: Balance system + permit fallback
- **Multi-token Support**: USDC integration across all chains
- **Smart Wallet Ready**: Gasless transactions with signature verification
- **Secure**: ReentrancyGuard, access controls, platform fee limits
- **Auditable**: Comprehensive events and view functions

## Quick Start

```bash
# Install dependencies
npm install

# Deploy to Base (recommended first)
npm run deploy:base

# Deploy to all Tier 1 networks
npm run deploy:tier1

# Deploy to all 13 networks
npm run deploy:all
```

## Supported Networks

| Network | Chain ID | Command |
|---------|----------|---------|
| Ethereum | 1 | `npm run deploy:ethereum` |
| Base | 8453 | `npm run deploy:base` |
| Arbitrum | 42161 | `npm run deploy:arbitrum` |
| Optimism | 10 | `npm run deploy:optimism` |
| Unichain | 1301 | `npm run deploy:unichain` |
| World Chain | 480 | `npm run deploy:worldchain` |
| + 7 more L2s | - | See package.json |

## Environment Setup

```bash
# Required for deployment
PRIVATE_KEY=0x...
TREASURY_ADDRESS=0x...

# Required for verification
ETHERSCAN_API_KEY=...
BASESCAN_API_KEY=...
ARBISCAN_API_KEY=...
# ... (see hardhat.config.ts for full list)
```

## Contract Architecture

### Core Functions

```solidity
// Register API for monetization
function registerModel(string modelId, string endpoint, uint256 price, address token)

// Dual payment: balance first, permit fallback
function payAndCall(PaymentData payment)

// Netflix-style balance system
function depositBalance(address token, uint256 amount)
function withdrawBalance(address token, uint256 amount)

// Earnings management
function withdraw(address token)
```

### Payment Flow

1. **Check Balance**: Use prepaid balance if available
2. **Fallback**: Smart wallet signature or permit if insufficient balance
3. **Distribution**: 90% to API owner, 10% platform fee
4. **Events**: Complete payment tracking

## Key Benefits

- **Sub-cent payments**: $0.001 minimum on L2s
- **Gasless UX**: Smart wallet integration
- **Netflix model**: Prepaid balance system
- **Multi-chain**: Deploy once, use everywhere
- **Secure**: Battle-tested OpenZeppelin patterns

## Verification

```bash
# Verify contract after deployment
npx hardhat verify --network base <CONTRACT_ADDRESS> <TREASURY_ADDRESS>
```

## Security

- **Audited patterns**: OpenZeppelin ReentrancyGuard, Ownable
- **Rate limits**: Platform fee capped at 20%
- **Access control**: Owner-only admin functions
- **Event logging**: Complete audit trail

## Gas Costs

| Network | Deployment | Function Call |
|---------|------------|---------------|
| Ethereum | ~$50-200 | $5-20 |
| L2s | ~$1-5 | $0.001-0.01 |

## Integration

The contract is automatically integrated with:
- TypeScript SDK (`@agentpay/sdk`)
- Python SDK (`agentpay`)
- CLI tool (`@agentpay/cli`)

See respective READMEs for usage examples. 