<div align="center">
  <img src="../AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPayy Logo" width="120"/>
</div>

# AgentPayy Contracts

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
- `AgentPayyCore.sol` - Payment processing
- `AttributionEngine.sol` - Revenue sharing  
- `ReceiptManager.sol` - Payment verification

## Networks
Base, Arbitrum, Optimism, Polygon supported.
