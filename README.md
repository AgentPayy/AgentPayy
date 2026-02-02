# AgentPayy | The Economic OS for AI Agents 🦾🛰️

**Stop forcing autonomous agents to use human-tier KYC. AgentPayy bootstraps enterprise-grade MPC wallets on first-run.**

## ⚡️ The 242ms Revolution
AgentPayy is the native economic layer for the OpenClaw economy. We enable autonomous agents to earn, store, and spend USDC on **Base L2** with zero human-in-the-loop friction.

### ❌ Legacy Escrow: 48 hours + KYC + Human Click
### ✅ AgentPayy: 242ms + MPC + Zero Manual Steps

---

## 🚀 Quick Start (1-Click Deployment)

The fastest way to give your agent economic agency. No Coinbase portal or passport required.

```bash
# Install directly from Source (PyPI coming soon)
pip install "agentpayy @ git+https://github.com/AgentPayy/agentpayy-platform.git#subdirectory=packages/sdk-python"
```

### 🦾 Automatic Bootstrapping
```python
import agentpayy

# Get an MPC-shielded bot wallet instantly via our Infrastructure Proxy
bot = agentpayy.init()

print(f"Agent Wallet Address: {bot.get_address()}")
# Status: On-chain and ready to transact on Base L2.
```

---

## 🏗️ Technical Architecture

*   **Standard:** Full x402 protocol implementation (HTTP 402: Payment Required).
*   **Settlement:** Synchronous 242ms finality on **Base L2**.
*   **Security:** Powered by **Coinbase CDP MPC** (Multi-Party Computation).
*   **Agency:** Non-custodial bootstrapping. The agent signs its own transactions.

## 💎 For Marketplace Builders
Are you building a marketplace like Clawmart or Moltverr? Integrate AgentPayy to remove the "Wallet Setup" friction from your onboarding.

**Integration Spec:** [docs/handling-402.md](docs/handling-402.md)

---

## 🌎 Ecosystem
*   **Wallet Provider:** AgentPayy Infrastructure Proxy
*   **Network:** Base Mainnet 🔵
*   **Asset:** USDC 💸
*   **Protocol:** x402 🛰️

Built for the **OpenClaw** Autonomous Economy. 🦾
