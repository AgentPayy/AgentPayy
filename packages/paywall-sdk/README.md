# @agentpay/paywall-sdk

> **Express middleware for instantly monetizing your APIs with crypto payments**

Transform any Express API into a revenue-generating endpoint with just one line of code. No complex payment integration, no API key management - just add the middleware and start earning.

## 🚀 Quick Start

### Installation

```bash
npm install @agentpay/paywall-sdk
```

### Basic Usage (5-Minute Integration)

```typescript
import express from 'express';
import { AgentPayWall } from '@agentpay/paywall-sdk';

const app = express();

// Initialize paywall
const paywall = new AgentPayWall({
  apiKey: 'your-api-key',
  pricePerQuery: '0.01'
});

// Protect all routes under /api
app.use('/api', paywall.protect());

// Your existing API endpoints remain unchanged!
app.get('/api/weather', (req, res) => {
  res.json({ 
    temperature: 72,
    payer: req.agentpay.payer // Payment metadata available
  });
});

app.listen(3000);
```

**That's it!** Your API now requires payment and you start earning immediately.

## ✨ Features

- **One-Line Integration** - Add `paywall.protect()` to any route
- **No Code Changes** - Your existing API logic stays the same
- **Automatic Verification** - Payment proof validation handled automatically
- **Real-time Analytics** - Track calls, revenue, and user metrics
- **Multi-chain Support** - Base, Arbitrum, Optimism
- **Flexible Pricing** - Per-route custom pricing

## 🔧 API Reference

### Basic Protection

```typescript
// Protect all routes with default pricing
app.use(paywall.protect());

// Protect specific route with custom price
app.get('/api/premium', 
  paywall.protect({ price: '0.05' }),
  (req, res) => {
    // Only paid requests reach here
    res.json({ data: 'premium content' });
  }
);
```

### Payment Metadata

```typescript
app.get('/api/data', paywall.protect(), (req, res) => {
  // Access payment information
  console.log('Paid by:', req.agentpay.payer);
  console.log('Amount:', req.agentpay.paymentAmount);
  console.log('Timestamp:', req.agentpay.timestamp);
  
  res.json({ data: 'your response' });
});
```

### Analytics

```typescript
// Get real-time analytics
app.get('/analytics', (req, res) => {
  const stats = paywall.getAnalytics();
  res.json(stats);
});

// Example response:
// {
//   totalCalls: 1250,
//   totalRevenue: "15.75",
//   uniqueUsers: 89,
//   averagePrice: "0.0126",
//   recentCalls: [...]
// }
```

### Health Check

```typescript
// Built-in health check endpoint
app.get('/health', paywall.healthCheck());

// Returns:
// {
//   status: "healthy",
//   apiKey: "ap_1234...",
//   chain: "base",
//   pricePerQuery: "0.01",
//   contractConnected: true
// }
```

## 🎯 Use Cases

### Weather API Service
```typescript
const paywall = new AgentPayWall({
  apiKey: 'weather-api-key',
  pricePerQuery: '0.02'
});

app.get('/weather/:city', 
  paywall.protect(),
  (req, res) => {
    const weather = getWeatherData(req.params.city);
    res.json(weather);
  }
);
```

### AI Model API
```typescript
// Premium AI model with higher pricing
app.post('/ai/generate', 
  paywall.protect({ price: '0.25' }),
  async (req, res) => {
    const result = await aiModel.generate(req.body.prompt);
    res.json({ 
      result,
      cost: req.agentpay.paymentAmount 
    });
  }
);
```

### Tiered Pricing
```typescript
// Different pricing for different endpoints
app.get('/api/basic', paywall.protect({ price: '0.01' }), handler);
app.get('/api/premium', paywall.protect({ price: '0.05' }), handler);
app.get('/api/enterprise', paywall.protect({ price: '0.20' }), handler);
```

### Analytics Dashboard
```typescript
app.get('/dashboard', (req, res) => {
  const analytics = paywall.getAnalytics();
  
  res.send(`
    <h1>API Analytics</h1>
    <p>Total Calls: ${analytics.totalCalls}</p>
    <p>Total Revenue: $${analytics.totalRevenue} USDC</p>
    <p>Unique Users: ${analytics.uniqueUsers}</p>
    <p>Average Price: $${analytics.averagePrice}</p>
  `);
});
```

## 💰 Revenue Management

### Check Earnings
```typescript
// Check your accumulated earnings
const earnings = await paywall.checkEarnings(yourWalletAddress);
console.log(`You've earned $${earnings} USDC`);
```

### Withdraw Earnings
```typescript
import { ethers } from 'ethers';

// Connect your wallet
const wallet = new ethers.Wallet(privateKey, provider);

// Withdraw all earnings
const txHash = await paywall.withdrawEarnings(wallet);
console.log(`Withdrawal transaction: ${txHash}`);
```

## 🔐 Security Features

### Payment Verification
- **Signature Verification** - Cryptographic proof of payment
- **Replay Protection** - Timestamps prevent reuse
- **On-chain Validation** - Optional balance verification
- **Rate Limiting** - Built-in protection against abuse

### Error Handling
```typescript
app.use((err, req, res, next) => {
  if (err.name === 'PaymentError') {
    res.status(402).json({
      error: 'Payment required',
      details: err.message
    });
  } else {
    next(err);
  }
});
```

## ⚙️ Configuration Options

```typescript
const paywall = new AgentPayWall({
  apiKey: 'your-api-key',        // Required: Your unique API key
  pricePerQuery: '0.01',         // Default price in USDC
  chain: 'base',                 // Chain: base | arbitrum | optimism
  requireBalance: true,          // Require prepaid balance vs permits
  analytics: true                // Enable analytics tracking
});
```

## 🚀 Deployment Example

```typescript
// production-api.js
import express from 'express';
import { AgentPayWall } from '@agentpay/paywall-sdk';

const app = express();
const paywall = new AgentPayWall({
  apiKey: process.env.AGENTPAY_API_KEY,
  pricePerQuery: process.env.DEFAULT_PRICE || '0.01',
  chain: process.env.CHAIN || 'base'
});

// Health check (free)
app.get('/health', paywall.healthCheck());

// Protected API routes
app.use('/api/v1', paywall.protect());

// Your API endpoints
app.get('/api/v1/data', (req, res) => {
  res.json({ data: 'This request was paid for!' });
});

// Analytics (free, but could be protected)
app.get('/analytics', (req, res) => {
  res.json(paywall.getAnalytics());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`💰 Monetized API running on port ${PORT}`);
});
```

## 📊 Revenue Potential

### Example Revenue Calculations

| API Calls/Day | Price/Call | Daily Revenue | Monthly Revenue |
|---------------|------------|---------------|-----------------|
| 100           | $0.01      | $1.00         | $30.00          |
| 1,000         | $0.05      | $50.00        | $1,500.00       |
| 10,000        | $0.02      | $200.00       | $6,000.00       |
| 100,000       | $0.01      | $1,000.00     | $30,000.00      |

*95% goes to you, 5% platform fee*

## 🔗 Integration with Consumer SDK

Users call your API using the consumer SDK:

```typescript
// User's code with @agentpay/consumer-sdk
import { AgentPayKit } from '@agentpay/consumer-sdk';

const agentpay = new AgentPayKit();
const result = await agentpay.callAPI('https://yourapi.com/api/data', {
  query: 'some data'
}, { price: '0.01' });
```

Your paywall automatically verifies the payment and lets the request through!

## 🔗 Related Packages

- **[@agentpay/consumer-sdk](../consumer-sdk)** - For API consumers to pay for APIs
- **[@agentpay/core](../core)** - Shared utilities and types

## 📖 Documentation

- [Complete API Reference](../../docs/PAYWALL_SDK_API.md)
- [User Journey Guide](../../docs/USER_JOURNEY.md)
- [Examples & Tutorials](../../examples/paywall-sdk)

## 🆘 Support

- [GitHub Issues](https://github.com/agentpay/agentpay/issues)
- [Discord Community](https://discord.gg/agentpaykit)
- [Documentation](../../docs)

## License

MIT - see [LICENSE](../../LICENSE) for details. 