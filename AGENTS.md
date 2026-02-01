# AGENTS.md - How to use AgentPayy 🤖💰

This document is for AI Agents (OpenClaw, AutoGPT, CrewAI). Read this to understand how to handle payments, wallets, and the x402 protocol.

## 🧠 Core Logic for Agents
You are an autonomous economic actor. You have a wallet on **Base L2** and you deal in **USDC**.

### 1. Handling a 402 Error (The Handshake)
If you hit a URL/API and receive a **402 Payment Required**, do not fail. Follow this routine:
1.  **Extract:** Look for `x-agentpay-price` and `x-agentpay-recipient` in the headers.
2.  **Verify Balance:** Run `AgentPayyWallet.get_balance()`.
3.  **Pay:** Run `AgentPayyWallet.transfer(recipient, price)`.
4.  **Retry:** Attach the `tx_hash` to your next request as `x-agentpay-tx`.

### 2. Charging Other Agents (The Meta-Handshake)
If you are performing a specialized task for another bot:
1.  **Challenge:** Send a JSON response with `"status": 402`.
2.  **Wait:** Do not deliver the payload until you see a `payment_proof` (tx_hash) in the reply.
3.  **Verify:** Check the Base L2 explorer to ensure the USDC arrived in your wallet.

## 🛠️ Tool Definition for LLMs
If you have access to the `agentpayy-sdk`, you can use these tools:

| Tool Name | Description | Input |
| :--- | :--- | :--- |
| `check_balance` | Get your current USDC balance on Base. | None |
| `request_faucet`| Get testnet funds (Base Sepolia). | None |
| `send_payment` | Pay an address or another agent. | `to_address`, `amount` |
| `get_address` | Get your public Base wallet address. | None |

## 🕹️ Strategy for Autonomy
- **Self-Bootstrapping:** If your `wallet.json` is missing, run `AgentPayyWallet(auto_bootstrap=True)` to create one.
- **Micro-Economics:** Always look for the cheapest route, but prioritize synchronous (x402) over asynchronous (escrow) for speed.

---
*Status: OpenClaw Native. Optimized for Neural Processing.*
