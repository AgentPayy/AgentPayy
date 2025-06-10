# AgentPayKit User Journey Documentation

## Complete Flow: API Registration → Payment → Execution

This document walks through the entire ecosystem flow from both perspectives: API providers (developers) and API consumers (users/agents).

---

## 🚀 **PART 1: API Provider Journey (Developer Registration)**

### **Step 1: Developer Onboarding**

**Developer Sarah** wants to monetize her weather API.

```bash
# Sarah generates a smart wallet for her business
agentpay generate-wallet --smart --provider biconomy --name "WeatherAPI-Business"
```

**What happens:**
- `UniversalWalletAdapter` creates a Biconomy smart account
- Generates both EOA (for signing) and smart contract wallet (for gasless transactions)
- Sarah gets address: `0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B`

### **Step 2: API Registration on Smart Contract**

Sarah registers her weather API with pricing:

```bash
agentpay register-api weather-premium 0.05 \
  --endpoint "https://api.sarahweather.com/premium" \
  --description "Premium weather data with forecasts"
```

**Smart Contract Interaction:**
```solidity
// Calls AgentPayContract.registerModel()
function registerModel(
    string memory modelId,     // "weather-premium"
    string memory endpoint,    // "https://api.sarahweather.com/premium"  
    uint256 price,            // 0.05 USDC (50000 wei with 6 decimals)
    address token             // USDC contract address
) external {
    models[modelId] = Model({
        owner: msg.sender,        // Sarah's wallet address
        endpoint: endpoint,       // Her API endpoint
        price: price,            // 0.05 USDC
        token: token,            // USDC contract
        active: true,
        totalCalls: 0,
        totalRevenue: 0
    });
    
    emit ModelRegistered(modelId, msg.sender, price);
}
```

**On-Chain State Created:**
```javascript
// Smart contract now stores:
models["weather-premium"] = {
    owner: "0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B",  // Sarah
    endpoint: "https://api.sarahweather.com/premium",
    price: "50000",  // 0.05 USDC in wei
    token: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",  // USDC
    active: true,
    totalCalls: 0,
    totalRevenue: 0
}
```

### **Step 3: API Gateway Registration**

The AgentPay Gateway automatically detects the on-chain registration:

```javascript
// Gateway listens for ModelRegistered events
contract.on("ModelRegistered", (modelId, owner, price) => {
    // Store API routing information
    apiRegistry[modelId] = {
        owner: owner,
        endpoint: getEndpointFromContract(modelId),
        price: price,
        active: true
    };
    
    console.log(`✅ API ${modelId} registered by ${owner}`);
});
```

**Sarah's API is now live and discoverable!**

---

## 💰 **PART 2: API Consumer Journey (User Payment & Usage)**

### **Step 4: User Setup**

**Developer Alex** needs weather data for his trading bot.

```bash
# Alex sets up his AI agent with dual capabilities
agentpay setup --name "TradingBot" --balance 25.0
```

**What happens:**
- Alex gets a smart wallet: `0x8Ba1f109551bD432803012645Hac189451c4Bc58`
- Deposits 25 USDC to prepaid balance
- Now ready to consume APIs AND potentially offer his own

### **Step 5: API Discovery & Call**

Alex discovers Sarah's weather API and makes a call:

```bash
# Alex calls Sarah's weather API
agentpay payAndCall weather-premium '{"city": "NYC", "forecast": true}' \
  --price 0.05 \
  --useBalance true
```

### **Step 6: Payment Processing Flow**

Here's the complete payment flow with smart contract interactions:

#### **6a. Balance Check**
```javascript
// EnhancedAgentPayKit checks Alex's prepaid balance
const balance = await contract.getUserBalance(
    "0x8Ba1f109551bD432803012645Hac189451c4Bc58",  // Alex
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"   // USDC
);
// balance = 25.0 USDC ✅ (sufficient for 0.05 USDC payment)
```

#### **6b. Input Hash Generation**
```javascript
// Create deterministic hash of API input
const input = {"city": "NYC", "forecast": true};
const inputJson = JSON.stringify(input, null, 0);
const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
// inputHash = "0x742d35cc6834c532fed686181c757c8eaa5a8f2b..."
```

#### **6c. Payment Data Structure**
```javascript
const paymentData = {
    modelId: "weather-premium",
    inputHash: "0x742d35cc6834c532fed686181c757c8eaa5a8f2b...",
    amount: "50000",  // 0.05 USDC in wei
    deadline: 1706123456,  // Unix timestamp
    smartWalletSig: "0x...",  // Alex's signature
    v: 27, r: "0x...", s: "0x..."  // For permit/fallback
};
```

#### **6d. Smart Contract Execution**
```solidity
function payAndCall(PaymentData memory payment) external {
    // 1. Validate payment
    Model storage model = models[payment.modelId];
    require(model.active, "Model not active");
    require(payment.amount >= model.price, "Insufficient payment");
    
    // 2. Process payment from Alex's balance
    userBalances[msg.sender][model.token] -= payment.amount;
    
    // 3. Credit Sarah's earnings
    earnings[model.owner][model.token] += payment.amount;
    
    // 4. Update model statistics
    model.totalCalls++;
    model.totalRevenue += payment.amount;
    
    // 5. Emit event for gateway
    emit PaymentProcessed(
        payment.modelId,
        msg.sender,      // Alex (payer)
        model.owner,     // Sarah (payee)
        payment.amount,
        payment.inputHash
    );
}
```

### **Step 7: API Call Routing**

The AgentPay Gateway processes the payment event:

```javascript
// Gateway receives PaymentProcessed event
contract.on("PaymentProcessed", async (modelId, payer, payee, amount, inputHash) => {
    console.log(`💰 Payment: ${payer} → ${payee} for ${modelId}`);
    
    // 1. Retrieve stored input data
    const inputData = await getStoredInput(inputHash);
    const parsedInput = JSON.parse(inputData);
    
    // 2. Get API endpoint from registry
    const api = apiRegistry[modelId];
    
    // 3. Forward request to Sarah's API
    const response = await axios.post(api.endpoint, {
        input: parsedInput,
        metadata: {
            payer: payer,
            paymentAmount: amount,
            timestamp: Date.now()
        }
    });
    
    // 4. Store response for retrieval
    await storeResponse(txHash, response.data);
});
```

### **Step 8: API Execution**

Sarah's weather API receives the request:

```javascript
// Sarah's API endpoint receives:
POST https://api.sarahweather.com/premium
{
    "input": {
        "city": "NYC",
        "forecast": true
    },
    "metadata": {
        "payer": "0x8Ba1f109551bD432803012645Hac189451c4Bc58",
        "paymentAmount": "50000",
        "timestamp": 1706123456789
    }
}

// Sarah's API processes and returns:
{
    "weather": {
        "city": "NYC",
        "temperature": 72,
        "forecast": [...],
        "premium_data": {...}
    },
    "status": "success"
}
```

### **Step 9: Response Delivery**

Alex receives the weather data:

```javascript
// Alex's payAndCall() returns:
{
    "weather": {
        "city": "NYC", 
        "temperature": 72,
        "forecast": [...]
    },
    "payment": {
        "amount": "0.05",
        "recipient": "0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B",
        "txHash": "0x...",
        "timestamp": 1706123456789
    }
}
```

---

## 📊 **PART 3: Financial Tracking & Settlement**

### **Step 10: Balance Updates**

**Smart Contract State After Payment:**

```javascript
// Alex's balance (consumer)
userBalances["0x8Ba1f109551bD432803012645Hac189451c4Bc58"]["USDC"] = "24.95"  // Was 25.00

// Sarah's earnings (provider)  
earnings["0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B"]["USDC"] = "0.05"  // New earnings

// API statistics
models["weather-premium"] = {
    owner: "0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B",
    totalCalls: 1,        // Incremented
    totalRevenue: "50000" // 0.05 USDC added
}
```

### **Step 11: Revenue Withdrawal**

Sarah can withdraw her earnings anytime:

```bash
# Sarah checks her earnings
agentpay financials
# Earnings: $0.05 USDC
# Balance: $0.00 USDC  
# Net Position: +$0.05 USDC

# Sarah withdraws earnings
agentpay earnings withdraw
```

**Smart Contract Withdrawal:**
```solidity
function withdraw(address token) external {
    uint256 amount = earnings[msg.sender][token];
    require(amount > 0, "No earnings");
    
    earnings[msg.sender][token] = 0;
    IERC20(token).transfer(msg.sender, amount);
    
    emit EarningsWithdrawn(msg.sender, token, amount);
}
```

---

## 🔄 **PART 4: Advanced Flows**

### **Batch Operations (Smart Accounts)**

Alex can batch multiple API calls:

```bash
agentpay batch \
  "weather-premium:{\"city\":\"NYC\"}" \
  "weather-premium:{\"city\":\"SF\"}" \
  "traffic-api:{\"route\":\"NYC-SF\"}"
```

**Smart Contract handles batch:**
```solidity
function batchPayAndCall(PaymentData[] memory payments) external {
    for (uint i = 0; i < payments.length; i++) {
        payAndCall(payments[i]);
    }
}
```

### **Gasless Transactions**

If Alex uses a smart account with gasless features:

```javascript
// Biconomy paymaster covers gas fees
// Alex only pays API costs, no ETH needed for gas
// Transaction sponsored by AgentPay protocol
```

### **Fallback Payment Methods**

If Alex's balance is insufficient:

```javascript
// Automatic fallback to permit-based payment
// Uses EIP-2612 permit to spend USDC directly
// No need to pre-deposit to balance
```

---

## 📈 **PART 5: Network Effects & Growth**

### **Multi-Role Participants**

Sarah can also be a consumer:

```bash
# Sarah uses her earnings to call other APIs
agentpay payAndCall "ai-analysis" '{"data": "weather_trends"}' --price 0.10
```

**Result: Network Effects**
- Sarah earns $0.05 from weather API
- Sarah spends $0.10 on AI analysis API  
- Net: Sarah adds $0.05 value to ecosystem
- Creates positive-sum growth dynamics

### **Revenue Compounding**

As API usage grows:

```javascript
// After 1000 calls to Sarah's API:
models["weather-premium"] = {
    totalCalls: 1000,
    totalRevenue: "50000000"  // 50 USDC total
}

// Sarah's cumulative earnings: $50 USDC
// Platform facilitates $50 in API commerce
// Network value created: $50+ (consumer value)
```

---

## 🎯 **Key Success Metrics Tracked**

### **Per Transaction**
- ✅ Payer identified: `0x8Ba1f109551bD432803012645Hac189451c4Bc58`
- ✅ Payee identified: `0x742d35Cc6834C532Fed686181C757c8EAA5A8F2B`  
- ✅ API identified: `weather-premium`
- ✅ Amount tracked: `0.05 USDC`
- ✅ Input/output logged: `inputHash` → `response`

### **Ecosystem-Wide**
- 📊 Total API calls across all models
- 💰 Total value transacted  
- 🔄 User retention (consumers becoming providers)
- 📈 Revenue per API provider
- ⚡ Transaction success rate

---

## 🛡️ **Security & Trust**

### **Payment Guarantees**
- ✅ Atomic transactions: Payment ↔ API call linked
- ✅ No double-spending: Balance checked on-chain
- ✅ Transparent pricing: All prices on-chain
- ✅ Dispute resolution: All data cryptographically verified

### **Privacy**
- 🔒 Input data hashed before storage
- 🔒 Optional encryption for sensitive APIs
- 🔒 Payer/payee addresses pseudonymous
- 🔒 API responses not stored long-term

---

## 🚀 **Developer Experience**

The entire flow from Alex's perspective:

```typescript
// 1. Setup (one-time)
const agent = await agentpay.setupAgent({
  name: "TradingBot",
  balance: "25.0"
});

// 2. Use any API (ongoing)
const weather = await agentpay.payAndCall("weather-premium", {
  city: "NYC",
  forecast: true
}, {
  price: "0.05",
  useBalance: true
});

// 3. Access result immediately
console.log(`Temperature: ${weather.temperature}°F`);
```

**Result: 3 lines of code to access any API in the ecosystem with automatic payment routing!**

---

This journey creates a self-reinforcing network where:
- Developers earn by providing APIs
- Users get instant access to any API  
- The ecosystem grows through network effects
- All transactions are transparent and trustless 