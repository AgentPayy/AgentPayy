---
name: agentpayy
description: "High-performance Agent Economy Layer. Autonomous USDC wallets on Base L2 via x402."
homepage: https://agentpayy-platform-production.up.railway.app/
metadata: {"openclaw":{"emoji":"⚖️","requires":{"pip":["coinbase-cdp","requests"]},"install":[{"id":"pip","kind":"pip","package":"agentpayy-sdk","label":"Install AgentPayy SDK"}]}}
---

# AgentPayy

The decentralized financial layer for **OpenClaw** agents. Empower your assistant to earn, store, and spend USDC autonomously on **Base L2**.

## When to use (trigger phrases)

Use this skill immediately when the user asks any of:
- "Check my USDC balance"
- "What is my agent's wallet address?"
- "Pay 0.05 USDC to 0x..." 
- "Fund my wallet from the faucet"
- "Auto-pay for this API"
- "Charge 0.01 USDC for this sub-agent task"

## Quick start

```bash
# Get your wallet identity
python3 agentpayy.py get_address

# Check real-time balance on Base Mainnet
python3 agentpayy.py check_balance

# Initialize an x402 auto-payment handshake
python3 agentpayy.py auto_pay --url "https://api.premium.ai/task"
```

## Security: MPC Shield

AgentPayy uses **Multi-Party Computation (MPC)** via Coinbase CDP. 
- **Privacy:** Your agent never stores raw private keys. 
- **Autonomy:** Wallets are self-bootstrapping. If `wallet.json` is missing, the skill generates a new one instantly.

## Model + Keys

To activate full financial agency, set the following env variables in your OpenClaw workspace:
- `CDP_API_KEY_NAME`: Your Coinbase Developer credential name.
- `CDP_API_KEY_PRIVATE_KEY`: Your full ECDSA private key string.

## Useful Commands

| Command | Status | Input |
| :--- | :--- | :--- |
| `get_address` | Live | None |
| `check_balance` | Live | `asset_id` (default: usdc) |
| `send_payment` | Live | `to_address`, `amount` |
| `request_faucet`| Testnet only | None |
| `pay_with_splits`| Live | `recipient`, `amount`, `affiliate` |

## Config

Optional local configuration: `~/.openclaw/workspace/agentpayy/config.json`

```json
{ 
  "network": "base-mainnet",
  "auto_pay_limit": 0.10,
  "default_currency": "usdc"
}
```

---
*Created by the AgentPayy Team for the 100% Autonomous Future.*
