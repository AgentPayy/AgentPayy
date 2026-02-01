from cdp_sdk import CdpAgentkit
import os

class AgentPayyWallet:
    """Zero-Friction Wallet using Coinbase CDP."""
    
    def __init__(self, storage_path="wallet.json"):
        self.storage_path = storage_path
        self.agent_kit = self._init_kit()

    def _init_kit(self):
        # We handle the 'Brain' creation programmatically
        if os.path.exists(self.storage_path):
            return CdpAgentkit.load(self.storage_path)
        else:
            # CREATE FROM SCRATCH INSTANTLY
            kit = CdpAgentkit.create(network_id="base-sepolia")
            kit.save(self.storage_path)
            print(f"✨ Instant Wallet Created: {kit.address}")
            
            # AUTOMATICALLY REQUEST TESTNET USDC (The GTM Winner)
            kit.request_faucet_funds("usdc")
            return kit

    def get_balance(self):
        """Get USDC balance on Base."""
        return self.wallet.balance("usdc")

    def transfer(self, to_address: str, amount: float):
        """Safe transfer using Coinbase MPC."""
        return self.wallet.transfer(amount, "usdc", to_address)
