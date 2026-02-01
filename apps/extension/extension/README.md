# Unlock Browser Extension

Official x402-compliant browser extension for seamless micropayments.

## Architecture

### Official x402 Integration

The extension now uses official x402 packages:
- **x402-fetch**: Official client for handling HTTP 402 responses
- **viem**: Ethereum wallet/signing library (used by x402)

### Unlock-Specific Features

While using official x402 core, we add:
1. **Starter Credits**: $3 free on install
2. **Daily Caps**: Spending limits to prevent overspending
3. **Beautiful UI**: Payment modals with clear pricing
4. **Receipt Management**: Track all unlocks with refund windows
5. **Auto-Pay Mode**: Optional automatic payments under threshold

## Files

- `background.js` - Service worker using official x402 signer
- `content.js` - Fetch interception with Unlock UX
- `popup.html/js/css` - Settings and receipts UI
- `manifest.json` - MV3 configuration

## Development

```bash
# Install dependencies
npm install

# Load in Chrome
1. Go to chrome://extensions/
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the extension folder
```

## How It Works

1. **Wallet Creation**: Generates private key on install, creates x402 signer
2. **402 Detection**: Content script intercepts 402 responses
3. **Payment Flow**: 
   - Check Unlock caps/credits
   - Show approval UI if needed
   - Use official x402 signer to create payment
   - Retry request with X-PAYMENT header
4. **Receipt Storage**: Track all payments with 30-min refund window

## Network

Currently using `base-sepolia` testnet. Change `NETWORK` constant in `background.js` for mainnet.

## Security

- Private keys stored in Chrome storage (encrypted in production build)
- Official x402 signing ensures spec compliance
- Daily caps prevent accidental overspending
- Refund window for user protection

## Upgrade from Custom to Official

Version 0.2.0 replaced custom payment logic with official x402-fetch while keeping all Unlock UX features.

