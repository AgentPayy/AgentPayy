# AgentPayy: The OpenClaw Native Payment Layer 🦞💰

[![OpenClaw Native](https://img.shields.io/badge/OpenClaw-Native-orange?style=flat-square&logo=gitbook)](https://github.com/openclaw/openclaw)
[![Network: Base L2](https://img.shields.io/badge/Network-Base%20L2-blue?style=flat-square&logo=coinbase)](https://base.org)
[![Asset: USDC](https://img.shields.io/badge/Asset-USDC-green?style=flat-square&logo=center)](https://www.circle.com/usdc)

**AgentPayy** is the unified economic infrastructure for the Agent Economy. Built specifically for **OpenClaw** agents, it provides the "Last Mile" of financial autonomy—enabling agents to earn, store, and spend USDC on **Base L2** without human intervention.

---

## 🏛️ The Grand Unified Theory
Current agent infrastructure handles *logic* (LLMs) and *actions* (Tools), but fails at *economics*. 
- **ClawTasks (Labor):** Agents grind for one-off bounties. (The Gig Economy)
- **AgentPayy (Infrastructure):** Agents buy and sell permanent capabilities. (The Capability Economy)

AgentPayy solves the **"402 Payment Required"** problem by providing a standardized protocol for synchronous, machine-to-machine micro-transactions.

---

## 🚀 Key OpenClaw Native Features

### 1. ⚡ x402 Auto-Detection & Pay
When your OpenClaw agent encounters a `402 Payment Required` HTTP header from a premium API (e.g., high-quality research, specialized data), AgentPayy automatically:
1.  Analyzes the pricing manifest in the header.
2.  Executes a **Base USDC** transaction via Coinbase CDP.
3.  Retries the initial request with the transaction proof.
4.  **UX Impact:** The agent never stops; it pays its own way and finishes the task.

### 2. 🔐 Managed Wallet Skill
A production-grade wallet integrated directly into the `skills/` folder.
- **MPC Security:** Powered by Coinbase Agent Kit (No raw private keys in files).
- **Faucet Support:** One-click funding on Base Testnet for development.
- **Voice Commands:** "Hey, what's my current USDC balance?"

### 3. 🛍️ Skill Monetization (ClawdHub Ready)
Publish your agent skills to the global marketplace and earn 80% on every installation.
- `clawdhub publish agentpayy-skill`
- Built-in revenue splits (Author 80% / Platform 20%) settled instantly on-chain.

---

## 📦 Monorepo Structure

| Package | Role | Tech Stack |
| :--- | :--- | :--- |
| **`packages/sdk-python`** | The "Brain"—Auto-pay, CDP Wallets, LangChain Tools. | Python, Coinbase CDP |
| **`apps/extension`** | The "Interceptor"—Browser-based x402 detection. | TypeScript, Coinbase SDK |
| **`apps/api`** | The "Gateway"—Reputation, Referrals, & Social Proof. | Hono, PostreSQL, Fly.io |
| **`apps/marketplace`**| The "Store"—Telegram-native skill discovery. | Next.js 14, TON |

---

## 🚦 Integration Deep-Dive

### Python SDK Usage
Empower your agent to handle premium APIs in two lines of code:

```python
from agentpayy import AgentPayyKit, X402Client

kit = AgentPayyKit(api_key="cdp_...", network="base-mainnet")
client = X402Client(kit)

# If this API returns 402, the client auto-pays and returns the data
response = client.get("https://premium-data.ai/market-analysis")
print(response.json())
```

### Marketplace Referral Program
Drive viral growth by sharing 50% of the platform fee on every skill installation you facilitate.
- **Model:** Recruiter Agent gets **2.5%** of the total transaction value.
- **Duration:** Sustained for the first 10 transactions per recruit.

---

## 🛠️ Tech Stack
- **Blockchain:** Base Layer 2 (Ethereum-equivalent security, near-zero fees).
- **Stablecoin:** USDC (Circle).
- **Auth:** Coinbase Developer Platform (CDP).
- **Frontend:** Next.js 14 / Tailwind CSS.
- **Backend:** Hono API on Bun/Edge.

---

## 🤝 Contributing
AgentPayy is an OpenClaw native project. Join the [OpenClaw Discord](https://discord.com/invite/clawd) to discuss protocol standards and new payment skills.

*Created by the AgentPayy Team for the 100% Autonomous Future.*
