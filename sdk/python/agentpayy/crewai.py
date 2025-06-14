"""CrewAI integration for AgentPayyKit - Monetize your CrewAI tools."""

from typing import Any, Dict, Optional, Type

try:
    from crewai_tools import BaseTool
    from pydantic import BaseModel, Field
except ImportError:
    raise ImportError("CrewAI not installed. Run: pip install agentpayy[crewai]")

from .import AgentPayyKit, PaymentOptions


class PayableTool(BaseTool):
    """A CrewAI tool that requires payment for each use."""
    
    name: str = Field(..., description="Tool name")
    description: str = Field(..., description="Tool description")  
    model_id: str = Field(..., description="AgentPayyKit model ID")
    price: str = Field(..., description="Price per call in USDC")
    chain: str = Field(default="base", description="Blockchain network")
    agentpayy_client: Optional[AgentPayyKit] = Field(default=None, exclude=True)
    
    def __init__(self, model_id: str, price: str, name: str = None, description: str = None, **kwargs):
        super().__init__(
            name=name or f"paid-{model_id}",
            description=description or f"Paid API call to {model_id}",
            model_id=model_id,
            price=price,
            **kwargs
        )
        
        # Initialize AgentPayyKit client
        import os
        private_key = os.getenv("PRIVATE_KEY")
        if private_key:
            self.agentpayy_client = AgentPayyKit(private_key, self.chain)

    def _run(self, **kwargs) -> str:
        """Execute the paid tool."""
        if not self.agentpayy_client:
            raise ValueError("AgentPayyKit client not initialized. Set PRIVATE_KEY environment variable.")
        
        try:
            # Make paid API call
            result = self.agentpayy_client.pay_and_call(
                self.model_id,
                kwargs,
                PaymentOptions(price=self.price, chain=self.chain)
            )
            
            # Format result for CrewAI
            if isinstance(result, dict):
                return str(result.get("result", result))
            return str(result)
            
        except Exception as e:
            return f"Error: {str(e)}"


def paid_tool(model_id: str, price: str, name: str = None, description: str = None, chain: str = "base"):
    """Decorator to create a paid CrewAI tool."""
    def decorator(func):
        class CustomPayableTool(PayableTool):
            def _run(self, **kwargs) -> str:
                # Execute payment first
                if not self.agentpayy_client:
                    raise ValueError("AgentPayyKit client not initialized")
                
                # Make payment
                payment_result = self.agentpayy_client.pay_and_call(
                    self.model_id,
                    kwargs,
                    PaymentOptions(price=self.price, chain=self.chain)
                )
                
                # Execute original function with payment result
                return func(payment_result, **kwargs)
        
        return CustomPayableTool(
            model_id=model_id,
            price=price,
            name=name or func.__name__,
            description=description or func.__doc__ or f"Paid tool: {func.__name__}",
            chain=chain
        )
    
    return decorator


# Example usage tools
class WeatherTool(PayableTool):
    """Get weather information for any city - paid per query."""
    
    name: str = "weather_lookup"
    description: str = "Get current weather for any city. Costs 0.01 USDC per query."
    model_id: str = "weather-v1"
    price: str = "0.01"
    
    def _run(self, city: str) -> str:
        """Get weather for a city."""
        return super()._run(city=city)


class TokenPriceTool(PayableTool):
    """Get cryptocurrency prices - paid per query."""
    
    name: str = "token_price"
    description: str = "Get current cryptocurrency prices. Costs 0.005 USDC per query."
    model_id: str = "token-prices-v1"
    price: str = "0.005"
    
    def _run(self, symbol: str) -> str:
        """Get price for a cryptocurrency."""
        return super()._run(symbol=symbol)


# Example decorated tool
@paid_tool("premium-analysis-v1", "0.05", description="Premium market analysis")
def market_analysis_tool(payment_result, **kwargs):
    """Perform premium market analysis with paid data."""
    return f"Premium analysis result: {payment_result}"


__all__ = ["PayableTool", "paid_tool", "WeatherTool", "TokenPriceTool"] 