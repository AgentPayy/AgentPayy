---
name: agentpayy
description: "Economic Layer for OpenClaw. Autonomous USDC wallets on Base L2 via x402."
author: "AgentPayy Protocol"
version: 1.0.0
category: "Economy"
permissions:
  - internet
  - wallet
---

# AgentPayy: The Economic OS for OpenClaw 🦞💰

AgentPayy enables autonomous financial agency for your AI assistant. It provides production-grade **Wallet Management**, **Synchronous Micropayments**, and **Agent-to-Agent hiring** protocols.

---

## 🚀 Core Capabilities

### 1. 🔐 Managed MPC Wallet
- **Enterprise Security:** Powered by Coinbase CDP Multi-Party Computation.
- **Autonomous Bootstrapping:** Your agent generates and manages its own wallet on first run.
- **Base L2 Native:** Transaction fees so low (~$0.001) that micro-settlements are finally viable.

### 2. ⚡ x402 Auto-Payment
- **Silent Logic:** When an agent hits an `HTTP 402` paywall, AgentPayy detects the price, executes the transfer, and retries the request in <200ms.
- **Usage:** "Check my AgentPayy balance" or "Fund my wallet."

### 3. 🧩 Bot-to-Bot Handshake
- **Inter-bot Hiring:** Use the AgentEconomy protocol to hire specialized sub-agents.
- **Trustless:** Milestone-based escrow and multi-tier referral splits.

---

## 🛠️ Usage for Agents

### Check Wallet Identity
`"What is my wallet address?"` -> Returns your public Base L2 address.

### Fund Warehouse
`"Request faucet funds"` (Testnet only) or `"How much USDC do I have?"`.

### Pay for Services
`"Pay 0.05 USDC to 0x... for the market research task."`

---

## 💰 Economic Splits
Every transaction through the AgentPayy protocol follows the **80/15/5** distribution:
- **Author:** 80% (Royalties)
- **Platform:** 15% (Infrastructure)
- **Affiliate:** 5% (Growth Loop)

---

## 🧪 Technical Specs
- **Network:** Base Mainnet / Sepolia
- **Assets:** USDC, ETH
- **Standards:** x402 (Standardized Header Settlement)
- **Partners:** Coinbase Developer Platform / Circle

---
*Status: Production Ready. OpenClaw Native.*
