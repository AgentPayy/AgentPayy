# AgentPayy Python SDK

**Complete Python integration** for the AgentPayy payment network. All features in one package.

## Install
```bash
pip install agentpayy
```

## Basic Usage
```python
from agentpayy import AgentPayyKit

agentpay = AgentPayyKit(
    private_key="0x...", 
    chain="base"  # Uses deployed AgentPayy contracts
)

# Pay for API call
result = agentpay.call_api(
    "https://api.example.com",
    {"input": "data"},
    "model-id"
)
```

## Complete Feature Set

### Core Payment System
```python
# Basic API payment
result = agentpay.call_api(endpoint, data, model_id)

# Payment validation (for API providers)
is_valid = agentpay.validate_payment(tx_hash, input_data)
agentpay.mark_validated(tx_hash)
```

### Advanced Features
```python
# Attribution payments (revenue sharing)
attributions = [
    {"recipient": "0xAgent1", "basisPoints": 6000},  # 60%
    {"recipient": "0xAgent2", "basisPoints": 4000}   # 40%
]

result = agentpay.pay_with_attribution(
    "complex-analysis",
    {"data": "input"},
    attributions,
    {"price": "0.10"}
)

# Balance management
agentpay.deposit_balance("10.0")  # Deposit $10 USDC
balance = agentpay.get_user_balance()
agentpay.withdraw_balance("5.0")  # Withdraw specific amount
agentpay.withdraw()  # Withdraw all earnings

# Reputation system
reputation = agentpay.get_reputation(agent_address)
specialists = agentpay.find_agents_by_specialty("weather-data", 4.0)
leaderboard = agentpay.get_leaderboard(10)

# API marketplace
agentpay.register_model({
    "modelId": "weather-api-v1",
    "endpoint": "https://api.myservice.com/weather",
    "price": "0.02",
    "category": "Weather & Environment"
})

weather_apis = agentpay.get_apis_by_category("Weather & Environment")
```

## API Provider Integration
```python
# Validate payments in your API
is_valid = agentpay.validate_payment(tx_hash, input_data)
if not is_valid:
    return {"error": "Invalid payment"}

# Mark payment as processed
agentpay.mark_validated(tx_hash)

# Register your API for monetization
agentpay.register_model({
    "modelId": "my-api",
    "endpoint": "https://api.myservice.com",
    "price": "0.05"
})
```

## API Discovery & Marketplace
```python
# Register API with full metadata
agentpay.register_model({
    "modelId": "weather-forecast-v2",
    "endpoint": "https://api.weather.com/forecast",
    "price": "0.03",
    "category": "Weather & Environment",
    "tags": ["weather", "forecast", "climate"],
    "description": "Advanced weather forecasting API"
})

# Discover APIs by category
weather_apis = agentpay.get_apis_by_category("Weather & Environment")

# Search APIs by tags
ai_apis = agentpay.search_apis_by_tag("ai")

# Get marketplace statistics
stats = agentpay.get_marketplace_stats()
print(f"{stats['totalAPIs']} APIs, {stats['totalDevelopers']} developers")

# Get trending APIs
trending = agentpay.get_trending_apis(10)
```

## Available Networks
- **base**: Base mainnet (recommended)
- **arbitrum**: Arbitrum One
- **optimism**: Optimism mainnet
- **polygon**: Polygon mainnet

## Key Features
- **Complete Package**: All AgentPayy features in single Python package
- **Zero Setup**: Uses deployed AgentPayy contracts (no deployment needed)
- **Privacy-First**: Only payment hashes stored on-chain
- **Sub-Cent Costs**: Enable $0.001-$0.01 API calls economically
- **Multi-Chain**: Works across Base, Arbitrum, Optimism L2s
- **AI-Agent Ready**: Perfect for CrewAI, AutoGPT, LangChain workflows
- **FastAPI Integration**: Built-in middleware for API monetization

## Package Contents
- **AgentPayyKit**: Main payment class with all methods
- **Reputation System**: Agent discovery and scoring functions
- **Attribution Engine**: Multi-party revenue sharing
- **Balance Management**: Prepaid balance and earnings withdrawal
- **API Registry**: On-chain marketplace integration
- **Crypto Utilities**: Signature verification and hashing functions

## Quick Start

```python
from agentpayy import AgentPayyKit

# Initialize with private key
agentpay = AgentPayyKit(private_key="0x...", chain="base")

# Make API call with payment
result = agentpay.pay_and_call(
    model_id="weather-api",
    input_data={"city": "NYC"},
    price="0.01"
)
print(result)  # Weather data
```

## Basic Usage

### Initialize Client

```python
import os
from agentpayy import AgentPayyKit

# From environment variable
agentpay = AgentPayyKit(
    private_key=os.getenv("PRIVATE_KEY"),
    chain="base",  # base|arbitrum|optimism|ethereum
    gateway_url="https://gateway.agentpayy.dev"
)

# Check connection
print(f"Wallet: {agentpay.account.address}")
print(f"Chain: {agentpay.chain}")
```

### API Calls with Payment

```python
# Simple API call
weather = agentpay.pay_and_call(
    model_id="weather-api",
    input_data={"city": "San Francisco"},
    price="0.01"
)

# With options
result = agentpay.pay_and_call(
    model_id="premium-analysis",
    input_data={"text": "Analyze this market data..."},
    price="0.25",
    use_balance=True,  # Try balance first
    mock=False         # Set True for testing
)
```

### Mock Mode for Development

```python
# Test without payment
mock_result = agentpay.pay_and_call(
    model_id="weather-api",
    input_data={"city": "Tokyo"},
    price="0.01",
    mock=True  # Returns realistic mock data
)

print(mock_result)  # {'temperature': 72, 'condition': 'sunny', 'mock': True}
```

## Balance Management

### Netflix-Style Prepaid Balance

```python
# Deposit to balance
agentpay.deposit_balance(amount="10.0")  # $10 USDC

# Check balance
balance = agentpay.get_user_balance()
print(f"Balance: ${balance} USDC")

# Check if can afford API call
can_afford = agentpay.check_user_balance(required="0.05")

# Withdraw from balance
agentpay.withdraw_balance(amount="5.0")
```

## API Provider Functions

### Register API for Monetization

```python
# Register your API to earn money
agentpay.register_model(
    model_id="my-analysis-api",
    endpoint="https://api.myservice.com/analyze",
    price="0.50"
)

# Check earnings
earnings = agentpay.get_earnings()
print(f"Earned: ${earnings} USDC")

# Withdraw earnings
tx_hash = agentpay.withdraw_earnings()
print(f"Withdrawal: {tx_hash}")
```

## CrewAI Integration

```python
from agentpayy.crewai import AgentPayyTool

# Create paywall tool for CrewAI agents
weather_tool = AgentPayyTool(
    model_id="weather-api",
    price="0.01",
    description="Get current weather for any city",
    chain="base"
)

# Use in CrewAI agent
from crewai import Agent

agent = Agent(
    role="Weather Analyst",
    goal="Provide weather insights",
    tools=[weather_tool]
)

# Agent automatically pays for API calls
result = agent.execute("What's the weather in NYC?")
```

## LangChain Integration

```python
from agentpayy.langchain import AgentPayyWrapper
from langchain.tools import Tool

# Wrap any API with payment
paid_weather_tool = Tool(
    name="Weather API",
    description="Get weather data with automatic payment",
    func=AgentPayyWrapper(
        model_id="weather-api",
        price="0.01",
        chain="base"
    )
)

# Use with LangChain agents
from langchain.agents import initialize_agent

agent = initialize_agent(
    tools=[paid_weather_tool],
    llm=your_llm,
    agent="zero-shot-react-description"
)

# Agent pays automatically when using the tool
response = agent.run("What's the weather like in London?")
```

## FastAPI Integration

```python
from fastapi import FastAPI
from agentpayy import require_payment

app = FastAPI()

@app.post("/premium-analysis")
@require_payment(model_id="analysis-api", price="0.25")
async def premium_analysis(data: dict):
    """Premium analysis endpoint with automatic payment"""
    # Payment is verified before this function runs
    return {"analysis": "Premium analysis results...", "paid": True}

# Clients automatically pay when calling this endpoint
```

## Financial Overview

```python
# Complete financial picture
financials = agentpay.get_financial_overview()

print(f"Earnings: ${financials['earnings']}")
print(f"Balance: ${financials['balance']}")  
print(f"Total Spent: ${financials['total_spent']}")
print(f"Net Position: ${financials['net_position']}")
```

## Multi-Chain Usage

```python
# Different chains for different use cases
base_client = AgentPayyKit(private_key=key, chain="base")        # Consumer apps
arbitrum_client = AgentPayyKit(private_key=key, chain="arbitrum") # DeFi integration
optimism_client = AgentPayyKit(private_key=key, chain="optimism") # Superchain apps

# Ethereum for enterprise
ethereum_client = AgentPayyKit(private_key=key, chain="ethereum")
```

## Environment Setup

```bash
# Required
export PRIVATE_KEY="0x..."

# Optional - Smart wallet features
export BICONOMY_PAYMASTER_API_KEY="..."
export ZERODEV_API_KEY="..."

# Optional - Custom gateway
export AGENTPAY_GATEWAY_URL="https://gateway.agentpayy.dev"
```

## Error Handling

```python
from agentpayy.exceptions import InsufficientBalance, PaymentFailed

try:
    result = agentpay.pay_and_call("expensive-api", data, "10.0")
except InsufficientBalance:
    print("Need to deposit more funds")
    agentpay.deposit_balance("20.0")
    result = agentpay.pay_and_call("expensive-api", data, "10.0")
    
except PaymentFailed as e:
    print(f"Payment failed: {e}")
    # Try with mock mode for testing
    result = agentpay.pay_and_call("expensive-api", data, "10.0", mock=True)
```

## Examples

### AI Trading Bot

```python
from agentpayy import AgentPayyKit
import time

class TradingBot:
    def __init__(self):
        self.agentpay = AgentPayyKit(
            private_key=os.getenv("PRIVATE_KEY"),
            chain="base"
        )
        
        # Register price alert service (earn money)
        self.agentpay.register_model(
            model_id="price-alerts",
            endpoint="https://bot.example.com/alerts",
            price="0.10"
        )
        
        # Deposit trading capital
        self.agentpay.deposit_balance("100.0")
    
    def trade(self):
        # Get market data (spend money)
        prices = self.agentpay.pay_and_call(
            model_id="market-data",
            input_data={"symbols": ["BTC", "ETH"]},
            price="0.02"
        )
        
        # Analyze and trade based on data
        if prices["BTC"] > 50000:
            # Send alerts to subscribers (earn money automatically)
            pass
    
    def run(self):
        while True:
            self.trade()
            time.sleep(60)

# Bot both earns and spends using same wallet
bot = TradingBot()
bot.run()
```

### Data Pipeline

```python
from agentpayy import AgentPayyKit

class DataPipeline:
    def __init__(self):
        self.agentpay = AgentPayyKit(
            private_key=os.getenv("PRIVATE_KEY"),
            chain="arbitrum"  # Lower costs for high volume
        )
    
    def process_data(self, raw_data):
        # Step 1: Clean data (pay for cleaning API)
        cleaned = self.agentpay.pay_and_call(
            "data-cleaning",
            {"data": raw_data},
            "0.01"
        )
        
        # Step 2: Analyze data (pay for analysis API)
        analysis = self.agentpay.pay_and_call(
            "data-analysis", 
            cleaned,
            "0.05"
        )
        
        # Step 3: Generate insights (pay for AI model)
        insights = self.agentpay.pay_and_call(
            "insight-generation",
            analysis,
            "0.10"
        )
        
        return insights

# Pay for each step in data pipeline
pipeline = DataPipeline()
results = pipeline.process_data(your_data)
```

### Research Assistant

```python
import asyncio
from agentpayy import AgentPayyKit

class ResearchAssistant:
    def __init__(self):
        self.agentpay = AgentPayyKit(
            private_key=os.getenv("PRIVATE_KEY"),
            chain="base"
        )
    
    async def research_topic(self, topic):
        tasks = [
            # Parallel API calls with payments
            self.agentpay.pay_and_call("news-api", {"query": topic}, "0.03"),
            self.agentpay.pay_and_call("academic-papers", {"topic": topic}, "0.05"),
            self.agentpay.pay_and_call("expert-opinions", {"subject": topic}, "0.08")
        ]
        
        results = await asyncio.gather(*tasks)
        
        # Synthesize results (another paid API)
        synthesis = self.agentpay.pay_and_call(
            "content-synthesis",
            {"sources": results},
            "0.15"
        )
        
        return synthesis

# Research assistant that pays for premium sources
assistant = ResearchAssistant()
research = asyncio.run(assistant.research_topic("AI safety"))
```

## Convenience Functions

```python
# Quick one-liner for simple use cases
from agentpayy import pay_and_call

# Uses PRIVATE_KEY from environment
result = pay_and_call(
    model_id="weather-api",
    input_data={"city": "NYC"},
    price="0.01",
    mock=True  # For testing
)
```

## Support

- **AI Frameworks**: Native CrewAI and LangChain support
- **Web3**: Full smart contract integration
- **Testing**: Mock mode for development
- **Multi-chain**: 13 networks supported

See main repository for additional examples and integration guides. 