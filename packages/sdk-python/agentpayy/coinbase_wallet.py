import os
from cdp import Cdp, Wallet

class AgentPayyWallet:
    """Zero-Friction Wallet using Coinbase CDP."""
    
    def __init__(self, storage_path="wallet.json"):
        self.storage_path = storage_path
        self.api_key_name = os.getenv("CDP_API_KEY_NAME")
        self.api_key_private_key = os.getenv("CDP_API_KEY_PRIVATE_KEY").replace("\\n", "\n")
        
        # Initialize CDP SDK
        Cdp.configure(self.api_key_name, self.api_key_private_key)
        
        self.wallet = self._init_wallet()

    def _init_wallet(self):
        if os.path.exists(self.storage_path):
            with open(self.storage_path, "r") as f:
                data = f.read()
            return Wallet.import_data(data)
        else:
            # Create a server-side wallet on Base Sepolia
            wallet = Wallet.create(network_id="base-sepolia")
            
            # Persist the wallet data
            with open(self.storage_path, "w") as f:
                f.write(wallet.export_data())
            
            print(f"✨ Instant Wallet Created: {wallet.default_address.address_id}")
            
            # Request faucet funds for testnet
            try:
                faucet_tx = wallet.faucet()
                print(f"🚰 Faucet Requested: {faucet_tx.transaction_hash}")
            except Exception as e:
                print(f"⚠️ Faucet request failed (likely rate limited): {e}")
                
            return wallet

    def get_balance(self, asset_id="usdc"):
        """Get balance for an asset."""
        return self.wallet.balance(asset_id)

    def pay_with_splits(self, recipient_address: str, amount: float, affiliate_address: str = None):
        """
        Executes a standard AgentPayy 80/15/5 revenue split.
        Author: 80% | Platform: 15% | Affiliate: 5% (or 20% to Platform if no affiliate)
        """
        # Replace with your actual platform treasury address
        platform_wallet = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e" 
        
        author_cut = amount * 0.80
        affiliate_cut = amount * 0.05 if affiliate_address else 0
        platform_cut = amount - author_cut - affiliate_cut
        
        results = []
        # Author transfer
        results.append(self.wallet.transfer(author_cut, "usdc", recipient_address).wait())
        # Platform fee
        results.append(self.wallet.transfer(platform_cut, "usdc", platform_wallet).wait())
        
        if affiliate_cut > 0:
            results.append(self.wallet.transfer(affiliate_cut, "usdc", affiliate_address).wait())
            
        return results
