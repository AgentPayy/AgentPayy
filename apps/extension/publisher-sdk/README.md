# @unlock/publisher-sdk

Express middleware for seamless x402 micropayment integration.

## Installation

```bash
npm install @unlock/publisher-sdk
```

## Quick Start

```typescript
import express from 'express';
import { x402Middleware } from '@unlock/publisher-sdk';

const app = express();

app.use(x402Middleware(
  {
    payToAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    network: 'base'
  },
  {
    '/premium-article': '$0.10',
    '/api/data': '$0.01'
  }
));

app.get('/premium-article', (req, res) => {
  const receipt = req.x402Receipt;
  res.send(`Unlocked! Transaction: ${receipt.transactionHash}`);
});

app.listen(3000);
```

## Features

1. Automatic HTTP 402 responses for protected routes
2. Payment verification via Coinbase facilitator
3. Dynamic pricing support
4. Receipt attachment to request object
5. Customizable refund policies
6. Zero configuration for basic use

## Configuration

### X402Config

```typescript
interface X402Config {
  payToAddress: string;
  network?: 'base' | 'bnb' | 'ethereum' | 'polygon';
  facilitator?: string;
  refundPolicy?: string;
  defaultPrice?: string;
}
```

### RouteConfig

```typescript
interface RouteConfig {
  [path: string]: string | ((req: Request) => string);
}
```

## Examples

### Static Pricing

```typescript
app.use(x402Middleware(
  { payToAddress: '0x...' },
  {
    '/article-1': '$0.10',
    '/article-2': '$0.15',
    '/whitepaper': '$0.50'
  }
));
```

### Dynamic Pricing

```typescript
app.use(x402Middleware(
  { payToAddress: '0x...' },
  {
    '/api/search': (req) => {
      const queries = parseInt(req.query.queries) || 1;
      return `$${(queries * 0.005).toFixed(2)}`;
    }
  }
));
```

### Custom Refund Policy

```typescript
app.use(x402Middleware(
  {
    payToAddress: '0x...',
    refundPolicy: 'Full refund within 1 hour if unsatisfied'
  },
  { '/article': '$0.10' }
));
```

### Multiple Networks

```typescript
app.use(x402Middleware(
  {
    payToAddress: '0x...',
    network: 'bnb'
  },
  { '/article': '$0.10' }
));
```

## Request Object Extensions

Middleware attaches receipt to request:

```typescript
app.get('/premium', (req, res) => {
  const receipt = req.x402Receipt;
  
  console.log(receipt.transactionHash);
  console.log(receipt.amount);
  console.log(receipt.network);
  console.log(receipt.from);
  console.log(receipt.to);
  
  res.send('Content here');
});
```

## Response Headers

Middleware adds `X-PAYMENT-RESPONSE` header with receipt data:

```
X-PAYMENT-RESPONSE: {"transactionHash":"0xabc...","amount":"100000000000000000",...}
```

## Error Handling

Invalid payments return 402 with error details:

```json
{
  "error": "Payment verification failed",
  "details": "Transaction not confirmed"
}
```

Handle in your error middleware:

```typescript
app.use((err, req, res, next) => {
  if (res.statusCode === 402) {
    res.json({ error: err.message });
  } else {
    next(err);
  }
});
```

## Simple API

For single-route protection:

```typescript
import { simpleX402 } from '@unlock/publisher-sdk';

app.use('/premium', simpleX402('0x...', '$0.10'));

app.get('/premium', (req, res) => {
  res.send('Unlocked content');
});
```

## TypeScript Support

Full type definitions included:

```typescript
import { X402Config, RouteConfig, VerificationResult } from '@unlock/publisher-sdk';
```

## Testing

Test with curl:

```bash
# Should return 402
curl -v http://localhost:3000/premium-article

# With payment header (get from extension)
curl -H "X-PAYMENT: base64encodedpayload" http://localhost:3000/premium-article
```

## Performance

1. Stateless design (no session storage)
2. Async verification (non-blocking)
3. Facilitator response caching (planned)
4. Minimal overhead (<5ms per request)

## Security

1. Always verify payments server-side
2. Never trust X-PAYMENT headers without facilitator verification
3. Use HTTPS in production
4. Implement rate limiting for verification endpoints

## License

MIT

