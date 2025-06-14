# Express + AgentPayy Integration

## Install
```bash
npm install express @agentpayy/sdk
```

## API Provider Setup
```typescript
import express from 'express';
import { AgentPayyKit } from '@agentpayy/sdk';

const app = express();
const agentPay = new AgentPayyKit({
  network: 'base' // Connects to deployed AgentPayy contracts
});

// Payment validation middleware
async function validatePayment(req, res, next) {
  const txHash = req.headers['x-agentpay-tx'];
  const inputData = req.body;
  
  const isValid = await agentPay.validatePayment(txHash, inputData);
  if (!isValid) {
    return res.status(402).json({ error: 'Payment required' });
  }
  
  next();
}

// Protected API endpoint
app.post('/api/weather', validatePayment, async (req, res) => {
  const { city } = req.body;
  
  // Your API logic here
  const weatherData = await getWeatherData(city);
  
  // Mark payment as processed
  await agentPay.markValidated(req.headers['x-agentpay-tx']);
  
  res.json(weatherData);
});

app.listen(3000);
```

## Client Usage
```typescript
import { AgentPayyKit } from '@agentpayy/sdk';

const client = new AgentPayyKit({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});

// Pay for API call
const weather = await client.callAPI(
  'http://localhost:3000/api/weather',
  { city: 'NYC' },
  'weather-api'
);
```

## Key Benefits
- Simple middleware integration
- Automatic payment validation
- Uses deployed AgentPayy contracts
- No blockchain setup required 