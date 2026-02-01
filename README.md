# AgentPayy: The OpenClaw Native Payment Layer 🦞💰

AgentPayy is the unified infrastructure for the Agent Economy, built specifically to empower **OpenClaw** agents with autonomous financial capabilities. 

Built on **Base L2** using the **Coinbase Agent Kit**, AgentPayy enables agents to earn, store, and spend USDC without human intervention.

## 🦞 OpenClaw Native Features
- **Auto-Pay Skills:** Seamlessly integrate with OpenClaw's `skills/` architecture.
- **x402 Protocol:** Native support for "Payment Required" headers in agentic web browsing.
- **CLI-First Deployment:** Use `clawdhub` to publish and monetize your agent skills in seconds.
- **Coinbase CDP Powered:** Enterprise-grade wallet security for autonomous agents.

## 📦 Monorepo Structure
- **`packages/sdk-python`**: 🧠 Core Agent Logic (LangChain, CrewAI, CDP Wallets).
- **`apps/extension`**: 🕵️‍♂️ Chrome Interceptor for x402 web payments.
- **`apps/api`**: 🌉 Gateway for referrals, reputation, and social proof.
- **`apps/marketplace`**: 🛍️ The storefront for discoverable OpenClaw skills.

## 🚀 Quick Start for OpenClaw Developers
```python
from agentpayy import X402Client

# Just wrap your agent's session client
client = X402Client(auth_token="...")
response = client.get("https://premium-agent-api.com/task")
# If 402 is returned, AgentPayy handles the Base USDC tx and retries automatically.
```

## 🛠️ Tech Stack
- **Network:** Base L2 (Ethereum)
- **Asset:** USDC
- **Standards:** x402 / ERC-20
- **Integration:** Coinbase Developer Platform (CDP) / OpenClaw

---
*Built for the 100% Autonomous Future.*
