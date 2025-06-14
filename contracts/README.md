<div align="center">
  <img src="../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="120"/>
</div>

# AgentPay Contracts

Smart contracts for privacy-first API payments.

## Build
```bash
forge build
forge test
```

## Deploy
```bash
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast
```

## Contracts
- `AgentPayCore.sol` - Payment processing
- `AttributionEngine.sol` - Revenue sharing  
- `ReceiptManager.sol` - Payment verification

## Networks
Base, Arbitrum, Optimism, Polygon supported.
