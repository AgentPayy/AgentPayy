# 🏪 AgentPayKit Marketplace Demo

## How It Works End-to-End

### 🔧 **Step 1: Developer Paywalls Their API**

```javascript
// developer-weather-api/server.js
import express from 'express';
import { AgentPayWall } from '@agentpay/paywall-sdk';

const app = express();

// Initialize paywall with pricing
const paywall = new AgentPayWall({
  apiKey: 'weather-realtime-v1',
  pricePerQuery: '0.05',  // $0.05 per call
  chain: 'base'
});

// Existing API endpoint - NO CHANGES NEEDED
const getWeatherData = (city) => ({
  city,
  temperature: Math.floor(Math.random() * 40) + 60,
  condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
  humidity: Math.floor(Math.random() * 50) + 30
});

// 👇 ONLY CHANGE: Add paywall protection
app.get('/weather/:city', 
  paywall.protect(),  // This one line adds payment requirement
  (req, res) => {
    const weather = getWeatherData(req.params.city);
    
    res.json({
      ...weather,
      // Payment info now available
      paidBy: req.agentpay.payer,
      paymentAmount: req.agentpay.paymentAmount,
      timestamp: req.agentpay.timestamp
    });
  }
);

app.listen(3000);
```

### 📝 **Step 2: Automatic Registration**

When the paywall SDK initializes, it automatically:

1. **Registers the API** in the smart contract
2. **Stores metadata** for the marketplace
3. **Makes it discoverable** to all users

```typescript
// What happens behind the scenes:
await contract.registerModel(
  'weather-realtime-v1',           // Model ID
  'https://api.weather.dev/v1',    // Endpoint
  parseUnits('0.05', 6),          // Price in USDC
  USDC_CONTRACT_ADDRESS           // Payment token
);

// Enhanced metadata stored in registry:
{
  modelId: 'weather-realtime-v1',
  name: 'Real-time Weather API',
  description: 'Get current weather data for any city worldwide',
  category: 'Weather & Environment',
  owner: '0x1234...abcd',
  endpoint: 'https://api.weather.dev/v1',
  price: '0.05',
  active: true,
  totalCalls: 0,
  totalRevenue: '0',
  rating: 5.0,
  tags: ['weather', 'realtime', 'global'],
  healthStatus: 'healthy'
}
```

### 🌐 **Step 3: Discoverable in Marketplace**

Users can now find and use the API through multiple channels:

#### **Web Marketplace**
Visit `https://marketplace.agentpaykit.com` to browse:

```
┌─────────────────────────────────────────────────────────┐
│  🏪 AgentPayKit Marketplace                            │
├─────────────────────────────────────────────────────────┤
│  Search: [weather        ] Category: [All ▼] Sort: [⭐] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 Real-time Weather API                    $0.05 USDC │
│     Get current weather data worldwide        per call   │
│     ⭐ 4.8 | 🔥 1,247 calls | 💰 $62.35 earned         │
│     #weather #realtime #global                          │
│     [Try API] [View Details]                           │
│                                                         │
│  🌡️ Weather Forecast API                     $0.12 USDC │
│     7-day weather forecasts with alerts       per call   │
│     ⭐ 4.9 | 🔥 856 calls | 💰 $102.72 earned          │
│     #forecast #alerts #premium                          │
│     [Try API] [View Details]                           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

#### **CLI Discovery**
```bash
# Browse all APIs
npx @agentpay/cli browse

# Search for specific APIs
npx @agentpay/cli search "weather"

# Get API details
npx @agentpay/cli info weather-realtime-v1
```

#### **SDK Discovery**
```javascript
import { apiRegistry } from '@agentpay/registry';

// Get all weather APIs
const weatherAPIs = await apiRegistry.searchAPIs({
  category: 'Weather & Environment',
  priceRange: { min: '0', max: '0.10' }
});

console.log(weatherAPIs);
// [
//   {
//     modelId: 'weather-realtime-v1',
//     name: 'Real-time Weather API',
//     price: '0.05',
//     endpoint: 'https://api.weather.dev/v1',
//     rating: 4.8,
//     totalCalls: 1247
//   },
//   // ... more APIs
// ]
```

### 🤖 **Step 4: Consumers Use the APIs**

#### **Option A: Direct API Calls with Consumer SDK**
```javascript
import { AgentPayKit } from '@agentpay/consumer-sdk';

const agentpay = new AgentPayKit({
  chain: 'base',
  walletPrivateKey: process.env.PRIVATE_KEY
});

// Pay and call API in one line
const weather = await agentpay.callAPI(
  'weather-realtime-v1',
  { city: 'New York' },
  { price: '0.05' }
);

console.log(weather);
// {
//   city: 'New York',
//   temperature: 72,
//   condition: 'sunny',
//   humidity: 45,
//   paidBy: '0x5678...efgh',
//   paymentAmount: '0.05',
//   timestamp: 1703123456789
// }
```

#### **Option B: Browse and Try in Marketplace**
Users can:
1. **Browse** the marketplace web interface
2. **Try APIs** directly in the browser
3. **View examples** and documentation
4. **Get integration code** snippets

#### **Option C: Agent-to-Agent Payments**
```javascript
// AI Agent 1 calls AI Agent 2's API
const aiResponse = await agentpay.callAPI(
  'gpt4-analysis-v1',
  { 
    prompt: 'Analyze this weather data',
    data: weatherData 
  },
  { price: '0.25' }
);
```

### 💰 **Step 5: Revenue Distribution**

Every API call automatically distributes payment:

```
API Call Payment: $0.05 USDC
├── API Developer: $0.0475 (95%)  ✅ Instant payment
└── Platform Fee: $0.0025 (5%)   ✅ Platform sustainability
```

### 📊 **Step 6: Analytics & Management**

#### **For API Developers:**
```javascript
// Check earnings
app.get('/dashboard', (req, res) => {
  const analytics = paywall.getAnalytics();
  
  res.json({
    totalCalls: analytics.totalCalls,      // 1,247
    totalRevenue: analytics.totalRevenue,  // "62.35"
    uniqueUsers: analytics.uniqueUsers,    // 89
    averagePrice: analytics.averagePrice   // "0.05"
  });
});
```

#### **For Consumers:**
- **Usage tracking** across all APIs
- **Spending analytics** 
- **API performance** metrics
- **Payment history**

## 🎯 **Real Examples**

### Weather API Provider
```bash
# Register weather API
npx @agentpay/cli register \
  --name "Global Weather API" \
  --category "Weather & Environment" \
  --price "0.03" \
  --endpoint "https://weatherapi.example.com"

# Earnings after 1 month
Total Calls: 5,432 calls
Revenue: $162.96 USDC (5,432 × $0.03)
Monthly Passive Income: $162.96
```

### AI Model Provider
```bash
# Register AI model
npx @agentpay/cli register \
  --name "Code Generation AI" \
  --category "Artificial Intelligence" \
  --price "0.50" \
  --endpoint "https://ai-code.example.com"

# Premium pricing example
Total Calls: 1,200 calls  
Revenue: $600 USDC (1,200 × $0.50)
Monthly Passive Income: $600
```

### Financial Data Provider
```bash
# Register crypto prices API
npx @agentpay/cli register \
  --name "Real-time Crypto Prices" \
  --category "Financial Data" \
  --price "0.01" \
  --endpoint "https://cryptoprices.example.com"

# High volume, low price
Total Calls: 25,000 calls
Revenue: $250 USDC (25,000 × $0.01)  
Monthly Passive Income: $250
```

## 🔄 **Complete Ecosystem**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Provider  │    │   Marketplace   │    │  API Consumer   │
│                 │    │                 │    │                 │
│ 1. Add paywall  │───▶│ 2. Auto-index   │◀───│ 3. Discover APIs│
│ 2. Set pricing  │    │ 3. Show catalog │    │ 4. Pay & call   │
│ 3. Earn revenue │◀───│ 4. Process pay  │───▶│ 5. Get response │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │ Smart Contract  │
                    │                 │
                    │ • Model registry│
                    │ • Payment logic │
                    │ • Revenue split │
                    │ • Usage stats   │
                    └─────────────────┘
```

## 🚀 **Getting Started**

### For API Providers:
```bash
# 1. Install SDK
npm install @agentpay/paywall-sdk

# 2. Add to your API
app.use('/api', paywall.protect())

# 3. Start earning immediately!
```

### For API Consumers:
```bash
# 1. Install consumer SDK  
npm install @agentpay/consumer-sdk

# 2. Browse marketplace
npx @agentpay/cli browse

# 3. Start using paid APIs
const result = await agentpay.callAPI('api-id', data, { price: '0.05' })
```

## 💡 **Key Benefits**

### For Developers:
- ✅ **One-line integration** - `paywall.protect()`
- ✅ **Instant monetization** - Start earning immediately  
- ✅ **No payment infrastructure** - Handled automatically
- ✅ **Global marketplace exposure** - Discoverable to all users
- ✅ **Real-time analytics** - Track usage and revenue

### For Consumers:
- ✅ **Discover quality APIs** - Curated marketplace
- ✅ **Pay-per-use model** - No subscriptions
- ✅ **Instant access** - No API key management
- ✅ **Quality ratings** - Community-driven reviews
- ✅ **Try before buy** - Test APIs in marketplace

### For the Ecosystem:
- ✅ **Decentralized** - No central authority
- ✅ **Cross-chain** - Works on 11+ blockchains
- ✅ **Developer-friendly** - Minimal setup
- ✅ **Scalable** - Handles high volume
- ✅ **Sustainable** - Revenue model for all participants 