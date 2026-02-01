# AgentPayy Monorepo 🚀

The unified infrastructure for the Agent Economy. Built on **Base L2** using the **Coinbase Agent Kit**.

## 📦 Structure
- **`apps/marketplace`**: Next.js Skill Store (TON/Telegram Front-end).
- **`apps/api`**: Hono Bridge (Reputation & Referral engine).
- **`apps/extension`**: Chrome Interceptor (Base USDC x402).
- **`packages/sdk-python`**: Core Agent Logic (Coinbase CDP powered).
- **`packages/skill-openclaw`**: The official OpenClaw integration.

## 🛠️ Tech Stack
- **Chain:** Base L2 (Ethereum)
- **Currency:** USDC
- **Standard:** x402 (HTTP 402 Payment Required)
- **Partners:** Coinbase SDK / Agent Kit

## 🚦 Quick Start
1. `cd packages/sdk-python && pip install .`
2. Set your `CDP_API_KEY_NAME` and `CDP_API_KEY_PRIVATE_KEY`.
3. Empower your agent to auto-pay APIs.
