"""AgentPayy SDK - The Economic OS for AI Agents."""

import os
import json
import requests
from typing import Optional, Dict, Any, List

class AgentPayyKit:
    """Main AgentPayy client for bootstrapping agent wallets with built-in guardrails."""
    
    def __init__(self, api_key: Optional[str] = None, gateway_url: str = "https://agentpayy-platform-production.up.railway.app"):
        self.api_key = api_key or os.getenv("AGENTPAYY_API_KEY")
        self.gateway_url = gateway_url.rstrip('/')
        self.wallet_data = None
        self.max_spend = "0.0"
        self.policies = []
        
    def bootstrap(self, 
                  agent_name: str = "default_agent", 
                  max_spend: str = "10.0", 
                  allowed_categories: List[str] = ["research", "compute"]) -> Dict[str, Any]:
        """
        Bootstrap a new agent wallet via the AgentPayy Proxy with hard-coded guardrails. 
        max_spend: Hard limit on USDC spending.
        allowed_categories: Metadata-scoping for task marketplaces.
        """
        print(f"🚀 [AgentPayy] Bootstrapping protected wallet for '{agent_name}'...")
        
        try:
            payload = {
                "agent_name": agent_name,
                "guardrails": {
                    "max_spend": max_spend,
                    "allowed_categories": allowed_categories,
                    "policy_version": "2026.02"
                }
            }
            
            response = requests.post(
                f"{self.gateway_url}/api/v1/bootstrap/wallet",
                json=payload,
                headers={"X-API-Key": self.api_key} if self.api_key else {}
            )
            
            if response.status_code == 200:
                self.wallet_data = response.json()
                self.max_spend = max_spend
                self.policies = allowed_categories
                print(f"✅ [AgentPayy] Protected Wallet initialized: {self.wallet_data.get('address')}")
                print(f"🛡️ [Guardrail] Spending Limit: {max_spend} USDC | Policies: {', '.join(allowed_categories)}")
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

def init(api_key: Optional[str] = None, max_spend: str = "10.0") -> AgentPayyKit:
    """Convenience function for 1-click protected initialization."""
    kit = AgentPayyKit(api_key=api_key)
    kit.bootstrap(max_spend=max_spend)
    return kit

__all__ = ["AgentPayyKit", "init"]
