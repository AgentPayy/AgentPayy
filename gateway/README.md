# AgentPayKit Gateway

> Event-driven payment gateway for API monetization

## Overview

The AgentPayKit Gateway handles payment verification, API routing, and event storage. It acts as the bridge between smart contracts and API endpoints, providing rate limiting, CORS support, and mock mode for development.

## Quick Start

```bash
npm install
npm start
# Gateway running on http://localhost:3000
```

## Features

- **Payment Verification**: Validates on-chain payments before API calls
- **API Routing**: Forwards paid requests to registered endpoints
- **Mock Mode**: Zero-friction testing without payments
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Support**: Cross-origin requests for web applications
- **Event Storage**: Redis-based caching and event logs
- **Health Monitoring**: Endpoint status tracking

## Architecture

```
Client/SDK → Gateway → Smart Contract → API Endpoint
    ↓           ↓           ↓            ↓
  Request → Verify → Process → Response
```

## API Endpoints

### Payment Flow

```bash
# Process paid API call
POST /api/call
{
  "modelId": "weather-v1",
  "input": {"city": "NYC"},
  "payment": {
    "amount": "0.01",
    "signature": "0x...",
    "deadline": 1234567890
  }
}
```

### Mock Mode

```bash
# Mock API call (development)
POST /api/mock/:modelId
{
  "input": {"city": "NYC"},
  "mock": true
}
```

### Registration

```bash
# Register API endpoint
POST /api/register
{
  "modelId": "weather-v1",
  "endpoint": "https://api.weather.com/v1",
  "price": "0.01",
  "owner": "0x..."
}
```

### Health & Status

```bash
GET /health              # Gateway health
GET /api/models         # Registered APIs
GET /api/stats          # Usage statistics
```

## Configuration

### Environment Variables

```bash
# Required
REDIS_URL=redis://localhost:6379
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...

# Optional
PORT=3000
RATE_LIMIT_WINDOW=900000    # 15 minutes
RATE_LIMIT_MAX=100          # Max requests per window
CORS_ORIGINS=*              # Allowed origins
LOG_LEVEL=info
```

### Network Configuration

The gateway automatically reads contract addresses from environment variables:

```bash
AGENTPAY_ETHEREUM_CONTRACT=0x...
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...
AGENTPAY_OPTIMISM_CONTRACT=0x...
# ... (13 networks total)
```

## Payment Verification Flow

1. **Request Received**: Client sends payment + API call
2. **Signature Validation**: Verify payment signature
3. **Contract Check**: Validate payment on-chain
4. **Balance Deduction**: Use prepaid balance or process permit
5. **API Forward**: Route request to registered endpoint
6. **Response Return**: Return API response to client
7. **Event Log**: Store transaction for analytics

## Mock Mode Implementation

```typescript
// Generate realistic mock responses
generateMockResponse(modelId: string, input: any) {
  switch(modelId) {
    case 'weather-api':
      return { temperature: 72, condition: 'sunny', city: input.city }
    case 'token-prices':
      return { symbol: input.symbol, price: Math.random() * 1000 }
    default:
      return { mock: true, modelId, input }
  }
}
```

## Rate Limiting

- **Per IP**: 100 requests per 15 minutes
- **Per API**: Configurable per endpoint
- **Bypass**: Premium users with balance > $100
- **Headers**: Rate limit info in response headers

## Error Handling

```typescript
// Standard error responses
{
  "error": "INSUFFICIENT_PAYMENT",
  "message": "Payment amount too low",
  "required": "0.01",
  "provided": "0.005"
}
```

Common errors:
- `INVALID_SIGNATURE`: Payment signature invalid
- `INSUFFICIENT_PAYMENT`: Amount below required
- `MODEL_NOT_FOUND`: API not registered
- `RATE_LIMITED`: Too many requests
- `ENDPOINT_UNAVAILABLE`: Target API down

## Monitoring

### Metrics Tracked

- Request volume per endpoint
- Payment success/failure rates
- Response times
- Error rates
- Active users

### Health Checks

```bash
# Gateway health
curl http://localhost:3000/health

# Individual API health
curl http://localhost:3000/api/models/weather-v1/health
```

## Development

### Running Locally

```bash
# Install dependencies
npm install

# Start Redis
redis-server

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Testing

```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Load testing
npm run test:load
```

## Production Deployment

### Docker

```bash
# Build image
docker build -t agentpay-gateway .

# Run container
docker run -p 3000:3000 \
  -e REDIS_URL=redis://redis:6379 \
  -e AGENTPAY_BASE_CONTRACT=0x... \
  agentpay-gateway
```

### Railway/Heroku

```bash
# Deploy to Railway
railway up

# Deploy to Heroku
git push heroku main
```

## Security

- **Rate limiting**: Prevents abuse
- **CORS protection**: Configurable origins
- **Input validation**: All requests sanitized
- **Error masking**: No sensitive info in errors
- **Redis security**: Connection encryption

## Integration

The gateway integrates with:
- Smart contracts for payment verification
- External APIs for data routing
- Redis for caching and rate limiting
- SDKs for client communication

See main README for complete integration examples. 