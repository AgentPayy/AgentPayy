# AgentPayKit Smart Contracts

**Multichain payment infrastructure for the API economy powered by Foundry.**

AgentPayKit enables secure, stablecoin-based payments for AI APIs across 11+ blockchain networks.

## 🌐 Supported Networks

**Tier 1 (High Priority)**
- Ethereum Mainnet
- Base
- Arbitrum One  
- Optimism

**Tier 2 (Emerging L2s)**
- Unichain
- World Chain
- Linea
- Blast

**Tier 3 (Additional L2s)**
- Scroll
- Polygon zkEVM
- Mantle

## 🚀 Quick Start

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Install dependencies
forge install
```

### Environment Setup

Create a `.env` file:

```bash
PRIVATE_KEY=your_private_key_here
TREASURY_ADDRESS=your_treasury_address_here

# API Keys for verification
ETHERSCAN_API_KEY=your_etherscan_key
BASESCAN_API_KEY=your_basescan_key
ARBISCAN_API_KEY=your_arbiscan_key
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimism_key
LINEA_API_KEY=your_linea_key
# ... add others as needed
```

## 📦 Available Commands

### Build & Test

```bash
# Build contracts
npm run build

# Run tests
npm run test
npm run test:verbose
npm run test:gas
```

### Single Network Deployment

```bash
# Deploy to specific networks
npm run deploy:base
npm run deploy:ethereum
npm run deploy:arbitrum
npm run deploy:optimism
```

### Multichain Deployment

```bash
# Deploy to tier-based groups
npm run deploy:tier1    # Base, Arbitrum, Optimism, Ethereum
npm run deploy:tier2    # Emerging L2s (Unichain, World Chain, etc.)
npm run deploy:tier3    # Additional L2s (Scroll, Polygon zkEVM, etc.)

# Deploy to all networks
npm run deploy:all
```

### Contract Verification

```bash
npm run verify:base
npm run verify:arbitrum
npm run verify:optimism
npm run verify:ethereum
```

## 🏗️ Architecture

### Core Contract: `AgentPayKit.sol`

- **Dual Payment Model**: Prepaid balances + permit-based payments
- **Smart Wallet Support**: EIP-191 signature verification
- **Multi-token Support**: Any ERC20 token (optimized for USDC)
- **Platform Fees**: Configurable fee structure
- **Multichain Ready**: Deterministic deployments across networks

### Key Features

1. **Model Registration**: API providers register their endpoints
2. **Flexible Payments**: Users can prepay or pay per call
3. **Gas Optimization**: Minimal gas usage for payments
4. **Security**: ReentrancyGuard, permit-based approvals
5. **Transparency**: Full event emission for tracking

## 🛠️ Development

### Project Structure

```
contracts/
├── src/                    # Smart contracts
│   └── AgentPayKit.sol    # Main payment contract
├── script/                # Deployment scripts
│   ├── Deploy.s.sol       # Solidity deployment script
│   └── DeployMultichain.sh # Bash multichain script
├── test/                  # Test files
│   └── AgentPayKit.t.sol  # Contract tests
└── foundry.toml           # Foundry configuration
```

### Testing

```bash
# Run all tests
forge test

# Run with gas reporting
forge test --gas-report

# Run specific test
forge test --match-test test_Deployment

# Run fuzz tests
forge test --fuzz-runs 1000
```

### Local Development

```bash
# Start local node
anvil

# Deploy to local node
forge script script/Deploy.s.sol:DeployScript --fork-url http://localhost:8545 --broadcast
```

## 🔧 Configuration

### Network RPC Endpoints

Configured in `foundry.toml`:
- Ethereum: Alchemy
- Base: Official RPC
- Arbitrum: Official RPC
- Optimism: Official RPC
- And more...

### USDC Contract Addresses

Official Circle USDC addresses are configured for each supported network in the deployment script.

## 📊 Gas Optimization

- **Batch Operations**: Deploy to multiple chains efficiently  
- **Optimized Solidity**: 0.8.20 with 200 optimization runs
- **Minimal Storage**: Efficient struct packing
- **Event-Driven**: Reduced storage needs through events

## 🔒 Security

- **ReentrancyGuard**: Protection against reentrancy attacks
- **Ownable**: Admin functions protected
- **Input Validation**: Comprehensive parameter checking
- **Permit Support**: EIP-2612 gasless approvals
- **Smart Wallet Compatible**: EIP-191 signature support

## 📈 Monitoring

After deployment, monitor your contracts:

1. Check deployment status in `broadcast/` directory
2. Verify contracts on block explorers
3. Monitor treasury balances
4. Track platform fee collection

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass: `forge test`
5. Submit a pull request

---

**Built with ❤️ using Foundry**
