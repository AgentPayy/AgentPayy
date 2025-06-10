# AgentPayKit CLI

> Complete wallet infrastructure for the API economy

## Installation

```bash
npm install -g @agentpay/cli
```

## Quick Start

```bash
# Generate smart account wallet
agentpay generate-wallet --smart --name "my-agent"

# Setup complete agent (wallet + APIs + balance)
agentpay setup --name "My AI Agent"

# Test API without payment (mock mode)
agentpay mock weather-api '{"city":"NYC"}'

# Make real API call with payment
agentpay call weather-api '{"city":"NYC"}' --price 0.01
```

## Commands

### Wallet Management

```bash
# Generate new wallet
agentpay generate-wallet [options]
  --smart              Create smart account (recommended)
  --name <name>        Wallet name
  --provider <name>    Smart wallet provider (biconomy|zerodev|alchemy)
  --chain <chain>      Network (base|arbitrum|optimism|ethereum)

# Connect existing wallet
agentpay connect <type>
  # type: metamask|coinbase|walletconnect

# Import from private key
agentpay import <private-key>

# List saved wallets
agentpay wallets list

# Get wallet info
agentpay wallets info <name>
```

### Agent Setup

```bash
# Interactive agent setup
agentpay setup [options]
  --name <name>        Agent name
  --balance <amount>   Initial balance (USDC)

# Register API for monetization
agentpay register-api <id> <price> [options]
  --endpoint <url>     API endpoint
  --token <address>    Payment token (default: USDC)
```

### API Calls

```bash
# Mock API call (no payment)
agentpay mock <model-id> <input>

# Real API call with payment
agentpay call <model-id> <input> [options]
  --price <amount>     Payment amount
  --use-balance        Use prepaid balance first (default: true)
  --gasless           Use gasless transaction (smart accounts)

# Batch API calls
agentpay batch <call1> <call2> ... [options]
  --mock              Use mock mode for all calls
```

### Balance Management

```bash
# Deposit to prepaid balance
agentpay balance deposit <amount>

# Check balance
agentpay balance show

# Withdraw from balance
agentpay balance withdraw <amount>

# Financial overview
agentpay financials
```

### Configuration

```bash
# Set default configuration
agentpay config set <key> <value>
  # Keys: gateway-url, default-chain, default-token

# Show configuration
agentpay config show

# Reset configuration
agentpay config reset
```

## Examples

### AI Agent Workflow

```bash
# 1. Setup agent with initial balance
agentpay setup --name "Trading Bot" --balance 50.0

# 2. Register your API
agentpay register-api price-feed 0.01 --endpoint "https://api.example.com/prices"

# 3. Make API calls
agentpay call weather-api '{"city":"NYC"}' --price 0.005
agentpay call news-api '{"topic":"crypto"}' --price 0.01

# 4. Check earnings and spending
agentpay financials
```

### Developer Testing

```bash
# Test without any payment setup
agentpay mock weather-api '{"city":"San Francisco"}'
agentpay mock token-prices '{"symbol":"ETH"}'

# Batch test multiple APIs
agentpay batch \
  "weather-api:{\"city\":\"NYC\"}" \
  "news-api:{\"topic\":\"AI\"}" \
  --mock
```

### Enterprise Usage

```bash
# Setup enterprise agent
agentpay setup --name "Enterprise Agent" --balance 1000.0

# Register multiple internal APIs
agentpay register-api analytics 0.25
agentpay register-api ml-model 0.10
agentpay register-api data-lake 0.05

# Monitor financials
agentpay financials --export csv
```

## Environment Variables

```bash
# Wallet private key (for non-interactive use)
PRIVATE_KEY=0x...

# Smart wallet provider API keys
BICONOMY_PAYMASTER_API_KEY=...
ZERODEV_API_KEY=...
ALCHEMY_API_KEY=...

# Gateway URL (default: http://localhost:3000)
AGENTPAY_GATEWAY_URL=https://gateway.agentpay.dev

# Default chain (default: base)
AGENTPAY_DEFAULT_CHAIN=base
```

## Features

- **Universal Wallets**: MetaMask, Coinbase, WalletConnect, Smart Accounts
- **Smart Accounts**: Gasless transactions, batch processing, social recovery
- **Mock Mode**: Test APIs without payment
- **Balance System**: Netflix-style prepaid usage
- **Multi-chain**: 13 networks supported
- **Dual Usage**: Both earn from APIs and spend on APIs

## Troubleshooting

### Common Issues

```bash
# Wallet connection failed
agentpay config reset
agentpay generate-wallet --smart

# API call failed
agentpay balance show  # Check sufficient balance
agentpay mock <api>    # Test with mock mode first

# Transaction failed
# Check gas token balance on target network
# Verify contract is deployed: agentpay config show
```

### Getting Help

```bash
agentpay --help
agentpay <command> --help
agentpay config show  # Debug configuration
```

## Integration

Works with:
- CrewAI agents
- LangChain tools
- FastAPI applications
- Any application making HTTP API calls

See main repository for integration examples. 