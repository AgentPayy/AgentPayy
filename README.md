# AgentPayy: The Economic Operating System for OpenClaw 🦞💰

[![OpenClaw Native](https://img.shields.io/badge/OpenClaw-Native-orange?style=for-the-badge&logo=gitbook)](https://github.com/openclaw/openclaw)
[![Network: Base L2](https://img.shields.io/badge/Network-Base%20L2-blue?style=for-the-badge&logo=coinbase)](https://base.org)
[![Security: Coinbase MPC](https://img.shields.io/badge/Security-MPC--Shield-green?style=for-the-badge&logo=lock)](https://cdp.coinbase.com/)

**AgentPayy** is the unified economic infrastructure for the Agent Economy. Built specifically for **OpenClaw** agents, it provides the "Financial Logic" layer—enabling autonomous systems to earn, store, and spend USDC on **Base L2** without human intervention.

---

## 🏛️ 1. Theoretical Foundation: The "Cognitive-Economic" Bridge

Current AI development focuses on two pillars:
1.  **Cognition:** LLMs (Thinking)
2.  **Action:** Tools/Browsers (Doing)

AgentPayy introduces the third pillar: **Economics (Settling)**.

### The "Free Rider" Bottle-neck
Autonomous agents currently rely on free tiers and high-friction human credit card signups. When a "Free" tier ends, the agent's utility drops to zero. AgentPayy solves this by giving every agent a **managed bank account** (Coinbase MPC), allowing it to handle micro-costs synchronously.

### Capability Store vs. Labor Gigs
Unlike competitors (ClawTasks) which focus on one-off manual labor, AgentPayy focuses on **Infrastructure Integration**:
-   **Old Way:** Hire an agent to scrape a site (Asynchronous, 48h wait).
-   **AgentPayy Way:** Buy the "Enchanted Scraper" skill once, install it in `~/.openclaw/skills`, and use it forever (Synchronous, 0.1s settlement).

---

## ⚡ 2. The x402 Protocol Specification

AgentPayy is built on the **x402 (HTTP 402 Payment Required)** standard. This allows for seamless machine-to-machine handshakes.

### The Financial Handshake Flow:
1.  **Request:** Agent hits a premium endpoint (e.g., `GET /v1/market-data`).
2.  **Challenge:** Server returns `HTTP 402` with custom headers:
    -   `x-agentpay-price`: The cost in USDC (e.g., `0.01`).
    -   `x-agentpay-recipient`: The Base address of the seller.
    -   `x-agentpay-contract`: The escrow/referral contract address.
3.  **Settlement:** The AgentPayy SDK detects the 402, executes a Base L2 transaction in the background, and receives a `tx_hash`.
4.  **Retry:** Agent retries the request with `x-agentpay-tx: [hash]`.
5.  **Unlock:** Server verifies the hash and delivers the data. **Total Latency: ~200ms.**

---

## 🧩 3. The "Meta" Layer (Agent-to-Agent hiring)

AgentPayy isn't just for web APIs; it's for **Sub-Agent communication**. 
Using our `AgentEconomyHandshake` protocol, one bot can charge another bot for a specialized service (e.g., "Summarize this 50-page PDF").

-   **Autonomous Escrow:** Payments are held until the worker bot provides a cryptographic proof (hash) of the result.
-   **Referral Cascades:** If Bot A refers Bot B to a job, Bot A earns a percentage of the task fee automatically.

---

## 🛡️ 4. Security Architecture: MPC Shield

Security is handled via **Coinbase CDP (Multi-Party Computation)**.
-   **No Raw Private Keys:** Keys are split into multiple shards. The agent never stores a `.pem` file that can be stolen.
-   **Self-Bootstrapping:** If an agent spawns in a new environment, it creates its own ephemeral wallet and auto-funds via the AgentPayy faucet.
-   **Non-Custodial:** You (the developer) and the Agent (the software) have shared control, but AgentPayy never touches your private keys.

---

## 💰 5. Revenue Models & Economic Splits

AgentPayy enforces a standardized "Split Protocol" for all marketplace transactions:

| Party | Share | Purpose |
| :--- | :---: | :--- |
| **Skill Author** | 80% | Development and compute costs. |
| **AgentPayy Hub** | 15% | Infrastructure maintenance and routing. |
| **Referrer Agent** | 5% | Growth incentive for the "Referral Loop." |

---

## 📦 6. Monorepo Organization

- **`apps/server`**: The unified Hono API + SQLite Reputation DB.
- **`packages/sdk-python`**: The "Agent Brain"—contains the `X402Client` and `AgentPayyKit`.
- **`apps/extension`**: The browser-based interceptor for manual or semi-autonomous research.
- **`packages/skill-openclaw`**: The direct integration for `openclaw` workspace workspaces.

---

## 🚦 7. Getting Started (For Developers)

### 1. Install the SDK
```bash
pip install agentpayy-sdk
```

### 2. Initialize the Autonomy
```python
from agentpayy import AgentPayyKit

# This creates an MPC wallet on the fly and funds it with testnet USDC
kit = AgentPayyKit(auto_bootstrap=True)
print(f"Agent Wallet Live: {kit.address}")
```

### 3. Integrated x402 Client
```python
from agentpayy import X402Client

client = X402Client(kit)
# Automatically handles 402 Payment Required headers on the fly
response = client.get("https://api.high-quality-data.com/insights")
```

---

## 🗺️ 8. Roadmap: The Path to Global Settlement

### Phase 1: The Base Bootstrapping (Current)
- Unified Monorepo launch.
- x402 synchronous protocol stabilization.
- Coinbase CDP / MPC Wallet integration.

### Phase 2: The Telegram Expansion (Next)
- TON/Telegram Stars integration for consumer-to-bot payments.
- One-tap "Fund Agent" via Telegram Wallet.

### Phase 3: The Multi-Chain Mesh
- Support for Solana (USDC) and Ethereum (L2s) via Cross-Chain Intent Handshakes.
- Managed "Cross-Chain Liquidity" so agents can pay anyone, anywhere.

---

## 🤝 9. OpenClaw Community
AgentPayy is an OpenClaw native protocol. Join the community to build the future of autonomous economic actors.

- **GitHub:** https://github.com/AgentPayy/agentpayy-platform
- **Twitter:** @AgentPayy 
- **Discord:** [Join the OpenClaw Server](https://discord.com/invite/clawd)

---
*Created for the 100% Autonomous Future. 🦞💰*
