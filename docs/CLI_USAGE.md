# AgentPayKit CLI - Complete Usage Guide

Complete command-line interface for the API economy with universal wallet infrastructure, smart accounts, and dual usage patterns.

## 🚀 Quick Start

### Installation
```bash
npm install -g @agentpay/cli
```

### First Run
```bash
# Show welcome and available commands
agentpay

# See demo scenarios
agentpay demo

# Understand network effects
agentpay network-effects
```

## 🔑 Wallet Management

### Generate New Wallets

```bash
# Basic wallet generation
agentpay generate-wallet

# Smart account with specific provider
agentpay generate-wallet --smart --provider biconomy --name "my-smart-wallet"

# EOA wallet (traditional)
agentpay generate-wallet --no-smart --name "eoa-wallet"

# Generate and fund on testnet
agentpay generate-wallet --testnet --fund 0.1 --name "test-wallet"

# Generate without saving
agentpay generate-wallet --no-save --quiet
```

### Connect Existing Wallets

```bash
# Connect MetaMask
agentpay connect-wallet metamask

# Connect and upgrade to smart account
agentpay connect-wallet coinbase --smart --name "coinbase-smart"

# Connect WalletConnect
agentpay connect-wallet walletconnect --save
```

### Import Wallets

```bash
# Import from private key
agentpay import-wallet 0x1234567890abcdef... --name "imported-wallet"

# Import and create smart account
agentpay import-wallet 0x1234567890abcdef... --smart --provider zerodev
```

### Wallet Management

```bash
# List all saved wallets
agentpay wallets
agentpay list  # alias

# Use specific wallet
agentpay use-wallet "my-wallet"
agentpay use-wallet 0x742d35Cc6834C532...

# Show current wallet info
agentpay wallet-info
```

## 🤖 Agent Setup

### Complete Agent Setup

```bash
# Interactive setup
agentpay setup

# Non-interactive with defaults
agentpay setup --name "My Agent" --balance 25.0 --no-interactive

# Enterprise setup
agentpay setup --name "Enterprise Agent" --apis my-api1 my-api2 --balance 100.0
```

### Mock Mode Testing

```bash
# Test any API without payment
agentpay mock weather-api '{"city":"NYC"}'

# Test with complex input
agentpay mock ai-model '{
  "prompt": "Analyze market trends",
  "max_tokens": 150,
  "temperature": 0.7
}'

# Test multiple APIs
agentpay mock api1 '{"test":1}'
agentpay mock api2 '{"test":2}'
```

## 💰 Balance Management

### Deposits

```bash
# Deposit USDC to balance
agentpay balance deposit 10.0

# Deposit with specific token
agentpay balance deposit 25.0 --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

# Large deposit for enterprise
agentpay balance deposit 1000.0
```

### Withdrawals

```bash
# Withdraw from balance
agentpay balance withdraw 5.0

# Withdraw all
agentpay balance withdraw $(agentpay balance check | grep -o '[0-9.]*')
```

### Balance Checking

```bash
# Check your balance
agentpay balance check

# Check specific address
agentpay balance check --address 0x742d35Cc6834C532...

# Check with specific token
agentpay balance check --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## 📝 API Registration

### Register APIs

```bash
# Basic API registration
agentpay register-api my-weather-api 0.01

# Full registration with endpoint
agentpay register-api premium-ai 0.05 \
  --endpoint "https://api.myservice.com/ai" \
  --description "Premium AI model"

# Register with custom token
agentpay register-api enterprise-api 0.25 \
  --endpoint "https://enterprise.example.com/api" \
  --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

### Test Registered APIs

```bash
# Test your API with mock mode
agentpay mock my-weather-api '{"city":"San Francisco"}'

# Verify registration worked
curl -H "X-AgentPay-Mock: true" \
  https://api.myservice.com/weather \
  -d '{"city":"San Francisco"}'
```

## 💼 Earnings Management

### Check Earnings

```bash
# See complete financial overview
agentpay financials
agentpay money  # alias

# Detailed breakdown
agentpay financials --verbose
```

### Withdraw Earnings

```bash
# Withdraw all earnings
agentpay earnings withdraw

# Withdraw with specific token
agentpay earnings withdraw --token 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```

## 📦 Batch Operations (Smart Accounts)

### Batch API Calls

```bash
# Batch multiple API calls
agentpay batch \
  "weather-api:{\"city\":\"NYC\"}" \
  "news-api:{\"topic\":\"AI\"}" \
  "crypto-api:{\"symbol\":\"ETH\"}"

# Batch with mock mode
agentpay batch \
  "api1:{\"test\":1}" \
  "api2:{\"test\":2}" \
  --mock

# Complex batch operations
agentpay batch \
  "analysis-api:{\"data\":[1,2,3],\"type\":\"trend\"}" \
  "summary-api:{\"text\":\"Long text to summarize...\"}" \
  "translate-api:{\"text\":\"Hello\",\"to\":\"es\"}"
```

## 🎭 Usage Patterns

### Development Workflow

```bash
# 1. Generate development wallet
agentpay generate-wallet --name "dev-wallet" --testnet

# 2. Test APIs in mock mode
agentpay mock weather-api '{"city":"NYC"}'
agentpay mock ai-api '{"prompt":"test"}'

# 3. Register your APIs
agentpay register-api my-dev-api 0.01 --endpoint "http://localhost:3000/api"

# 4. Test the complete flow
agentpay balance deposit 1.0
agentpay financials
```

### Production Agent Setup

```bash
# 1. Setup production agent
agentpay setup --name "Production Agent" --balance 50.0

# 2. Register production APIs
agentpay register-api weather-pro 0.02
agentpay register-api ai-analysis 0.10
agentpay register-api data-processing 0.05

# 3. Monitor and maintain
agentpay financials
agentpay balance check
agentpay earnings withdraw
```

### Enterprise Workflow

```bash
# 1. Enterprise setup with multiple wallets
agentpay generate-wallet --smart --name "enterprise-main" --provider biconomy
agentpay generate-wallet --smart --name "enterprise-dev" --provider zerodev

# 2. Large-scale operations
agentpay balance deposit 1000.0
agentpay register-api enterprise-ai 0.25
agentpay register-api data-pipeline 0.15

# 3. Batch processing
agentpay batch \
  "process-api:{\"batch\":1}" \
  "analyze-api:{\"batch\":1}" \
  "report-api:{\"batch\":1}"

# 4. Financial monitoring
agentpay financials > daily-report.txt
```

## 📊 Monitoring and Analytics

### Financial Tracking

```bash
# Daily financial check
agentpay financials

# Export financial data
agentpay financials --format json > financials.json

# Check specific metrics
agentpay balance check
agentpay earnings withdraw --dry-run  # See earnings without withdrawing
```

### Usage Analytics

```bash
# Show all wallets and their status
agentpay wallets

# Detailed wallet information
agentpay wallet-info

# Check capabilities
agentpay wallet-info | grep -E "(Smart Account|Features)"
```

## 🚨 Troubleshooting

### Common Issues

```bash
# Check wallet connection
agentpay wallet-info

# Verify balance
agentpay balance check

# Test with mock mode
agentpay mock test-api '{"test":true}'

# Check saved wallets
agentpay wallets
```

### Reset and Recovery

```bash
# Generate new wallet if issues
agentpay generate-wallet --name "backup-wallet"

# Switch to different wallet
agentpay use-wallet "backup-wallet"

# Import from backup private key
agentpay import-wallet 0x... --name "recovered-wallet"
```

## 🔧 Advanced Usage

### Environment Variables

```bash
# Set default provider
export AGENTPAY_PROVIDER=biconomy

# Set default chain
export AGENTPAY_CHAIN=base

# Set gateway URL
export AGENTPAY_GATEWAY_URL=https://api.agentpay.dev

# API keys for smart account providers
export BICONOMY_PAYMASTER_API_KEY=your-key
export ZERODEV_PROJECT_ID=your-project-id
export ALCHEMY_API_KEY=your-api-key
```

### Configuration Files

```bash
# Create config file
mkdir -p ~/.agentpay
cat > ~/.agentpay/config.json << EOF
{
  "defaultProvider": "biconomy",
  "defaultChain": "base",
  "gatewayUrl": "https://api.agentpay.dev",
  "autoSave": true,
  "mockMode": false
}
EOF
```

### Scripting and Automation

```bash
#!/bin/bash
# Daily agent maintenance script

# Check and top up balance if low
BALANCE=$(agentpay balance check | grep -o '[0-9.]*')
if (( $(echo "$BALANCE < 5.0" | bc -l) )); then
  agentpay balance deposit 20.0
  echo "Topped up balance: $BALANCE -> 25.0"
fi

# Withdraw earnings if substantial
EARNINGS=$(agentpay financials | grep "Earnings" | grep -o '[0-9.]*')
if (( $(echo "$EARNINGS > 10.0" | bc -l) )); then
  agentpay earnings withdraw
  echo "Withdrew earnings: $EARNINGS"
fi

# Generate daily report
agentpay financials > "report-$(date +%Y-%m-%d).txt"
```

## 🌟 Examples by Use Case

### AI Research Agent
```bash
agentpay setup --name "Research Agent" --balance 30.0
agentpay register-api academic-search 0.03
agentpay batch "academic-search:{\"query\":\"machine learning 2024\"}"
```

### Trading Bot
```bash
agentpay setup --name "Trading Bot" --balance 100.0
agentpay register-api price-feed 0.001
agentpay batch "price-feed:{\"symbols\":[\"BTC\",\"ETH\"]}"
```

### Content Creation Agent
```bash
agentpay setup --name "Content Creator" --balance 50.0
agentpay register-api text-generation 0.04
agentpay batch "text-generation:{\"topic\":\"AI trends\"}"
```

---

## 📖 Related Documentation

- [SDK Documentation](SDK_GUIDE.md)
- [Smart Contract Reference](CONTRACTS.md)
- [API Integration Guide](API_INTEGRATION.md)
- [Enterprise Setup](ENTERPRISE.md)

For support, join our [Discord](https://discord.gg/agentpaykit) or check [GitHub Issues](https://github.com/agentpaykit/issues). 