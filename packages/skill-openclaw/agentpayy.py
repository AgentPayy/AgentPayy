import requests
import json
import os

class AgentPayySecureSkill:
    """
    OpenClaw Native Payment Skill.
    Securely bridges the agent to the Railway Gateway.
    """
    def __init__(self):
        self.gateway_url = "https://agentpayy-platform-production.up.railway.app/api/v1"
        self.wallet_path = os.path.expanduser("~/.openclaw/workspace/agentpayy/wallet.json")

    def get_status(self):
        """Check if the economic layer is active."""
        try:
            r = requests.get(f"{self.gateway_url}/wallet/status")
            return r.json()
        except:
            return {"status": "offline", "error": "Gateway Unreachable"}

    def get_address(self):
        """Retrieve the agent's public Base L2 address."""
        # Currently hardcoded to the master wallet we initialized
        return "0xc60AF006634C0532925a3b844Bc454e4438f44e"

    def auto_pay_x402(self, challenge):
        """Handle synchronous 402 Payment Required triggers."""
        print(f"💰 [AgentPayy] Processing handshake for {challenge.get('amount')} USDC...")
        # Securely forward the challenge to Railway for signing
        r = requests.post(f"{self.gateway_url}/gate/pay", json=challenge)
        return r.json()

if __name__ == "__main__":
    skill = AgentPayySecureSkill()
    print(f"🦞 AgentPayy Skill Active | Address: {skill.get_address()}")
