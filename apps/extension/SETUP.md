# Setup Instructions

Complete guide to getting Unlock running locally.

## Prerequisites

1. Node.js 18+ and npm 9+
2. Chrome browser (for extension testing)
3. Git
4. Text editor (VS Code recommended)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/unlock/unlock-x402.git
cd unlock-x402
```

### 2. Install Dependencies

Install all workspace dependencies:

```bash
npm install
```

This installs dependencies for:
- Root workspace
- Extension
- Publisher SDK
- Demo server

### 3. Build Publisher SDK

```bash
cd publisher-sdk
npm run build
cd ..
```

This compiles TypeScript to JavaScript in `publisher-sdk/dist/`.

### 4. Configure Demo Server

```bash
cd demo-server
cp .env.example .env
```

Edit `.env` and set your wallet address:

```env
PAY_TO_ADDRESS=0xYourWalletAddressHere
NETWORK=base
PORT=3000
```

**Getting a wallet address:**

1. Install MetaMask or Coinbase Wallet
2. Create Base network wallet
3. Copy address (starts with 0x)
4. Fund with small USDC for testing (optional)

### 5. Start Demo Server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

### 6. Load Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `extension` folder from this repo
5. Extension icon appears in toolbar

### 7. Test Payment Flow

1. Visit `http://localhost:3000` in Chrome
2. Click "Try Premium Article"
3. Extension intercepts 402 response
4. Payment modal appears
5. Click "Unlock Now"
6. Content loads (using starter credits)

## Development Workflow

### Extension Development

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click refresh icon on Unlock extension
4. Test changes in new tab

**Hot reload not available in MV3 - manual refresh required.**

### Publisher SDK Development

1. Edit files in `publisher-sdk/src/`
2. Rebuild:
```bash
cd publisher-sdk
npm run build
```
3. Restart demo server to see changes

**Or use watch mode:**
```bash
npm run dev
```

### Demo Server Development

Uses `ts-node` for hot reload:

```bash
npm run dev
```

Changes to `src/server.ts` reload automatically.

## Environment Variables

### Demo Server

```env
PAY_TO_ADDRESS     # Your wallet address (required)
NETWORK            # base | bnb | polygon (default: base)
PORT               # Server port (default: 3000)
FACILITATOR_URL    # Facilitator endpoint (default: Coinbase)
```

### Extension

No environment variables - configuration stored in Chrome storage.

## Testing

### Manual Testing Checklist

Extension:
1. ✓ Payment modal displays on 402 response
2. ✓ Starter credits deducted correctly
3. ✓ Daily cap enforced
4. ✓ Receipts saved and displayed
5. ✓ Auto-pay respects max transaction setting
6. ✓ Refund window shown in modal
7. ✓ Success/error toasts appear
8. ✓ Popup shows correct balances

Publisher SDK:
1. ✓ Routes without payment config pass through
2. ✓ Routes with payment return 402 without header
3. ✓ Valid payment header allows access
4. ✓ Invalid payment header returns 402 error
5. ✓ Receipt attached to request object
6. ✓ X-PAYMENT-RESPONSE header sent
7. ✓ Dynamic pricing works

### Automated Testing

**Not implemented yet.**

Planned:
- Jest for unit tests
- Puppeteer for extension E2E
- Supertest for SDK integration tests

## Troubleshooting

### Extension Issues

**Extension won't load:**
1. Check manifest.json syntax
2. Ensure all files exist (background.js, content.js, popup.html)
3. Check Chrome console for errors

**Payments failing:**
1. Check browser console (F12)
2. Look for network errors
3. Verify facilitator endpoint accessible
4. Check wallet initialization

**Storage errors:**
1. Clear extension data: chrome://extensions → Unlock → Remove
2. Reload extension
3. Data resets to defaults

### Server Issues

**Server won't start:**
1. Check port 3000 not in use: `lsof -i :3000`
2. Kill conflicting process: `kill -9 <PID>`
3. Verify dependencies installed
4. Check `.env` file exists

**402 responses not working:**
1. Verify middleware configured before routes
2. Check route paths match exactly
3. Test with curl:
```bash
curl -v http://localhost:3000/premium/article-1
```
Should return 402 with JSON body

**Payment verification failing:**
1. Check facilitator URL in config
2. Test facilitator connectivity
3. Verify transaction hash format
4. Check network parameter matches

### Network Issues

**Facilitator timeout:**
1. Check internet connection
2. Try different facilitator URL
3. Check firewall/proxy settings

**Transaction not confirming:**
1. Wait for block confirmation (Base: ~2 seconds)
2. Check transaction on block explorer
3. Verify network congestion status

## Production Deployment

### Extension Publication

1. Create production build:
```bash
cd extension
npm run pack
```

2. Upload `unlock-extension.zip` to Chrome Web Store
3. Complete store listing (screenshots, description)
4. Submit for review

**Review time: 1-3 days**

### Publisher SDK

1. Publish to npm:
```bash
cd publisher-sdk
npm publish --access public
```

2. Update docs with npm install instructions

### Demo Server

Deploy to cloud platform:

**Vercel:**
```bash
npm install -g vercel
cd demo-server
vercel
```

**Railway:**
```bash
npm install -g @railway/cli
railway init
railway up
```

**Set environment variables in hosting platform UI.**

## Performance Optimization

### Extension

1. Enable payment caching for repeated resources
2. Set aggressive daily caps for testing
3. Use auto-pay for trusted domains

### Server

1. Enable CDN for static assets
2. Cache facilitator verification (10 min TTL)
3. Use connection pooling
4. Enable gzip compression

## Security Considerations

### Development

1. Never commit real wallet private keys
2. Use testnet addresses for local testing
3. Set low payment amounts during development
4. Enable CORS only for localhost

### Production

1. Use environment variables for secrets
2. Enable HTTPS only
3. Implement rate limiting
4. Monitor for unusual payment patterns
5. Set up automated refund policies

## Additional Resources

1. x402 Specification: https://x402.org
2. Coinbase Facilitator Docs: https://docs.x402.coinbase.com
3. Chrome Extension MV3 Guide: https://developer.chrome.com/docs/extensions/mv3
4. Base Network Docs: https://docs.base.org

## Getting Help

1. Check ARCHITECTURE.md for technical details
2. Search GitHub issues
3. Join Discord (link in README)
4. Email support@unlock.xyz

---

**Happy building! The web is waiting to be unlocked. 🔓**

