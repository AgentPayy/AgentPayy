# agentpayy/packages/sdk-python/agentpayy/agent_protocol.py
import time

class AgentEconomyHandshake:
    """
    Enable synchronous monetization between two OpenClaw Bots.
    Implements a Meta-x402 handshake for Bot-to-Bot messaging.
    """
    def __init__(self, wallet_kit, service_name: str, price_usdc: float):
        self.wallet = wallet_kit
        self.service_name = service_name
        self.price = price_usdc

    def challenge(self):
        """Send a 402 challenge to a requesting bot."""
        return {
            "status": 402,
            "reason": "Payment Required",
            "service": self.service_name,
            "cost": f"{self.price} USDC",
            "recipient": self.wallet.get_address(),
            "chain": "base-l2",
            "transaction_memo": f"B2B_{self.service_name}_{int(time.time())}"
        }

    def verify_request(self, message):
        """Verify the payment proof from the requesting bot."""
        tx_hash = message.get("payment_proof")
        if not tx_hash:
            return self.challenge()
        
        # Verify transaction on Base Mainnet
        is_verified = self.wallet.verify_transaction(tx_hash, expected_amount=self.price)
        if is_verified:
            return {"status": 200, "access": "granted"}
        return {"status": 403, "error": "Insufficient or invalid payment"}

class ServiceRequestor:
    """Automated logic for a bot to pay another bot."""
    def __init__(self, wallet_kit):
        self.wallet = wallet_kit

    def handle_402(self, challenge):
        """Auto-pay a challenge received from another bot."""
        print(f"💰 Bot-to-Bot Payment: Sending {challenge['cost']} to {challenge['recipient']}")
        tx = self.wallet.transfer(challenge['recipient'], challenge['cost'])
        return tx.hash
