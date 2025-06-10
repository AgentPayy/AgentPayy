const express = require('express');
const app = express();

app.use(express.json());

// Mock crypto price data (in production, would use CoinGecko/CoinMarketCap)
const tokenPrices = {
  'BTC': { price: 43250.50, change_24h: 2.3, market_cap: 845000000000 },
  'ETH': { price: 2680.75, change_24h: 1.8, market_cap: 322000000000 },
  'USDC': { price: 1.00, change_24h: 0.01, market_cap: 25000000000 },
  'ARB': { price: 1.85, change_24h: 4.2, market_cap: 2300000000 },
  'OP': { price: 3.15, change_24h: 3.1, market_cap: 3200000000 },
  'MATIC': { price: 0.95, change_24h: -1.2, market_cap: 8800000000 },
  'LINK': { price: 18.50, change_24h: 2.8, market_cap: 11000000000 },
  'UNI': { price: 8.25, change_24h: 1.5, market_cap: 6200000000 }
};

app.post('/price', (req, res) => {
  const { symbol } = req.body;
  const txHash = req.headers['x-agentpay-txhash'];
  const payer = req.headers['x-agentpay-payer'];
  
  console.log(`Price request for ${symbol} - Paid by: ${payer}, Tx: ${txHash}`);
  
  const upperSymbol = symbol?.toUpperCase();
  const priceData = tokenPrices[upperSymbol];
  
  if (!priceData) {
    return res.status(404).json({
      error: `Token ${symbol} not found`,
      available: Object.keys(tokenPrices),
      timestamp: new Date().toISOString()
    });
  }
  
  res.json({
    symbol: upperSymbol,
    ...priceData,
    timestamp: new Date().toISOString(),
    paid: true,
    source: 'AgentPayKit Token Prices API'
  });
});

app.post('/portfolio', (req, res) => {
  const { tokens } = req.body;
  const txHash = req.headers['x-agentpay-txhash'];
  const payer = req.headers['x-agentpay-payer'];
  
  console.log(`Portfolio request for ${tokens?.length} tokens - Paid by: ${payer}, Tx: ${txHash}`);
  
  if (!Array.isArray(tokens)) {
    return res.status(400).json({ error: 'Tokens array required' });
  }
  
  const portfolio = tokens.map(symbol => {
    const upperSymbol = symbol.toUpperCase();
    const priceData = tokenPrices[upperSymbol];
    
    return {
      symbol: upperSymbol,
      found: !!priceData,
      ...(priceData || { error: 'Token not found' })
    };
  });
  
  const totalValue = portfolio
    .filter(token => token.found)
    .reduce((sum, token) => sum + token.price, 0);
  
  res.json({
    portfolio,
    total_tokens: tokens.length,
    found_tokens: portfolio.filter(t => t.found).length,
    total_value: totalValue,
    timestamp: new Date().toISOString(),
    paid: true
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'token-prices-api',
    supported_tokens: Object.keys(tokenPrices)
  });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Token Prices API running on port ${PORT}`);
  console.log('Supported tokens:', Object.keys(tokenPrices).join(', '));
  console.log('Ready to receive paid requests from AgentPayKit');
}); 