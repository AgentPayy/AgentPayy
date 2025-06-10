const express = require('express');
const app = express();

app.use(express.json());

// Mock weather data
const weatherData = {
  'NYC': { temp: 72, condition: 'sunny', humidity: 45 },
  'London': { temp: 58, condition: 'cloudy', humidity: 78 },
  'Tokyo': { temp: 68, condition: 'rainy', humidity: 82 },
  'Paris': { temp: 65, condition: 'partly cloudy', humidity: 55 }
};

app.post('/weather', (req, res) => {
  const { city } = req.body;
  const txHash = req.headers['x-agentpay-txhash'];
  const payer = req.headers['x-agentpay-payer'];
  
  console.log(`Weather request for ${city} - Paid by: ${payer}, Tx: ${txHash}`);
  
  const weather = weatherData[city] || weatherData[Object.keys(weatherData)[0]];
  
  res.json({
    city,
    ...weather,
    timestamp: new Date().toISOString(),
    paid: true
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'weather-api' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Weather API running on port ${PORT}`);
  console.log('Ready to receive paid requests from AgentPayKit');
}); 