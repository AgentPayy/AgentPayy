"""AgentPayy SDK - The Economic OS for AI Agents."""

import os
import json
import requests
from typing import Optional, Dict, Any

class AgentPayyKit:
    """Main AgentPayy client for bootstrapping agent wallets via the Infrastructure Proxy."""
    
    def __init__(self, api_key: Optional[str] = None, gateway_url: str = "https://agentpayy-platform-production.up.railway.app"):
        self.api_key = api_key or os.getenv("AGENTPAYY_API_KEY")
        self.gateway_url = gateway_url.rstrip('/')
        self.wallet_data = None
        
    def bootstrap(self, agent_name: str = "default_agent") -> Dict[str, Any]:
        """
        Bootstrap a new agent wallet via the AgentPayy Proxy. 
        No Coinbase portal or KYC required for the developer.
        """
        print(f"🚀 [AgentPayy] Bootstrapping wallet for '{agent_name}' via proxy...")
        
        try:
            response = requests.post(
                f"{self.gateway_url}/api/v1/bootstrap/wallet",
                json={"agent_name": agent_name},
                headers={"X-API-Key": self.api_key} if self.api_key else {}
            )
            
            if response.status_code == 200:
                self.wallet_data = response.json()
                print(f"✅ [AgentPayy] Wallet initialized: {self.wallet_data.get('address')}")
                return self.wallet_data
            else:
                raise Exception(f"Bootstrap failed: {response.text}")
                
        except Exception as e:
            print(f"❌ [AgentPayy] Error during bootstrapping: {str(e)}")
            raise

    def get_address(self) -> str:
        if not self.wallet_data:
            raise Exception("Wallet not bootstrapped. Run .bootstrap() first.")
        return self.wallet_data.get("address")

def init(api_key: Optional[str] = None) -> AgentPayyKit:
    """Convenience function for 1-click initialization."""
    kit = AgentPayyKit(api_key=api_key)
    kit.bootstrap()
    return kit

__all__ = ["AgentPayyKit", "init"]
