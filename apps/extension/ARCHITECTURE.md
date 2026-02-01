# Unlock Architecture

Technical deep-dive into system design, data flows, and implementation details.

## System Architecture

### High-Level Flow

```
User Browser                Extension              Facilitator           Publisher
     |                          |                        |                    |
     |--- GET /article -------->|                        |                    |
     |                          |----------------- GET /article ------------->|
     |                          |<----------- 402 Payment Required -----------|
     |<-- Show Payment UI ------|                        |                    |
     |                          |                        |                    |
     |--- Approve Payment ----->|                        |                    |
     |                          |--- Submit Tx --------->|                    |
     |                          |<-- Tx Hash ------------|                    |
     |                          |                        |                    |
     |                          |-- GET /article (X-PAYMENT header) -------->|
     |                          |                        |<-- Verify Tx ------|
     |                          |                        |--- Confirmed ------>|
     |                          |<------------ 200 OK + Content --------------|
     |<-- Display Content ------|                        |                    |
```

## Extension Architecture (MV3)

### Service Worker (background.js)

**Responsibilities:**
1. Payment state management
2. Wallet operations
3. Receipt storage
4. Daily cap enforcement
5. Facilitator API communication

**Key Functions:**

1. `handlePaymentRequired(paymentReq, tabId)`
   - Validates payment request structure
   - Checks daily cap and balance
   - Returns approval requirement or auto-processes

2. `processPayment(paymentReq, paymentId)`
   - Submits transaction via facilitator
   - Generates payment proof
   - Updates receipts and spending totals
   - Returns payment header for request retry

3. `submitTransaction(scheme, wallet)`
   - Calls facilitator `/submit` endpoint
   - Handles USDC transfer on specified network
   - Returns transaction hash

4. `verifyPayment(txHash, network)`
   - Called by publishers via facilitator
   - Confirms on-chain settlement
   - Returns receipt data

**Storage Schema:**

```typescript
{
  config: {
    wallet: {
      address: string,
      network: string,
      balance: string,
      provider: 'coinbase' | 'metamask'
    },
    dailyCap: {
      limit: string,
      spent: string,
      resetAt: number
    },
    receipts: Array<{
      url: string,
      amount: string,
      network: string,
      transactionHash: string,
      timestamp: number,
      refundable: boolean,
      expiresAt: number
    }>,
    starterCredits: string,
    autoPayEnabled: boolean,
    maxPerTransaction: string
  }
}
```

### Content Script (content.js)

**Responsibilities:**
1. Intercept fetch() and XMLHttpRequest calls
2. Detect HTTP 402 responses
3. Display payment UI modals
4. Retry requests with payment headers

**Implementation:**

Proxies `window.fetch` and `XMLHttpRequest` to intercept responses before they reach page code:

```javascript
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  if (response.status === 402) {
    return handlePaymentRequired(response, args);
  }
  return response;
};
```

**Payment UI:**
- Fixed position overlay with modal
- Shows amount, network, refund policy
- Approve/Decline actions
- Toast notifications for success/error

### Popup (popup.html/js)

**Features:**
1. Balance display (starter credits + daily spent)
2. Settings (auto-pay toggle, max transaction)
3. Recent receipts list (last 5)
4. Add funds CTA
5. View all receipts link

## Publisher SDK Architecture

### Middleware Flow

```
Request → x402Middleware → Protected Route
            |
            ├─ No X-PAYMENT header?
            │  └─ Return 402 + PaymentRequiredResponse
            |
            ├─ Has X-PAYMENT header?
            │  ├─ Parse header (base64 → JSON)
            │  ├─ Verify with facilitator
            │  ├─ Valid? → Attach receipt to req, continue
            │  └─ Invalid? → Return 402 + error
```

### Middleware Configuration

```typescript
interface X402Config {
  payToAddress: string;          // Publisher wallet
  network?: 'base' | 'bnb';      // Settlement chain
  facilitator?: string;          // Verification endpoint
  refundPolicy?: string;         // Custom refund terms
}

interface RouteConfig {
  [path: string]: string | ((req) => string);
}
```

**Example:**

```typescript
app.use(x402Middleware(
  {
    payToAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    network: 'base',
    refundPolicy: 'Full refund within 30 minutes'
  },
  {
    '/article': '$0.10',
    '/api/search': (req) => {
      const queries = parseInt(req.query.count) || 1;
      return `$${(queries * 0.005).toFixed(2)}`;
    }
  }
));
```

### Payment Verification

1. **Header Parsing:**
```typescript
const decoded = JSON.parse(
  Buffer.from(paymentHeader, 'base64').toString('utf-8')
);
```

2. **Facilitator Verification:**
```typescript
POST /verify
{
  "transactionHash": "0xabc...",
  "network": "base"
}

Response:
{
  "confirmed": true,
  "from": "0xuser...",
  "to": "0xpublisher...",
  "amount": "100000000000000000",
  "timestamp": 1730419200000
}
```

3. **Validation:**
   - Recipient matches payToAddress
   - Amount meets route requirement
   - Transaction confirmed on-chain

## Facilitator Integration

### Coinbase x402 Facilitator

**Base URL:** `https://x402.coinbase.com`

**Endpoints:**

1. `POST /wallet/create`
   - Creates embedded wallet for user
   - Returns address and signing keys
   - Handles KYC/OFAC compliance

2. `POST /submit`
   - Submits USDC transfer transaction
   - Parameters: network, to, amount, from, token
   - Returns: transactionHash

3. `POST /verify`
   - Verifies transaction confirmation
   - Parameters: transactionHash, network
   - Returns: confirmation status + details

4. `POST /refund`
   - Processes refund within window
   - Parameters: transactionHash, reason
   - Returns: refund transaction hash

### Security Considerations

1. **No private keys in extension:**
   - Coinbase facilitator manages keys
   - Future: MetaMask signs client-side

2. **Payment verification server-side:**
   - Publishers must verify via facilitator
   - Never trust X-PAYMENT header alone

3. **Replay attack prevention:**
   - Facilitator tracks used transaction hashes
   - Each payment requires unique on-chain tx

4. **Amount validation:**
   - Publishers verify amount matches route price
   - Prevents underpayment attacks

## Data Flow Details

### 1. Extension Install

```
1. chrome.runtime.onInstalled fires
2. Initialize storage with defaults:
   - dailyCap: { limit: "$1.00", spent: "$0.00" }
   - starterCredits: "$3.00"
   - receipts: []
3. Request wallet creation from facilitator
4. Store wallet address
5. Show onboarding popup
```

### 2. Payment Request Detection

```
1. Content script intercepts fetch/XHR
2. Response status = 402
3. Parse PaymentRequiredResponse body
4. Send to background via chrome.runtime.sendMessage
5. Background checks:
   - Daily cap not exceeded
   - Starter credits or balance sufficient
   - Amount within maxPerTransaction (if auto-pay)
6. If auto-pay: process immediately
   Else: return requiresApproval to content script
7. Content script shows payment UI modal
```

### 3. Payment Processing

```
1. User approves in modal
2. Content script sends USER_APPROVED_PAYMENT to background
3. Background calls submitTransaction:
   a. POST to facilitator /submit
   b. Facilitator creates USDC transfer tx
   c. Returns transaction hash
4. Background creates payment proof:
   {
     scheme, network, transactionHash,
     from, to, amount, timestamp
   }
5. Base64 encode proof → X-PAYMENT header value
6. Store receipt in receipts array
7. Update dailyCap.spent
8. Deduct from starterCredits if applicable
9. Return paymentHeader to content script
10. Content script retries original request with header
```

### 4. Publisher Verification

```
1. Request arrives with X-PAYMENT header
2. Middleware parses base64 → JSON
3. Extract transactionHash, network
4. POST to facilitator /verify
5. Facilitator checks:
   - Transaction exists on network
   - Confirmed (sufficient blocks)
   - Not previously used
6. Returns confirmation + details
7. Middleware validates:
   - To address matches payToAddress
   - Amount >= route price
8. Attach receipt to req object
9. Call next() → route handler executes
10. Return content with X-PAYMENT-RESPONSE header
```

## Performance Optimizations

### 1. Receipt Caching

Extension caches receipts for resources with `Cache-Control` headers:

```javascript
if (receipt.expiresAt > Date.now()) {
  const cached = receipts.find(r => r.url === url);
  if (cached) {
    return { cached: true, receipt: cached };
  }
}
```

### 2. Pre-Authorization (Day-Pass)

For unlimited bundles, extension pre-pays batch of "upto" schemes:

```json
{
  "scheme": "upto",
  "network": "base",
  "payTo": "0xdaypass...",
  "amount": "1000000000000000000"
}
```

Publishers track consumed amount via facilitator balance checks.

### 3. Parallel Verification

Publishers verify payments asynchronously to reduce latency:

```typescript
const verificationPromise = verifyPayment(header);
res.on('finish', async () => {
  await verificationPromise;
});
next();
```

### 4. Optimistic UI

Content script shows content immediately after payment submission, updates if verification fails:

```javascript
showOptimisticContent();
const verified = await waitForVerification();
if (!verified) revertContent();
```

## Error Handling

### Extension Errors

1. **Insufficient Balance:**
   - Show "Add Funds" CTA
   - Link to unlock.xyz/add-funds

2. **Network Failure:**
   - Retry up to 3 times
   - Show error toast with retry button

3. **Invalid Payment Request:**
   - Log to console
   - Show "Invalid payment request" error

4. **Transaction Failure:**
   - Automatic refund via facilitator
   - Notify user with toast

### Publisher Errors

1. **Verification Failed:**
   - Return 402 with error details
   - Log to server for monitoring

2. **Facilitator Timeout:**
   - Fallback to cached verification
   - Queue for async retry

3. **Invalid Header:**
   - Return 402 + "Invalid payment header"
   - Do not reveal parsing details (security)

## Security Model

### Threat Vectors

1. **Replay Attacks:**
   - Mitigation: Facilitator tracks used tx hashes
   - Each payment requires unique on-chain transaction

2. **Underpayment:**
   - Mitigation: Publishers verify amount server-side
   - Never trust header alone

3. **MITM Header Theft:**
   - Mitigation: HTTPS required
   - Payment headers tied to specific URLs
   - Facilitator rate-limits verification

4. **Extension Spoofing:**
   - Mitigation: Signed extension via Chrome Web Store
   - Publishers verify via facilitator, not extension

5. **Facilitator Compromise:**
   - Mitigation: Multi-facilitator support planned
   - Users can choose provider
   - Self-custody wallet option

## Scalability

### Extension

1. **Storage limits:** Chrome provides unlimited storage for extensions
2. **Memory:** Service worker lifecycle managed by browser
3. **Receipt pruning:** Auto-delete receipts >90 days

### Publisher SDK

1. **Stateless verification:** No session management required
2. **Horizontal scaling:** Middleware works across instances
3. **Facilitator caching:** Cache verification results for 10 minutes

### Facilitator

1. **Read-only blockchain queries:** Highly cacheable
2. **Transaction submission:** Batched for efficiency
3. **CDN distribution:** Geo-distributed endpoints

## Monitoring & Analytics

### Extension Metrics

1. Install-to-first-unlock time
2. Payment success rate
3. Average transaction value
4. Daily active unlocks
5. Refund rate

### Publisher Metrics

1. 402 response rate
2. Payment conversion rate
3. Revenue per visitor (RPV)
4. Average transaction value
5. Refund requests

### Facilitator Metrics

1. Transaction volume
2. Verification latency
3. Network fee costs
4. Uptime
5. Fraud detection rate

## Future Enhancements

### 1. Multi-Facilitator Support

Allow users to choose between:
- Coinbase (KYC, hosted)
- Self-custody (MetaMask)
- Other providers (competition)

### 2. L2 Optimization

Support cheaper networks:
- Optimism
- Arbitrum
- zkSync

### 3. Subscription Bundling

Publishers offer "unlimited" for fixed price:
```json
{
  "scheme": "subscription",
  "duration": 2592000,
  "price": "5000000000000000000"
}
```

### 4. Privacy Enhancements

- Zero-knowledge payment proofs
- Anonymous credentials
- Unlinkable payments

### 5. Agent API

Expose local endpoint for AI agents:
```javascript
POST http://localhost:8402/pay
{
  "url": "https://api.example.com/data",
  "maxAmount": "0.01"
}
```

## Testing Strategy

### Extension Tests

1. **Unit:** Payment calculation, cap enforcement
2. **Integration:** Facilitator API mocking
3. **E2E:** Automated browser testing with demo server

### Publisher SDK Tests

1. **Unit:** Middleware logic, verification parsing
2. **Integration:** Real facilitator API (testnet)
3. **Load:** Concurrent payment verification

### Security Tests

1. Replay attack simulation
2. Header tampering
3. Amount manipulation
4. MITM scenarios

---

**This architecture prioritizes security, performance, and developer experience.**

