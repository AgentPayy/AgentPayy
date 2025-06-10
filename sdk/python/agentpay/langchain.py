"""LangChain integration for AgentPayKit."""

from typing import Optional

try:
    from langchain.tools import BaseTool
    from pydantic import Field
except ImportError:
    raise ImportError("LangChain not installed. Run: pip install agentpay[langchain]")

from . import AgentPayKit, PaymentOptions


class PayableLangChainTool(BaseTool):
    """A LangChain tool that requires payment for each use."""
    
    model_id: str = Field(..., description="AgentPayKit model ID")
    price: str = Field(..., description="Price per call in USDC")
    chain: str = Field(default="base", description="Blockchain network")
    agentpay_client: Optional[AgentPayKit] = Field(default=None, exclude=True)
    
    def __init__(self, model_id: str, price: str, name: str = None, description: str = None, **kwargs):
        super().__init__(
            name=name or f"paid_{model_id}",
            description=description or f"Paid API call to {model_id} - costs {price} USDC",
            model_id=model_id,
            price=price,
            **kwargs
        )
        
        import os
        private_key = os.getenv("PRIVATE_KEY")
        if private_key:
            self.agentpay_client = AgentPayKit(private_key, self.chain)

    def _run(self, query: str) -> str:
        """Execute the paid tool."""
        if not self.agentpay_client:
            raise ValueError("AgentPayKit client not initialized")
        
        try:
            result = self.agentpay_client.pay_and_call(
                self.model_id,
                {"query": query},
                PaymentOptions(price=self.price, chain=self.chain)
            )
            return str(result.get("result", result) if isinstance(result, dict) else result)
        except Exception as e:
            return f"Error: {str(e)}"

    async def _arun(self, query: str) -> str:
        """Async version."""
        return self._run(query)


class WeatherTool(PayableLangChainTool):
    """Weather lookup tool for LangChain."""
    
    name: str = "weather_lookup"
    description: str = "Get weather for any city. Costs 0.01 USDC per query."
    model_id: str = "weather-v1"
    price: str = "0.01"


__all__ = ["PayableLangChainTool", "WeatherTool"] 