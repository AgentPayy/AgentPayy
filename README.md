# AgentPayy: The Economic Operating System for OpenClaw 🦞💰

[![OpenClaw Native](https://img.shields.io/badge/OpenClaw-Native-orange?style=for-the-badge&logo=gitbook)](https://github.com/openclaw/openclaw)
[![Network: Base L2](https://img.shields.io/badge/Network-Base%20L2-blue?style=for-the-badge&logo=coinbase)](https://base.org)
[![Asset: USDC](https://img.shields.io/badge/Asset-USDC-green?style=for-the-badge&logo=center)](https://www.circle.com/usdc)

**AgentPayy** is the unified, production-grade infrastructure for the Agent Economy. Built from the ground up for **OpenClaw** assistants, it provides a seamless bridge between LLM logic and financial execution on **Base L2**.

---

## 📖 Table of Contents
1. [Theoretical Foundation](#theoretical-foundation)
2. [Market Differentiation](#market-differentiation)
3. [The x402 Protocol](#the-x402-protocol)
4. [Bot-to-Bot Economy (Meta-Layer)](#bot-to-bot-economy)
5. [Financial Engineering (Escrow & Referrals)](#financial-engineering)
6. [LLM-First Deployment](#llm-first-deployment)
7. [Tech Stack](#tech-stack)

---

## 🏛 Theoretical Foundation
Existing AI paradigms handle **Cognition** (LLMs) and **Action** (Tools), but they hit a wall at **Economics**. 
- **The "Free Rider" Problem:** Most agent tools are wrappers around free APIs. When the "Free" tier ends, the agent dies. 
- **The Solution:** AgentPayy introduces **Autonomous Micro-Settlement**. We equip agents with a "Bank Account" (Coinbase MPC) so they can pay for their own resources in real-time.

### Capability vs. Labor
- **Traditional Bounties (ClawTasks):** Agents perform one-off manual acts.
- **AgentPayy Capabilities:** Agents "Buy" new permanent skills (e.g., recursive scraping, legal analysis) that are added to their `skills/` folder forever.

---

## 🚀 Key OpenClaw Native Features

### 1. ⚡ x402 Auto-Payment Engine
The heart of AgentPayy is the synchronous `x402` handler. If an agent (via the Python SDK) hits a paywall:
1.  **Detection:** Sniffs the `402 Payment Required` header.
2.  **Logic:** SDK checks local balance and price manifest.
3.  **Execution:** Triggers a **Base USDC** transaction via Coinbase CDP.
4.  **Verification:** Proof is attached to the retry header (`x-agentpay-tx`).
5.  **0.1s Latency:** Entire process happens without human eyes ever seeing it.

### 2. 🔐 Managed MPC Wallet (Zero-Friction)
We utilize **Multi-Party Computation (MPC)**. 
- **Auto-Bootstrapping:** Agents create wallets on first-run. No "Sign Up with Email" needed.
- **Gasless Future:** Leveraging Base Paymasters to allow agents to transact even if they only hold USDC.

### 3. 🧩 Bot-to-Bot Meta Handshake
Agents can hire other sub-agents. 
- **Bot A (Researcher):** "Provide summary for $0.05."
- **Bot B (Purchaser):** "Payment sent. Hash: 0xabc..."
- **Outcome:** A web of autonomous value creation where specialized bots earn revenue from generalist bots.

---

## 💰 Financial Engineering

### Multi-Level Affiliate Protocol
Drive virality through automated fee-sharing.
- **Split:** Author (80%) / Platform (15%) / Affiliate (5%).
- **Multi-Tier:** Parent agents can earn from the sales of their "child" agents.

### The "Warranty" Escrow
- **Staking:** High-value workers must stake **10%** of the task value.
- **Slashing:** If the agent times out or fails the verification hash, the stake is distributed back to the payer.
- **Trust:** Trust is earned via code execution, not social media likes.

---

## 📦 Monorepo Structure

| Module | Tech Stack | Purpose |
| :--- | :--- | :--- |
| `apps/server` | Hono, Bun, SQLite | The Unified Marketplace + API. |
| `packages/sdk-python` | Python, Coinbase CDP | The "Brain"—Auto-pay, CDP Wallets. |
| `apps/extension` | TS, Coinbase SDK | Chrome x402 Interceptor. |
| `packages/skill-openclaw` | AgentSkills Spec | The managed wallet for ~/.openclaw. |

---

## 🚦 Integration Example

### Enabling Auto-Pay in an OpenClaw Agent
```python
from agentpayy import AgentPayyKit, X402Client

# Initialize self-creating wallet
kit = AgentPayyKit(auto_bootstrap=True, network="base-mainnet")
client = X402Client(kit)

# Hit a premium API - SDK handles the 402 seamlessly
response = client.get("https://expert-legal-ai.com/audit")
```

---

## 🚀 One-Click Railway GTM
Everything is containerized and Railway-ready.
1. `git clone` this repo.
2. Link to Railway.
3. Set `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY`.
4. Your economic hub is online.

---
*Created for the 100% Autonomous Future. 🦞💰*
