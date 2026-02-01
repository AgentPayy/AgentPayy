# Changelog

Notable changes to Unlock project documented here.

## [0.1.0] - 2025-10-31

### Added

**Extension:**
1. Chrome MV3 extension with fetch/XHR interception
2. HTTP 402 payment flow with modal UI
3. Coinbase facilitator integration for wallet
4. Starter credits system ($3 free for new users)
5. Daily spending caps with auto-pay mode
6. Receipt storage and management
7. 30-minute refund window support
8. Popup UI with settings and transaction history
9. Success/error toast notifications
10. Payment proof generation and verification

**Publisher SDK:**
1. Express middleware for x402 integration
2. Route-based pricing configuration
3. Static and dynamic pricing support
4. Payment verification via facilitator
5. Receipt attachment to request object
6. Custom refund policy support
7. Multi-network support (Base, BNB, Polygon, Ethereum)
8. X-PAYMENT-RESPONSE header injection
9. TypeScript type definitions
10. Simple API for single-route protection

**Demo Server:**
1. Reference implementation with 5 protected routes
2. Premium article examples
3. API endpoint examples
4. Dynamic pricing demonstration
5. Beautiful landing page
6. Receipt display in unlocked content
7. Environment configuration
8. Development mode with hot reload

**Documentation:**
1. Comprehensive README with quick start
2. ARCHITECTURE.md with technical deep-dive
3. SETUP.md with installation instructions
4. CONTRIBUTING.md with development guidelines
5. QUICKSTART.md for rapid onboarding
6. Publisher SDK README with examples
7. Icon placeholder instructions
8. License (MIT)

**Infrastructure:**
1. Monorepo with npm workspaces
2. TypeScript configuration
3. Shared type definitions
4. Build scripts
5. .gitignore configuration

### Technical Details

1. **Extension Architecture:**
   - Service worker for payment processing
   - Content script for request interception
   - Popup for settings UI
   - Chrome storage for receipts and config

2. **Payment Flow:**
   - Intercept 402 responses
   - Parse PaymentRequiredResponse
   - Submit transaction via facilitator
   - Generate payment proof
   - Retry request with X-PAYMENT header
   - Verify and return content

3. **Security:**
   - Server-side payment verification
   - Facilitator-based KYC/OFAC compliance
   - HTTPS enforcement
   - No private keys in extension
   - Replay attack prevention

4. **Networks:**
   - Base (primary, lowest fees)
   - BNB Chain
   - Polygon
   - Ethereum

### Known Limitations

1. Chrome only (Firefox/Safari planned)
2. Manual extension refresh required (MV3 limitation)
3. No automated tests yet
4. Icons are SVG placeholders (need PNG conversion)
5. Facilitator API mocked (using Coinbase endpoints)
6. No multi-facilitator support yet
7. No MetaMask connector yet

## [Unreleased]

### Planned for 0.2.0

1. Firefox and Safari extension ports
2. Multi-wallet support (MetaMask, WalletConnect)
3. Payment caching for repeated resources
4. Verification result caching
5. Automated testing (unit, integration, E2E)
6. PNG icon generation
7. Production facilitator integration
8. Day-Pass bundle system
9. Referral mechanics
10. Paylinks system

### Planned for 0.3.0

1. Publisher dashboard with analytics
2. API-key killer SDK
3. Ad-free mode toggle
4. Campus blitz program (.edu credits)
5. Social sharing features
6. Receipt export (CSV/JSON)
7. Multi-facilitator support
8. Privacy enhancements
9. Performance optimizations
10. Mobile browser support

---

**Format based on [Keep a Changelog](https://keepachangelog.com/)**

