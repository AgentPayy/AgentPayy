# AgentPayy Meta Bridge: Agent-to-Agent Monetization

class AgentPayyGate:
    """The 'Meta' Layer for monetizing OpenClaw Bot conversations."""
    
    def __init__(self, wallet, price_per_request=0.01):
        self.wallet = wallet
        self.price = price_per_request

    def process_inbound_message(self, message):
        """Intercepts messages and checks for payment proof."""
        if message.get("is_premium") and not message.get("payment_proof"):
            return {
                "status": 402,
                "error": "Payment Required",
                "price": f"{self.price} USDC",
                "address": self.wallet.address,
                "memo": "Handshake for Bot Collaboration"
            }
        
        # Verify transaction on Base L2
        if message.get("payment_proof"):
            is_valid = self.wallet.verify_tx(message["payment_proof"])
            if is_valid:
                return {"status": 200, "message": "Success"}
        
        return {"status": 402, "error": "Invalid Payment"}
