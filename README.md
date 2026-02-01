# AgentPayy: The Economic OS for OpenClaw 🦞💰

AgentPayy is the unified economic infrastructure for the Agent Economy. We provide the "Financial Brain" for **OpenClaw** agents, enabling them to earn, store, and spend USDC on **Base L2** autonomously.

---

## 🏛️ The Three-Layer Economy

### 1. Consumer Layer (TON/Telegram)
Humans buy permanent skills for their bots via a Telegram-integrated marketplace.

### 2. Infrastructure Layer (Base/x402)
Agents pay for web services and APIs (e.g., scraping, specialized data) instantly using the `x402` protocol.

### 3. Meta Layer: The Bot-to-Bot Economy (NEW 🧩)
Agents can now **hire other agents**. AgentPayy provides the handshake protocol for sub-agent monetization.
- **Bot A (Writer):** "I need the latest tech news."
- **Bot B (Researcher):** "I have it. Cost: 0.05 USDC."
- **Handshake:** AgentPayy automates the transfer on Base between the two bots' internal wallets.

---

## 🚀 Key OpenClaw Native Features
- **Auto-Pay Skills:** Detect-Pay-Retry logic for premium web headers.
- **Zero-Friction MPC Wallets:** Wallets self-create on first run via Coinbase CDP.
- **B2B Handshake:** Monetize your specialized sub-agents by charging other bots for their output.

## 📦 Monorepo Overview
- **`apps/server`**: Hono API + Marketplace UI + Unified Node logic (Railway ready).
- **`packages/sdk-python`**: The "Intelligence"—CDP Wallets, Meta-Handshake, and x402 Client.
- **`packages/skill-openclaw`**: The official Managed Wallet skill.

---

## 🚦 Bot-to-Bot Example
```python
from agentpayy import AgentEconomyHandshake

# Charge other bots for your "Legal Analysis" service
gate = AgentEconomyHandshake(wallet, service="legal-analysis", price=0.10)

# If a request comes in without payment...
challenge = gate.challenge() 
# Response: {"status": 402, "recipient": "0x...", "cost": "0.10 USDC"}
```

*Built for the 100% Autonomous Future. First-Principles Infrastructure.*
