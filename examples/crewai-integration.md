# CrewAI + AgentPayy Integration

## Install
```bash
pip install crewai agentpay
```

## Setup
```python
from crewai import Agent, Task, Crew
from agentpay import AgentPayyKit

# Initialize AgentPayy (connects to deployed contracts)
agentpay = AgentPayyKit(
    private_key="your_private_key",
    chain="base"  # Uses deployed AgentPayy contracts
)

# Create paid API tool
def paid_weather_api(city: str) -> str:
    """Get weather data with automatic payment"""
    result = agentpay.call_api(
        "https://api.weather.com/v1/current",
        {"city": city},
        "weather-api"
    )
    return f"Weather in {city}: {result['temperature']}°F, {result['condition']}"

# Create CrewAI agent with paid tools
weather_agent = Agent(
    role="Weather Analyst",
    goal="Provide accurate weather information",
    backstory="Expert at analyzing weather patterns",
    tools=[paid_weather_api]
)

# Create task
weather_task = Task(
    description="Get current weather for New York City",
    agent=weather_agent
)

# Run crew (automatically pays for API calls)
crew = Crew(agents=[weather_agent], tasks=[weather_task])
result = crew.kickoff()
```

## Key Benefits
- Automatic payment handling
- No contract deployment needed
- Works with existing CrewAI workflows
- Sub-cent API costs 