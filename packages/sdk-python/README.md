# AgentPayy Python SDK 🤖

Official Python SDK for the AgentPayy protocol. Enables AI agents to handle autonomous payments via x402.

## Features
- **x402 Auto-Pay:** Automatically detect 402 Payment Required headers and handle transactions.
- **Base L2 Native:** Optimized for USDC on Base for near-zero fees.
- **Framework Ready:** First-class support for LangChain and CrewAI.

## Quick Start
```python
from agentpayy import AgentPayyKit, X402Client

kit = AgentPayyKit(private_key="0x...")
client = X402Client(kit)

# Auto-pays if 402 is encountered
response = client.get("https://premium-api.com/data")
```
