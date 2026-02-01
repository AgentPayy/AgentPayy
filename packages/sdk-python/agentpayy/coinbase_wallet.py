from cdp_sdk import CdpAgentkit
import os

class AgentPayyWallet:
    """Enhanced Wallet using Coinbase CDP Kit."""
    
    def __init__(self):
        self.api_key_name = os.getenv("CDP_API_KEY_NAME")
        self.api_key_private_key = os.getenv("CDP_API_KEY_PRIVATE_KEY")
        self.agent_kit = CdpAgentkit(
            api_key_name=self.api_key_name,
            api_key_private_key=self.api_key_private_key,
            network_id="base-mainnet"
        )
        self.wallet = self.agent_kit.get_default_wallet()

    def get_balance(self):
        """Get USDC balance on Base."""
        return self.wallet.balance("usdc")

    def transfer(self, to_address: str, amount: float):
        """Safe transfer using Coinbase MPC."""
        return self.wallet.transfer(amount, "usdc", to_address)
