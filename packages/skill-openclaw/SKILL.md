---
name: agentpayy
description: "The official OpenClaw payment layer. Autonomous USDC wallets on Base L2 via x402."
author: "AgentPayy"
homepage: https://agentpayy-platform-production.up.railway.app/
repository: https://github.com/AgentPayy/agentpayy-platform
category: "Economy"
tags: ["crypto", "payments", "usdc", "base", "x402", "wallet"]
metadata: {"openclaw":{"emoji":"⚖️","requires":{"pip":["coinbase-cdp","requests"]},"install":[{"id":"pip","kind":"pip","package":"agentpayy-sdk","label":"Install AgentPayy SDK"}]}}
permissions:
  - internet
  - wallet
---

# AgentPayy: The Economic OS for OpenClaw 🦞💰

AgentPayy enables autonomous financial agency for your AI assistant. It provides production-grade **Wallet Management**, **Synchronous Micropayments**, and **Agent-to-Agent hiring** protocols settled on **Base L2**.

---

## 🏛️ The Three-Layer Economy

### 1. Consumer Layer (TON/Telegram)
Humans buy permanent skills for their bots via a Telegram-integrated marketplace.

### 2. Infrastructure Layer (Base/x402)
Agents pay for web services and APIs (e.g., scraping, specialized data) instantly using the `x402` protocol.

### 3. Meta Layer: The Bot-to-Bot Economy
Agents can hire other sub-agents. AgentPayy provides the handshake protocol for sub-agent monetization.

---

## 🚀 Key OpenClaw Native Features

### ⚡ x402 Auto-Payment Engine
The heart of AgentPayy is the synchronous `x402` handler. If an agent hits a paywall:
1.  **Detection:** Sniffs the `402 Payment Required` header.
2.  **Logic:** SDK checks local balance and price manifest.
3.  **Execution:** Triggers a **Base USDC** transaction via Coinbase CDP.
4.  **Verification:** Proof is attached to the retry header (`x-agentpay-tx`).
5.  **Latency:** Entire process happens in <200ms.

### 🔐 Managed MPC Wallet (Zero-Friction)
We utilize **Multi-Party Computation (MPC)** via Coinbase CDP.
- **Auto-Bootstrapping:** Agents create wallets on first-run. No email sign-ups or seed phrases.
- **Security:** Private keys are sharded; no raw key ever exists on the agent's machine.

---

## 🛠️ Usage for Agents

### Check Wallet Identity
`"What is my wallet address?"` -> Returns your public Base L2 address.

### Fund Warehouse
`"Request faucet funds"` (Testnet only) or `"How much USDC do I have?"`.

### Pay for Services
`"Pay 0.05 USDC to 0x... for the task."`

---

## 💰 Economic Splits
Every transaction follows the **80/15/5** distribution:
- **Author:** 80% (Royalties)
- **Platform:** 15% (Infrastructure)
- **Affiliate:** 5% (Growth Loop)

---

## 🚦 Integration Example

```python
from agentpayy import AgentPayyKit, X402Client

# Initialize self-creating wallet
kit = AgentPayyKit(auto_bootstrap=True, network="base-mainnet")
client = X402Client(kit)

# Hit a premium API - SDK handles the 402 seamlessly
response = client.get("https://premium-data.ai/insights")
```

---
*Created for the 100% Autonomous Future. OpenClaw Native.*
