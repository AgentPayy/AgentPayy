import express from 'express';
import { ethers } from 'ethers';
import { createClient } from 'redis';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

dotenv.config();

interface PaymentEvent {
  modelId: string;
  payer: string;
  amount: string;
  inputHash: string;
  timestamp: number;
  txHash: string;
}

const CONTRACT_ABI = [
  "event PaymentProcessed(string indexed modelId, address indexed payer, uint256 amount, bytes32 inputHash, uint256 timestamp)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))"
];

class AgentPayGateway {
  private app = express();
  private redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  private providers: { [key: string]: ethers.JsonRpcProvider } = {};
  private contracts: { [key: string]: ethers.Contract } = {};

  constructor() {
    this.setupProviders();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupProviders() {
    const networks = {
      base: { 
        rpc: 'https://mainnet.base.org', 
        contract: process.env.AGENTPAY_BASE_CONTRACT || ''
      },
      arbitrum: { 
        rpc: 'https://arb1.arbitrum.io/rpc', 
        contract: process.env.AGENTPAY_ARBITRUM_CONTRACT || ''
      }
    };

    for (const [name, config] of Object.entries(networks)) {
      if (!config.contract) {
        console.warn(`No contract address for ${name}`);
        continue;
      }
      
      this.providers[name] = new ethers.JsonRpcProvider(config.rpc);
      this.contracts[name] = new ethers.Contract(config.contract, CONTRACT_ABI, this.providers[name]);
    }
  }

  private setupMiddleware() {
    // CORS for browser access
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: { error: 'Too many requests' }
    });
    this.app.use(limiter);

    this.app.use(express.json({ limit: '1mb' }));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
      next();
    });
  }

  private setupRoutes() {
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', networks: Object.keys(this.contracts) });
    });

    // MOCK MODE ENDPOINT - New feature for development
    this.app.post('/api/mock/:modelId', async (req, res) => {
      try {
        const { modelId } = req.params;
        const { input, mock } = req.body;
        
        if (!mock) {
          return res.status(400).json({ error: 'Mock mode not enabled' });
        }

        console.log(`Mock API call: ${modelId}`);
        
        // Try to forward to actual API endpoint for realistic testing
        try {
          const mockModel = await this.getMockModelConfig(modelId);
          if (mockModel?.endpoint) {
            const response = await axios.post(mockModel.endpoint, input, {
              headers: { 
                'X-AgentPay-Mock': 'true',
                'Content-Type': 'application/json'
              },
              timeout: 10000
            });
            
            return res.json({
              mock: true,
              data: response.data,
              timestamp: Date.now()
            });
          }
        } catch (error) {
          console.log(`Mock endpoint not available for ${modelId}, returning mock data`);
        }

        // Return mock data based on model type
        const mockResponse = this.generateMockResponse(modelId, input);
        res.json(mockResponse);
        
      } catch (error) {
        console.error('Mock API error:', error);
        res.status(500).json({ error: 'Mock API call failed' });
      }
    });

    this.app.post('/store-input', async (req, res) => {
      try {
        const { hash, data } = req.body;
        
        if (!hash || !data || typeof hash !== 'string' || typeof data !== 'string') {
          return res.status(400).json({ error: 'Invalid hash or data' });
        }

        if (hash.length !== 66 || !hash.startsWith('0x')) {
          return res.status(400).json({ error: 'Invalid hash format' });
        }

        if (data.length > 100000) { // 100KB limit
          return res.status(413).json({ error: 'Data too large' });
        }

        // Store with 1 hour expiration
        await this.redis.setEx(`input:${hash}`, 3600, data);
        res.json({ success: true });
      } catch (error) {
        console.error('Store input error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/response/:txHash', async (req, res) => {
      try {
        const { txHash } = req.params;
        
        if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
          return res.status(400).json({ error: 'Invalid transaction hash' });
        }

        const response = await this.redis.get(`response:${txHash}`);
        
        if (!response) {
          return res.status(404).json({ error: 'Response not found' });
        }

        res.json(JSON.parse(response));
      } catch (error) {
        console.error('Get response error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Error handling middleware
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  private async getMockModelConfig(modelId: string): Promise<{ endpoint?: string } | null> {
    try {
      // Store mock model configurations in Redis
      const config = await this.redis.get(`mock:model:${modelId}`);
      return config ? JSON.parse(config) : null;
    } catch {
      return null;
    }
  }

  private generateMockResponse(modelId: string, input: any): any {
    const responses: { [key: string]: (input: any) => any } = {
      'weather-api': (input) => ({
        mock: true,
        city: input.city || 'Unknown',
        temperature: 72,
        condition: 'sunny',
        humidity: 45,
        timestamp: Date.now()
      }),
      'token-prices': (input) => ({
        mock: true,
        symbol: input.symbol || 'BTC',
        price: 45000 + Math.random() * 1000,
        change24h: (Math.random() - 0.5) * 10,
        timestamp: Date.now()
      }),
      'ai-analysis': (input) => ({
        mock: true,
        query: input.query || input.text || 'sample query',
        analysis: 'This is a mock AI analysis response',
        confidence: 0.85,
        insights: ['Mock insight 1', 'Mock insight 2'],
        timestamp: Date.now()
      })
    };

    const generator = responses[modelId] || responses['ai-analysis'];
    return generator(input);
  }

  async start() {
    try {
      await this.redis.connect();
      console.log('Connected to Redis');
      
      // Listen for payment events
      for (const [network, contract] of Object.entries(this.contracts)) {
        contract.on('PaymentProcessed', async (modelId, payer, amount, inputHash, timestamp, event) => {
          const payment: PaymentEvent = { 
            modelId, payer, amount, inputHash, timestamp, 
            txHash: event.transactionHash 
          };
          await this.processPayment(payment, network);
        });
        console.log(`Listening for events on ${network}`);
      }

      const port = process.env.PORT || 3000;
      this.app.listen(port, () => {
        console.log(`Gateway running on port ${port}`);
      });
    } catch (error) {
      console.error('Gateway startup failed:', error);
      process.exit(1);
    }
  }

  private async processPayment(payment: PaymentEvent, network: string) {
    try {
      console.log(`Processing payment: ${payment.txHash}`);
      
      const inputData = await this.redis.get(`input:${payment.inputHash}`);
      if (!inputData) {
        console.warn(`No input data for ${payment.inputHash}`);
        return;
      }

      const model = await this.contracts[network].getModel(payment.modelId);
      if (!model.active) {
        console.warn(`Model ${payment.modelId} is inactive`);
        return;
      }

      // Make API call with timeout and retries
      let response;
      const maxRetries = 2;
      
      for (let i = 0; i <= maxRetries; i++) {
        try {
          response = await axios.post(model.endpoint, JSON.parse(inputData), {
            headers: { 
              'X-AgentPay-TxHash': payment.txHash,
              'X-AgentPay-Payer': payment.payer,
              'Content-Type': 'application/json'
            },
            timeout: 30000,
            maxRedirects: 0
          });
          break;
        } catch (error) {
          if (i === maxRetries) throw error;
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }

      // Store response with 1 hour expiration
      await this.redis.setEx(
        `response:${payment.txHash}`, 
        3600, 
        JSON.stringify({
          data: response.data,
          status: response.status,
          timestamp: Date.now()
        })
      );
      
      console.log(`Payment processed successfully: ${payment.txHash}`);
    } catch (error) {
      console.error(`Payment processing failed for ${payment.txHash}:`, error);
      
      // Store error response
      await this.redis.setEx(
        `response:${payment.txHash}`, 
        3600, 
        JSON.stringify({
          error: 'API call failed',
          timestamp: Date.now()
        })
      );
    }
  }
}

new AgentPayGateway().start(); 