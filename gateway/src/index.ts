import express from 'express';
import { ethers } from 'ethers';
import { createClient } from 'redis';
import axios from 'axios';
import * as dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

dotenv.config();

interface PaymentEvent {
  modelId: string;
  payer: string;
  amount: string;
  inputHash: string;
  timestamp: number;
  txHash: string;
}

// NEW: Receipt interface
interface APIExecutionReceipt {
  txHash: string;
  modelId: string;
  payer: string;
  inputHash: string;
  outputHash: string;
  executionProof: string;
  executedAt: number;
  responseSize: number;
  success: boolean;
  httpStatus: number;
  gateway: string;
}

const CONTRACT_ABI = [
  "event PaymentProcessed(string indexed modelId, address indexed payer, uint256 amount, bytes32 inputHash, uint256 timestamp)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
  // NEW: Receipt functions
  "function submitExecutionReceipt(bytes32 txHash, string modelId, address payer, bytes32 inputHash, bytes32 outputHash, bytes32 executionProof, uint256 executedAt, uint256 responseSize, bool success, uint256 httpStatus)",
  "function authorizedGateways(address) view returns (bool)"
];

class AgentPayGateway {
  private app = express();
  private redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  private providers: { [key: string]: ethers.JsonRpcProvider } = {};
  private contracts: { [key: string]: ethers.Contract } = {};
  private gatewayWallet: ethers.Wallet; // NEW: Gateway's signing wallet

  constructor() {
    // Initialize gateway wallet for signing receipts
    const privateKey = process.env.GATEWAY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('GATEWAY_PRIVATE_KEY environment variable required');
    }
    this.gatewayWallet = new ethers.Wallet(privateKey);
    
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
      const connectedWallet = this.gatewayWallet.connect(this.providers[name]);
      this.contracts[name] = new ethers.Contract(config.contract, CONTRACT_ABI, connectedWallet);
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
      res.json({ 
        status: 'ok', 
        networks: Object.keys(this.contracts),
        gatewayAddress: this.gatewayWallet.address 
      });
    });

    // MOCK MODE ENDPOINT - Enhanced with receipt generation
    this.app.post('/api/mock/:modelId', async (req, res) => {
      try {
        const { modelId } = req.params;
        const { input, mock } = req.body;
        
        if (!mock) {
          return res.status(400).json({ error: 'Mock mode not enabled' });
        }

        console.log(`Mock API call: ${modelId}`);
        
        // Generate input hash for consistency
        const inputData = JSON.stringify(input);
        const inputHash = this.hashData(inputData);
        
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
            
            // Generate mock receipt
            const outputData = JSON.stringify(response.data);
            const outputHash = this.hashData(outputData);
            
            return res.json({
              mock: true,
              data: response.data,
              timestamp: Date.now(),
              receipt: {
                inputHash,
                outputHash,
                success: true,
                httpStatus: response.status,
                responseSize: outputData.length
              }
            });
          }
        } catch (error) {
          console.log(`Mock endpoint not available for ${modelId}, returning mock data`);
        }

        // Return mock data based on model type
        const mockResponse = this.generateMockResponse(modelId, input);
        const outputData = JSON.stringify(mockResponse);
        const outputHash = this.hashData(outputData);
        
        res.json({
          ...mockResponse,
          receipt: {
            inputHash,
            outputHash,
            success: true,
            httpStatus: 200,
            responseSize: outputData.length
          }
        });
        
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

        // Verify hash matches data
        const computedHash = this.hashData(data);
        if (computedHash !== hash) {
          return res.status(400).json({ error: 'Hash does not match data' });
        }

        // Store with 1 hour expiration
        await this.redis.setEx(`input:${hash}`, 3600, data);
        res.json({ success: true });
      } catch (error) {
        console.error('Store input error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // NEW: Get receipt endpoint
    this.app.get('/receipt/:txHash', async (req, res) => {
      try {
        const { txHash } = req.params;
        
        if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
          return res.status(400).json({ error: 'Invalid transaction hash' });
        }

        const receipt = await this.redis.get(`receipt:${txHash}`);
        
        if (!receipt) {
          return res.status(404).json({ error: 'Receipt not found' });
        }

        res.json(JSON.parse(receipt));
      } catch (error) {
        console.error('Get receipt error:', error);
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

  // NEW: Hash data consistently
  private hashData(data: string): string {
    return ethers.keccak256(ethers.toUtf8Bytes(data));
  }

  // NEW: Generate execution proof signature
  private async generateExecutionProof(receipt: Omit<APIExecutionReceipt, 'executionProof' | 'gateway'>): Promise<string> {
    const messageHash = ethers.keccak256(ethers.solidityPacked(
      ['bytes32', 'string', 'address', 'bytes32', 'bytes32', 'uint256', 'uint256', 'bool', 'uint256'],
      [
        receipt.txHash,
        receipt.modelId,
        receipt.payer,
        receipt.inputHash,
        receipt.outputHash,
        receipt.executedAt,
        receipt.responseSize,
        receipt.success,
        receipt.httpStatus
      ]
    ));

    const signature = await this.gatewayWallet.signMessage(ethers.getBytes(messageHash));
    return signature;
  }

  // NEW: Submit receipt to blockchain
  private async submitReceipt(receipt: APIExecutionReceipt, network: string): Promise<void> {
    try {
      const contract = this.contracts[network];
      if (!contract) {
        console.warn(`No contract for network: ${network}`);
        return;
      }

      // Check if gateway is authorized
      const isAuthorized = await contract.authorizedGateways(this.gatewayWallet.address);
      if (!isAuthorized) {
        console.warn(`Gateway not authorized on ${network}`);
        return;
      }

      const tx = await contract.submitExecutionReceipt(
        receipt.txHash,
        receipt.modelId,
        receipt.payer,
        receipt.inputHash,
        receipt.outputHash,
        receipt.executionProof,
        receipt.executedAt,
        receipt.responseSize,
        receipt.success,
        receipt.httpStatus
      );

      console.log(`Receipt submitted to ${network}: ${tx.hash}`);
      await tx.wait();
      console.log(`Receipt confirmed on ${network}`);
    } catch (error) {
      console.error(`Failed to submit receipt to ${network}:`, error);
    }
  }

  async start() {
    try {
      await this.redis.connect();
      console.log('Connected to Redis');
      console.log(`Gateway address: ${this.gatewayWallet.address}`);
      
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

      const executedAt = Math.floor(Date.now() / 1000);
      let response: any;
      let success = false;
      let httpStatus = 0;
      let outputData = '';
      
      // Make API call with timeout and retries
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
          
          success = true;
          httpStatus = response.status;
          outputData = JSON.stringify(response.data);
          break;
        } catch (error: any) {
          httpStatus = error.response?.status || 500;
          outputData = JSON.stringify({ error: error.message });
          if (i === maxRetries) {
            console.error(`API call failed after ${maxRetries + 1} attempts`);
          } else {
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
          }
        }
      }

      // Generate hashes
      const inputHash = this.hashData(inputData);
      const outputHash = this.hashData(outputData);

      // Create receipt
      const receiptData: Omit<APIExecutionReceipt, 'executionProof' | 'gateway'> = {
        txHash: payment.txHash,
        modelId: payment.modelId,
        payer: payment.payer,
        inputHash,
        outputHash,
        executedAt,
        responseSize: outputData.length,
        success,
        httpStatus
      };

      // Generate execution proof
      const executionProof = await this.generateExecutionProof(receiptData);

      const fullReceipt: APIExecutionReceipt = {
        ...receiptData,
        executionProof,
        gateway: this.gatewayWallet.address
      };

      // Store receipt locally
      await this.redis.setEx(
        `receipt:${payment.txHash}`, 
        86400, // 24 hours
        JSON.stringify(fullReceipt)
      );

      // Store response data  
      await this.redis.setEx(
        `response:${payment.txHash}`, 
        3600, // 1 hour
        JSON.stringify({
          data: success ? response.data : { error: outputData },
          status: httpStatus,
          timestamp: Date.now(),
          receipt: fullReceipt
        })
      );

      // Submit receipt to blockchain
      await this.submitReceipt(fullReceipt, network);
      
      console.log(`Payment processed successfully: ${payment.txHash}`);
      console.log(`Receipt generated and submitted: ${fullReceipt.executionProof.slice(0, 10)}...`);
      
    } catch (error) {
      console.error(`Payment processing failed for ${payment.txHash}:`, error);
      
      // Store error response with receipt
      const errorOutputData = JSON.stringify({ error: 'Processing failed' });
      const errorReceipt: APIExecutionReceipt = {
        txHash: payment.txHash,
        modelId: payment.modelId,
        payer: payment.payer,
        inputHash: payment.inputHash,
        outputHash: this.hashData(errorOutputData),
        executionProof: '', // Could sign error case too
        executedAt: Math.floor(Date.now() / 1000),
        responseSize: errorOutputData.length,
        success: false,
        httpStatus: 500,
        gateway: this.gatewayWallet.address
      };

      await this.redis.setEx(
        `response:${payment.txHash}`, 
        3600, 
        JSON.stringify({
          error: 'API call failed',
          timestamp: Date.now(),
          receipt: errorReceipt
        })
      );
    }
  }
}

new AgentPayGateway().start(); 