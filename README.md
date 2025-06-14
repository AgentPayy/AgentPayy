<div align="center">
  <img src="./AgentPayy-Logo-agent-native-open-framework-for-ai-and-api-payments.png" alt="AgentPay Logo" width="200"/>
</div>

# AgentPay

Privacy-first API payments with crypto. Sub-cent fees on L2s.

## Install
```bash
npm install @agentpay/sdk
```

## Usage
```typescript
import { AgentPayKit } from '@agentpay/sdk';

const agentPay = new AgentPayKit({
  network: 'base',
  privateKey: process.env.PRIVATE_KEY
});

const result = await agentPay.callAPI(
  'https://api.example.com',
  { data: 'input' },
  'model-id'
);
```

## Links
- [Docs](./docs/getting-started.md)
- [Examples](./examples/)
- [Discord](https://discord.gg/agentpay) 