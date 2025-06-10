# AgentPayKit TypeScript SDK

> Universal wallet infrastructure for the API economy

## Installation

```bash
npm install @agentpay/sdk
```

## Quick Start

```typescript
import { EnhancedAgentPayKit } from '@agentpay/sdk';

const agentpay = new EnhancedAgentPayKit();

// Generate smart account wallet
const wallet = await agentpay.generateWallet({
  smart: true,
  provider: 'biconomy',
  features: ['gasless', 'batching']
});

// Make API call with payment
const result = await agentpay.payAndCall('weather-api', 
  { city: 'NYC' }, 
  { price: '0.01' }
);
```

## Core Features

- **Universal Wallets**: MetaMask, Coinbase, WalletConnect, Smart Accounts
- **Smart Accounts**: Gasless transactions, batch processing, social recovery
- **Dual Payment Model**: Balance system + permit fallback
- **Mock Mode**: Zero-friction testing
- **Multi-chain**: 13 networks supported
- **Network Effects**: Same wallet earns AND spends

## Wallet Management

### Generate Smart Account

```typescript
const wallet = await agentpay.generateWallet({
  smart: true,                    // Enable smart account features
  provider: 'biconomy',          // biconomy|zerodev|alchemy
  features: ['gasless', 'batching'], // Advanced features
  chain: 'base'                  // Target network
});

console.log(`Address: ${wallet.address}`);
console.log(`Features: Gasless=${wallet.features.gasless}`);
```

### Connect Existing Wallet

```typescript
// MetaMask
const wallet = await agentpay.connectWallet('metamask', {
  chain: 'base'
});

// Coinbase Wallet
const wallet = await agentpay.connectWallet('coinbase', {
  smart: true  // Upgrade to smart account
});

// WalletConnect
const wallet = await agentpay.connectWallet('walletconnect');
```

### Import from Private Key

```typescript
const wallet = await agentpay.importWallet(
  '0x1234567890abcdef...', 
  { 
    smart: true,
    chain: 'arbitrum' 
  }
);
```

## Agent Setup

### Complete Agent Configuration

```typescript
const agent = await agentpay.setupAgent({
  name: 'My AI Agent',
  endpoints: [
    {
      modelId: 'weather-api',
      endpoint: 'https://api.weather.com/v1',
      price: '0.01'
    },
    {
      modelId: 'news-api', 
      endpoint: 'https://api.news.com/v1',
      price: '0.05'
    }
  ],
  walletOptions: {
    smart: true,
    provider: 'biconomy'
  }
});

console.log(`Wallet: ${agent.wallet.address}`);
console.log(`APIs registered: ${agent.registeredApis.length}`);
console.log(`Balance: $${agent.balance} USDC`);
```

## API Interactions

### Pay and Call APIs

```typescript
// Smart routing: uses balance first, fallback to permit
const result = await agentpay.payAndCall('weather-api', 
  { city: 'San Francisco' },
  { 
    price: '0.01',
    useBalance: true,  // Try balance first (default)
    gasless: true      // Use gasless if available
  }
);

console.log(result); // Weather data
```

### Mock Mode (Development)

```typescript
// Test without any payment setup
const mockResult = await agentpay.payAndCall('weather-api',
  { city: 'Tokyo' },
  { 
    price: '0.01',
    mock: true  // No payment, returns mock data
  }
);

console.log(mockResult); // { temperature: 72, condition: 'sunny', mock: true }
```

### Batch API Calls (Smart Accounts)

```typescript
const results = await agentpay.batchPayAndCall([
  {
    modelId: 'weather-api',
    input: { city: 'NYC' },
    options: { price: '0.01' }
  },
  {
    modelId: 'news-api',
    input: { topic: 'AI' },
    options: { price: '0.05' }
  }
]);

console.log(`Processed ${results.length} API calls in batch`);
```

## Balance Management

### Netflix-Style Prepaid Balance

```typescript
// Deposit to balance for seamless usage
await agentpay.depositBalance('10.0'); // $10 USDC

// Check balance
const balance = await agentpay.getUserBalance();
console.log(`Balance: $${balance} USDC`);

// Check if sufficient for API call
const canAfford = await agentpay.checkUserBalance('0.05');

// Withdraw from balance
await agentpay.withdrawBalance('5.0');
```

## API Provider Functions

### Register API for Monetization

```typescript
await agentpay.registerModel({
  modelId: 'my-premium-api',
  endpoint: 'https://api.myservice.com/premium',
  price: '0.25',
  token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC
});
```

### Manage Earnings

```typescript
// Check earnings from API sales
const earnings = await agentpay.getEarnings();
console.log(`Earned: $${earnings} USDC`);

// Withdraw earnings
const txHash = await agentpay.withdrawEarnings();
console.log(`Withdrawal: ${txHash}`);
```

## Financial Overview

```typescript
const financials = await agentpay.getFinancialOverview();

console.log(`Earnings: $${financials.earnings}`);
console.log(`Balance: $${financials.balance}`);
console.log(`Total Spent: $${financials.totalSpent}`);
console.log(`Net Position: $${financials.netPosition}`);
```

## Network Configuration

### Multi-Chain Support

```typescript
// Switch between networks
const baseWallet = await agentpay.generateWallet({ chain: 'base' });
const arbWallet = await agentpay.generateWallet({ chain: 'arbitrum' });

// Supported networks:
// ethereum, base, arbitrum, optimism, unichain, worldchain,
// starknet, zksync, linea, blast, scroll, polygon-zkevm, mantle
```

### Environment Configuration

```typescript
// Production gateway
const agentpay = new EnhancedAgentPayKit('https://gateway.agentpay.dev');

// Local development
const agentpay = new EnhancedAgentPayKit('http://localhost:3000');
```

## Error Handling

```typescript
try {
  const result = await agentpay.payAndCall('weather-api', 
    { city: 'NYC' }, 
    { price: '0.01' }
  );
} catch (error) {
  if (error.message.includes('Insufficient balance')) {
    // User needs to deposit more funds
    await agentpay.depositBalance('5.0');
    
  } else if (error.message.includes('No wallet connected')) {
    // Generate or connect wallet first
    await agentpay.generateWallet({ smart: true });
    
  } else {
    console.error('Payment failed:', error);
  }
}
```

## Environment Variables

```bash
# Smart wallet provider API keys (optional)
BICONOMY_PAYMASTER_API_KEY=...
ZERODEV_API_KEY=...
ALCHEMY_API_KEY=...

# Contract addresses (auto-configured in production)
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...
# ... (13 networks total)

# Gateway URL (default: http://localhost:3000)
AGENTPAY_GATEWAY_URL=https://gateway.agentpay.dev
```

## Examples

### AI Agent Integration

```typescript
import { EnhancedAgentPayKit } from '@agentpay/sdk';

class TradingBot {
  private agentpay: EnhancedAgentPayKit;
  
  async init() {
    this.agentpay = new EnhancedAgentPayKit();
    
    // Setup agent with both earning and spending
    await this.agentpay.setupAgent({
      name: 'Trading Bot',
      endpoints: [
        { modelId: 'price-alerts', endpoint: '...', price: '0.10' }
      ]
    });
    
    // Deposit trading capital
    await this.agentpay.depositBalance('100.0');
  }
  
  async trade() {
    // Get market data (spend)
    const prices = await this.agentpay.payAndCall('market-data',
      { symbols: ['BTC', 'ETH'] },
      { price: '0.02' }
    );
    
    // Send alerts to subscribers (earn)
    // Clients pay automatically when they call your price-alerts API
  }
}
```

### Web Application

```typescript
// React component example
import { useState, useEffect } from 'react';
import { EnhancedAgentPayKit } from '@agentpay/sdk';

function WeatherApp() {
  const [agentpay, setAgentpay] = useState(null);
  const [weather, setWeather] = useState(null);
  
  useEffect(() => {
    async function init() {
      const sdk = new EnhancedAgentPayKit();
      await sdk.connectWallet('metamask');
      setAgentpay(sdk);
    }
    init();
  }, []);
  
  const getWeather = async (city) => {
    const result = await agentpay.payAndCall('weather-api',
      { city },
      { price: '0.01' }
    );
    setWeather(result);
  };
  
  return (
    <div>
      <button onClick={() => getWeather('NYC')}>
        Get NYC Weather ($0.01)
      </button>
      {weather && <div>Temperature: {weather.temperature}°F</div>}
    </div>
  );
}
```

## TypeScript Types

```typescript
import type { 
  WalletInfo, 
  PaymentOptions, 
  ModelConfig,
  AgentConfig 
} from '@agentpay/sdk';

// Full type definitions included for excellent DX
```

## Support

- **Documentation**: Complete TypeScript API docs
- **Examples**: Real-world integration examples
- **Types**: Full TypeScript support
- **Testing**: Mock mode for development

See main repository for additional examples and integration guides. 