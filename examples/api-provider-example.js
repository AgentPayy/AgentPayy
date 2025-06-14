/**
 * Ultra-Clean API Provider Integration Example
 * Shows how to validate AgentPay payments without storing sensitive data
 */

const express = require('express');
const { ethers } = require('ethers');

const app = express();
app.use(express.json());

// AgentPay contract setup
const AGENTPAY_CONTRACT = "0x..."; // Your deployed contract address
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const contract = new ethers.Contract(AGENTPAY_CONTRACT, [
  "function validatePayment(bytes32 txHash, bytes32 inputHash) view returns (bool)",
  "function getPaymentReceipt(bytes32 txHash) view returns (tuple(bytes32 inputHash, uint256 amount, string modelId, address payer, uint256 timestamp, bool validated))"
], provider);

/**
 * Privacy-First API Endpoint
 * Validates payment without storing input/output data on-chain
 */
app.post('/api/weather', async (req, res) => {
  try {
    // 1. Extract payment proof and input data
    const authHeader = req.headers.authorization;
    const inputHash = req.headers['x-input-hash'];
    const inputData = req.body;

    if (!authHeader?.startsWith('AgentPay ')) {
      return res.status(401).json({ error: 'Missing AgentPay authorization' });
    }

    const txHash = authHeader.replace('AgentPay ', '');

    // 2. Create input hash to verify against payment
    const computedInputHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(inputData))
    );

    // 3. Validate payment on-chain (privacy preserved)
    const isValid = await contract.validatePayment(txHash, computedInputHash);
    
    if (!isValid) {
      return res.status(401).json({ 
        error: 'Invalid payment',
        details: 'Payment not found or input hash mismatch'
      });
    }

    // 4. Get payment details for additional validation
    const receipt = await contract.getPaymentReceipt(txHash);
    
    if (receipt.modelId !== 'weather-api-v1') {
      return res.status(401).json({ error: 'Wrong API model' });
    }

    // 5. Process API request (your business logic here)
    const weatherData = await getWeatherData(inputData.city);

    // 6. Optional: Mark payment as validated
    // (This would require the API provider to have a wallet/signer)
    // await contract.markPaymentValidated(txHash);

    // 7. Return response (not stored on-chain)
    res.json({
      success: true,
      data: weatherData,
      receipt: txHash,
      privacy: 'Input/output data never stored on-chain'
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Mock weather data function
 */
async function getWeatherData(city) {
  // Your actual weather API integration here
  return {
    city,
    temperature: Math.floor(Math.random() * 30) + 10,
    condition: ['sunny', 'cloudy', 'rainy'][Math.floor(Math.random() * 3)],
    timestamp: new Date().toISOString()
  };
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    agentpay: 'integrated',
    privacy: 'preserved'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Privacy-First API running on port ${PORT}`);
  console.log(`🔒 AgentPay validation enabled`);
  console.log(`🛡️  No sensitive data stored on-chain`);
}); 