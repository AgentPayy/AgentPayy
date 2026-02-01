import requests
import time
from . import AgentPayyKit, PaymentOptions

class X402Client:
    """
    HTTP Client with automatic x402 payment handling.
    Ported from the AgentPayy Browser Extension logic.
    """
    
    def __init__(self, agentpayy_kit: AgentPayyKit):
        self.kit = agentpayy_kit

    def request(self, method, url, max_retries=1, **kwargs):
        """Perform request and handle 402 if encountered."""
        response = requests.request(method, url, **kwargs)
        
        if response.status_code == 402 and max_retries > 0:
            print(f"💰 [x402] Payment Required for {url}")
            
            # Extract payment details from headers
            price = response.headers.get('x-agentpay-price')
            recipient = response.headers.get('x-agentpay-recipient')
            model_id = response.headers.get('x-agentpay-model-id', 'unknown')
            
            if not price or not recipient:
                print("❌ [x402] Missing payment headers. Cannot auto-pay.")
                return response

            print(f"💸 [x402] Auto-paying {price} USDC to {recipient}...")
            
            try:
                # Execute payment via Base L2
                tx = self.kit.pay(
                    model_id,
                    {"url": url, "method": method},
                    PaymentOptions(price=price, chain="base")
                )
                
                # Attach payment proof to headers and retry
                kwargs.setdefault('headers', {})
                kwargs['headers']['x-agentpay-tx'] = tx.get('tx_hash')
                
                print(f"✅ [x402] Payment sent! Retrying request...")
                return self.request(method, url, max_retries - 1, **kwargs)
                
            except Exception as e:
                print(f"❌ [x402] Auto-payment failed: {str(e)}")
                return response
                
        return response

    def get(self, url, **kwargs):
        return self.request('GET', url, **kwargs)

    def post(self, url, **kwargs):
        return self.request('POST', url, **kwargs)
