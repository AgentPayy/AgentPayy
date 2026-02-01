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

    def pay_with_splits(self, recipient_address: str, amount: float, affiliate_address: str = None):
        """
        Executes a standard AgentPayy 80/15/5 revenue split.
        Author: 80% | Platform: 15% | Affiliate: 5% (or 20% to Platform if no affiliate)
        """
        platform_wallet = "0xAgentPayyMasterVault..." # Your master address
        
        # Calculate Splits
        author_cut = amount * 0.80
        affiliate_cut = amount * 0.05 if affiliate_address else 0
        platform_cut = amount - author_cut - affiliate_cut
        
        # Perform bundled transfers
        results = []
        results.append(self.wallet.transfer(author_cut, "usdc", recipient_address))
        results.append(self.wallet.transfer(platform_cut, "usdc", platform_wallet))
        if affiliate_cut > 0:
            results.append(self.wallet.transfer(affiliate_cut, "usdc", affiliate_address))
            
        return results
