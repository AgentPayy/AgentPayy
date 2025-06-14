# FastAPI + AgentPay Integration

## Install
```bash
pip install fastapi agentpay uvicorn
```

## API Provider Setup
```python
from fastapi import FastAPI, HTTPException, Header
from agentpay import AgentPayKit
from typing import Optional

app = FastAPI()

# Initialize AgentPay (connects to deployed contracts)
agentpay = AgentPayKit(
    private_key="your_private_key",
    chain="base"
)

# Payment validation dependency
async def validate_payment(
    x_agentpay_tx: Optional[str] = Header(None),
    request_data: dict = None
):
    if not x_agentpay_tx:
        raise HTTPException(status_code=402, detail="Payment required")
    
    is_valid = await agentpay.validate_payment(x_agentpay_tx, request_data)
    if not is_valid:
        raise HTTPException(status_code=402, detail="Invalid payment")
    
    return x_agentpay_tx

# Protected API endpoint
@app.post("/api/weather")
async def get_weather(
    request: dict,
    tx_hash: str = Depends(validate_payment)
):
    city = request.get("city")
    
    # Your API logic here
    weather_data = await get_weather_data(city)
    
    # Mark payment as processed
    await agentpay.mark_validated(tx_hash)
    
    return weather_data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

## Client Usage
```python
from agentpay import AgentPayKit

client = AgentPayKit(
    private_key="your_private_key",
    chain="base"
)

# Pay for API call
weather = client.call_api(
    "http://localhost:8000/api/weather",
    {"city": "NYC"},
    "weather-api"
)
```

## Key Benefits
- FastAPI dependency injection
- Automatic payment validation
- Uses deployed AgentPay contracts
- No blockchain setup required 