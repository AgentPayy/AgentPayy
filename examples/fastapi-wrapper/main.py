"""
FastAPI AgentPayyKit Integration
Easily monetize your FastAPI endpoints with crypto payments.
"""

from functools import wraps
from typing import Any, Dict, Optional, Callable
import os
import json
import hashlib

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import JSONResponse
import requests


class AgentPayyMiddleware:
    """Middleware to handle AgentPayyKit payments for FastAPI."""
    
    def __init__(self, gateway_url: str = None):
        self.gateway_url = gateway_url or os.getenv("AGENTPAY_GATEWAY_URL", "http://localhost:3000")
        self.registered_endpoints = {}

    def paywall(self, model_id: str, price: str, description: str = None):
        """Decorator to add payment requirement to FastAPI endpoints."""
        def decorator(func: Callable) -> Callable:
            # Register this endpoint
            self.registered_endpoints[model_id] = {
                "function": func,
                "price": price,
                "description": description or f"Paid endpoint: {func.__name__}"
            }
            
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Extract request from args/kwargs
                request = None
                for arg in args:
                    if isinstance(arg, Request):
                        request = arg
                        break
                
                if not request:
                    raise HTTPException(status_code=500, detail="Request object not found")
                
                # Check for payment headers
                tx_hash = request.headers.get("x-agentpayy-txhash")
                payer = request.headers.get("x-agentpayy-payer")
                
                if not tx_hash or not payer:
                    raise HTTPException(
                        status_code=402,
                        detail={
                            "error": "Payment required",
                            "model_id": model_id,
                            "price": price,
                            "description": self.registered_endpoints[model_id]["description"],
                            "payment_info": "Use AgentPayyKit to pay for this endpoint"
                        }
                    )
                
                # Verify payment (simplified - in production, verify on-chain)
                if not await self._verify_payment(tx_hash, model_id, payer):
                    raise HTTPException(status_code=402, detail="Payment verification failed")
                
                # Payment verified, execute function
                return await func(*args, **kwargs) if hasattr(func, '__await__') else func(*args, **kwargs)
            
            return wrapper
        return decorator

    async def _verify_payment(self, tx_hash: str, model_id: str, payer: str) -> bool:
        """Verify payment was made (simplified implementation)."""
        try:
            # In production, this would verify the transaction on-chain
            # For demo, we'll just check if the tx_hash looks valid
            return len(tx_hash) == 66 and tx_hash.startswith("0x")
        except:
            return False


# Initialize middleware
agentpayy = AgentPayyMiddleware()

# Create FastAPI app
app = FastAPI(
    title="AgentPayyKit FastAPI Demo",
    description="Demo API with monetized endpoints using AgentPayyKit",
    version="1.0.0"
)


# Example monetized endpoints
@app.post("/premium-weather")
@agentpayy.paywall("premium-weather-v1", "0.02", "Premium weather data with forecasts")
async def premium_weather(request: Request, data: Dict[str, Any]):
    """Premium weather endpoint that requires payment."""
    city = data.get("city", "Unknown")
    
    # Mock premium weather data
    weather_data = {
        "city": city,
        "current": {
            "temperature": 72,
            "condition": "sunny",
            "humidity": 45,
            "wind_speed": 8
        },
        "forecast": [
            {"day": "tomorrow", "high": 75, "low": 58, "condition": "partly cloudy"},
            {"day": "day_after", "high": 73, "low": 60, "condition": "sunny"}
        ],
        "premium_features": {
            "uv_index": 6,
            "air_quality": "good",
            "pollen_count": "low",
            "sunrise": "6:42 AM",
            "sunset": "7:18 PM"
        },
        "paid": True,
        "source": "Premium Weather API"
    }
    
    return weather_data


@app.post("/ai-analysis")
@agentpayy.paywall("ai-analysis-v1", "0.05", "AI-powered market analysis")
async def ai_analysis(request: Request, data: Dict[str, Any]):
    """AI analysis endpoint that requires payment."""
    query = data.get("query", "")
    
    # Mock AI analysis
    analysis = {
        "query": query,
        "analysis": f"AI analysis for: {query}",
        "confidence": 0.87,
        "insights": [
            "Market sentiment is bullish",
            "Technical indicators suggest upward trend",
            "Volume analysis shows strong support"
        ],
        "recommendations": [
            "Consider increasing position size",
            "Set stop-loss at 5% below current price",
            "Monitor for breakout above resistance"
        ],
        "paid": True,
        "model": "GPT-4 Enhanced"
    }
    
    return analysis


@app.post("/database-query")
@agentpayy.paywall("db-query-v1", "0.01", "Premium database queries")
async def database_query(request: Request, data: Dict[str, Any]):
    """Database query endpoint that requires payment."""
    query = data.get("query", "")
    
    # Mock database results
    results = {
        "query": query,
        "results": [
            {"id": 1, "name": "Sample Data 1", "value": 100},
            {"id": 2, "name": "Sample Data 2", "value": 200},
            {"id": 3, "name": "Sample Data 3", "value": 150}
        ],
        "total_rows": 3,
        "execution_time": "0.045s",
        "paid": True,
        "database": "Premium Analytics DB"
    }
    
    return results


# Free endpoints for comparison
@app.get("/")
async def root():
    """Free endpoint showing available paid services."""
    return {
        "message": "AgentPayyKit FastAPI Demo",
        "paid_endpoints": [
            {
                "endpoint": "/premium-weather",
                "price": "0.02 USDC",
                "description": "Premium weather data with forecasts"
            },
            {
                "endpoint": "/ai-analysis", 
                "price": "0.05 USDC",
                "description": "AI-powered market analysis"
            },
            {
                "endpoint": "/database-query",
                "price": "0.01 USDC", 
                "description": "Premium database queries"
            }
        ],
        "usage": "Use AgentPayyKit SDK to make paid requests"
    }


@app.get("/health")
async def health():
    """Free health check endpoint."""
    return {"status": "ok", "service": "agentpayy-fastapi-demo"}


# Error handlers
@app.exception_handler(402)
async def payment_required_handler(request: Request, exc: HTTPException):
    """Custom handler for payment required errors."""
    return JSONResponse(
        status_code=402,
        content={
            "error": "Payment Required",
            "message": "This endpoint requires payment via AgentPayyKit",
            "details": exc.detail,
            "how_to_pay": "Use AgentPayyKit SDK: agentpayy.pay_and_call(model_id, data, price)"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    print("🚀 Starting AgentPayyKit FastAPI Demo")
    print("💰 Monetized endpoints available:")
    print("  • POST /premium-weather (0.02 USDC)")
    print("  • POST /ai-analysis (0.05 USDC)")  
    print("  • POST /database-query (0.01 USDC)")
    print("\n📖 Visit http://localhost:8000/docs for API documentation")
    
    uvicorn.run(app, host="0.0.0.0", port=8000) 