#!/usr/bin/env python3
"""
Agent-to-Agent Demo: Trading Agent
This agent buys market data from another agent and makes trading decisions.
"""

import os
import time
import json
from typing import Dict, Any

# AgentPayyKit import (assuming it's installed)
try:
    from agentpayy import AgentPayyKit, PaymentOptions
except ImportError:
    print("AgentPayyKit not installed. Run: pip install agentpayy")
    exit(1)


class TradingAgent:
    """An AI agent that pays for market data and makes trading decisions."""
    
    def __init__(self, private_key: str, name: str = "TradingBot"):
        self.name = name
        self.agentpayy = AgentPayyKit(private_key, chain="base")
        self.balance = 10.0  # Starting USDC balance for demo
        self.portfolio = {"BTC": 0, "ETH": 0, "USDC": 1000}
        
        print(f"🤖 {self.name} initialized with {self.balance} USDC for API calls")

    def get_market_data(self, symbol: str) -> Dict[str, Any]:
        """Pay another agent for market data."""
        try:
            print(f"💰 {self.name}: Paying for {symbol} market data...")
            
            result = self.agentpayy.pay_and_call(
                "market-data-agent-v1",  # Another agent's model ID
                {"symbol": symbol, "analysis": True},
                PaymentOptions(price="0.02", chain="base")  # 2 cents for premium data
            )
            
            print(f"✅ {self.name}: Received market data for {symbol}")
            self.balance -= 0.02
            return result
            
        except Exception as e:
            print(f"❌ {self.name}: Failed to get market data: {e}")
            return {"error": str(e)}

    def get_risk_analysis(self, trade_data: Dict) -> Dict[str, Any]:
        """Pay a risk analysis agent."""
        try:
            print(f"💰 {self.name}: Paying for risk analysis...")
            
            result = self.agentpayy.pay_and_call(
                "risk-analysis-agent-v1",
                trade_data,
                PaymentOptions(price="0.05", chain="base")  # 5 cents for risk analysis
            )
            
            print(f"✅ {self.name}: Received risk analysis")
            self.balance -= 0.05
            return result
            
        except Exception as e:
            print(f"❌ {self.name}: Failed to get risk analysis: {e}")
            return {"error": str(e)}

    def make_trading_decision(self, symbol: str) -> Dict[str, Any]:
        """Make a trading decision based on paid data from other agents."""
        print(f"\n📊 {self.name}: Analyzing {symbol}...")
        
        # Step 1: Get market data from data agent
        market_data = self.get_market_data(symbol)
        if "error" in market_data:
            return {"action": "hold", "reason": "No market data available"}
        
        # Step 2: Get risk analysis from risk agent
        risk_data = self.get_risk_analysis({
            "symbol": symbol,
            "portfolio": self.portfolio,
            "market_data": market_data
        })
        
        # Step 3: Make decision
        decision = self._analyze_and_decide(market_data, risk_data)
        
        print(f"🎯 {self.name}: Decision for {symbol}: {decision['action']}")
        print(f"💡 Reasoning: {decision['reason']}")
        print(f"💳 Remaining API balance: ${self.balance:.2f}")
        
        return decision

    def _analyze_and_decide(self, market_data: Dict, risk_data: Dict) -> Dict[str, Any]:
        """Simple trading logic (demo purposes)."""
        
        # Extract price and trend from market data
        price = market_data.get("price", 0)
        trend = market_data.get("trend", "neutral")
        risk_score = risk_data.get("risk_score", 5)
        
        # Simple decision logic
        if trend == "bullish" and risk_score < 3:
            return {
                "action": "buy",
                "amount": 100,
                "reason": f"Bullish trend with low risk (score: {risk_score})"
            }
        elif trend == "bearish" and risk_score > 7:
            return {
                "action": "sell",
                "amount": 50,
                "reason": f"Bearish trend with high risk (score: {risk_score})"
            }
        else:
            return {
                "action": "hold",
                "reason": f"Neutral conditions (trend: {trend}, risk: {risk_score})"
            }

    def run_trading_session(self):
        """Run a demo trading session."""
        print(f"\n🚀 {self.name}: Starting trading session...")
        print("=" * 50)
        
        symbols = ["BTC", "ETH", "ARB"]
        
        for symbol in symbols:
            decision = self.make_trading_decision(symbol)
            time.sleep(1)  # Simulate thinking time
            print()
        
        print("=" * 50)
        print(f"💰 {self.name}: Trading session complete")
        print(f"📊 Final API balance: ${self.balance:.2f}")
        print(f"💼 Portfolio: {self.portfolio}")


def main():
    """Demo script showing agent-to-agent payments."""
    print("🤖 AgentPayyKit Agent-to-Agent Demo")
    print("=" * 50)
    print("This demo shows AI agents paying each other for services:")
    print("• Trading Agent pays Market Data Agent for price data")
    print("• Trading Agent pays Risk Analysis Agent for risk assessment")
    print("• All payments happen on-chain with USDC")
    print()
    
    # Check for private key
    private_key = os.getenv("PRIVATE_KEY")
    if not private_key:
        print("❌ PRIVATE_KEY environment variable required")
        print("Export your private key: export PRIVATE_KEY='0x...'")
        return
    
    # Create and run trading agent
    try:
        agent = TradingAgent(private_key, "DemoTrader")
        agent.run_trading_session()
        
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        print("\nMake sure you have:")
        print("1. USDC balance on Base network")
        print("2. AgentPayyKit contracts deployed")
        print("3. Demo API agents registered")


if __name__ == "__main__":
    main() 