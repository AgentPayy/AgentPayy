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

// NEW: Attribution interface
interface Attribution {
  recipient: string;
  basisPoints: number;
}

// NEW: Task interfaces for escrow
interface Task {
  id: string;
  payer: string;
  worker: string;
  amount: string;
  token: string;
  escrowType: string | null;
  rules: any;
  status: 'pending' | 'completed' | 'refunded' | 'disputed';
  createdAt: number;
  completedAt?: number;
  result?: any;
}

interface EscrowModule {
  validateCompletion(taskId: string, result: any, rules: any, task: Task): Promise<boolean>;
  shouldRefund(task: Task, currentTime: number): boolean;
}

// NEW: Reputation data interface
interface ReputationData {
  address: string;
  totalCalls: number;
  totalRevenue: string;
  successRate: number;
  avgResponseTime: number;
  uniqueModelsUsed: number;
  recentCalls: number; // Last 7 days
  rating: number;
  specialties: string[];
}

const CONTRACT_ABI = [
  "event PaymentProcessed(string indexed modelId, address indexed payer, uint256 amount, bytes32 inputHash, uint256 timestamp)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
  // NEW: Receipt functions
  "function submitExecutionReceipt(bytes32 txHash, string modelId, address payer, bytes32 inputHash, bytes32 outputHash, bytes32 executionProof, uint256 executedAt, uint256 responseSize, bool success, uint256 httpStatus)",
  "function authorizedGateways(address) view returns (bool)"
];

// NEW: Escrow module implementations
class TimeoutEscrow implements EscrowModule {
  async validateCompletion(taskId: string, result: any, rules: any, task: Task): Promise<boolean> {
    const timeoutMs = rules.timeoutMinutes * 60 * 1000;
    return Date.now() > task.createdAt + timeoutMs;
  }

  shouldRefund(task: Task, currentTime: number): boolean {
    const timeoutMs = task.rules.timeoutMinutes * 60 * 1000;
    return currentTime > task.createdAt + timeoutMs;
  }
}

class HashEscrow implements EscrowModule {
  async validateCompletion(taskId: string, result: any, rules: any, task: Task): Promise<boolean> {
    const expectedHash = rules.expectedHash;
    const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(result)));
    return resultHash === expectedHash;
  }

  shouldRefund(task: Task, currentTime: number): boolean {
    // 24 hour timeout fallback
    return currentTime > task.createdAt + (24 * 60 * 60 * 1000);
  }
}

class MutualEscrow implements EscrowModule {
  private approvals = new Map<string, Set<string>>();

  async validateCompletion(taskId: string, result: any, rules: any, task: Task): Promise<boolean> {
    const approvals = this.approvals.get(taskId) || new Set();
    return approvals.has(task.payer) && approvals.has(task.worker);
  }

  shouldRefund(task: Task, currentTime: number): boolean {
    // 48 hour timeout for mutual approval
    return currentTime > task.createdAt + (48 * 60 * 60 * 1000);
  }

  approveTask(taskId: string, approver: string) {
    if (!this.approvals.has(taskId)) {
      this.approvals.set(taskId, new Set());
    }
    this.approvals.get(taskId)!.add(approver);
  }
}

class AgentPayGateway {
  private app = express();
  private redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  private providers: { [key: string]: ethers.JsonRpcProvider } = {};
  private contracts: { [key: string]: ethers.Contract } = {};
  private gatewayWallet: ethers.Wallet; // NEW: Gateway's signing wallet
  
  // NEW: Task escrow system
  private pendingTasks = new Map<string, Task>();
  private escrowModules = new Map<string, EscrowModule>();
  
  // NEW: Reputation tracking
  private reputationCache = new Map<string, ReputationData>();

  constructor() {
    // Initialize gateway wallet for signing receipts
    const privateKey = process.env.GATEWAY_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('GATEWAY_PRIVATE_KEY environment variable required');
    }
    this.gatewayWallet = new ethers.Wallet(privateKey);
    
    this.setupProviders();
    this.setupMiddleware();
    this.setupEscrowModules();
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

  private setupEscrowModules() {
    // Initialize built-in escrow modules
    this.escrowModules.set('timeout', new TimeoutEscrow());
    this.escrowModules.set('hash', new HashEscrow());
    this.escrowModules.set('mutual', new MutualEscrow());
    
    console.log('Escrow modules initialized:', Array.from(this.escrowModules.keys()));
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

    // NEW: Reputation API endpoints
    this.app.get('/reputation/:address', async (req, res) => {
      try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
          return res.status(400).json({ error: 'Invalid address' });
        }

        const reputation = await this.getReputationData(address);
        res.json(reputation);
      } catch (error) {
        console.error('Get reputation error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/leaderboard', async (req, res) => {
      try {
        const limit = parseInt(req.query.limit as string) || 10;
        const leaderboard = await this.getLeaderboard(limit);
        res.json(leaderboard);
      } catch (error) {
        console.error('Get leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // NEW: Task escrow endpoints
    this.app.post('/tasks', async (req, res) => {
      try {
        const { worker, amount, token, escrowType, rules, payer } = req.body;
        
        if (!worker || !amount || !token || !payer) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const taskId = await this.createTask({
          worker,
          amount,
          token,
          escrowType: escrowType || null,
          rules: rules || {},
          payer
        });

        res.json({ taskId, status: 'created' });
      } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.post('/tasks/:taskId/complete', async (req, res) => {
      try {
        const { taskId } = req.params;
        const { result, worker } = req.body;
        
        const success = await this.completeTask(taskId, result, worker);
        
        if (success) {
          res.json({ success: true, status: 'completed' });
        } else {
          res.status(400).json({ error: 'Task completion failed' });
        }
      } catch (error) {
        console.error('Complete task error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.post('/tasks/:taskId/approve', async (req, res) => {
      try {
        const { taskId } = req.params;
        const { approver } = req.body;
        
        const task = this.pendingTasks.get(taskId);
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        if (task.escrowType === 'mutual') {
          const mutualEscrow = this.escrowModules.get('mutual') as MutualEscrow;
          mutualEscrow.approveTask(taskId, approver);
          
          // Check if both parties approved
          if (await mutualEscrow.validateCompletion(taskId, null, task.rules, task)) {
            await this.completeTask(taskId, task.result, task.worker);
          }
        }

        res.json({ success: true });
      } catch (error) {
        console.error('Approve task error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    this.app.get('/tasks/:taskId', async (req, res) => {
      try {
        const { taskId } = req.params;
        const task = this.pendingTasks.get(taskId);
        
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
      } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // NEW: Attribution support endpoint
    this.app.post('/pay-with-attribution', async (req, res) => {
      try {
        const { modelId, input, attributions, payer, amount } = req.body;
        
        if (!modelId || !input || !attributions || !payer || !amount) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        // Validate attribution splits
        const totalBasisPoints = attributions.reduce((sum: number, attr: Attribution) => sum + attr.basisPoints, 0);
        if (totalBasisPoints !== 10000) {
          return res.status(400).json({ error: 'Attribution must sum to 100%' });
        }

        // Store attribution data
        const inputHash = this.hashData(JSON.stringify(input));
        await this.redis.setEx(`attribution:${inputHash}`, 3600, JSON.stringify(attributions));

        res.json({ 
          success: true, 
          inputHash,
          message: 'Attribution recorded. Proceed with payment.' 
        });
      } catch (error) {
        console.error('Attribution payment error:', error);
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

  // NEW: Reputation system methods
  private async getReputationData(address: string): Promise<ReputationData> {
    // Check cache first
    if (this.reputationCache.has(address)) {
      const cached = this.reputationCache.get(address)!;
      // Refresh if older than 5 minutes
      if (Date.now() - cached.rating < 300000) {
        return cached;
      }
    }

    // Aggregate data from Redis
    let totalCalls = 0;
    let totalRevenue = 0;
    let successfulCalls = 0;
    let responseTimes: number[] = [];
    let modelsUsed = new Set<string>();
    let recentCalls = 0;
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

    // Get all payment events for this address
    const keys = await this.redis.keys(`payment:*:${address}`);
    
    for (const key of keys) {
      const paymentData = await this.redis.get(key);
      if (paymentData) {
        const payment = JSON.parse(paymentData);
        totalCalls++;
        totalRevenue += parseFloat(payment.amount);
        modelsUsed.add(payment.modelId);
        
        if (payment.timestamp > sevenDaysAgo) {
          recentCalls++;
        }
        
        if (payment.success !== false) {
          successfulCalls++;
        }
        
        if (payment.responseTime) {
          responseTimes.push(payment.responseTime);
        }
      }
    }

    const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    // Calculate rating (0-5 scale based on success rate and activity)
    const rating = Math.min(5, (successRate / 100) * 5 * Math.log10(totalCalls + 1));

    const reputation: ReputationData = {
      address,
      totalCalls,
      totalRevenue: totalRevenue.toFixed(6),
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      uniqueModelsUsed: modelsUsed.size,
      recentCalls,
      rating: Math.round(rating * 100) / 100,
      specialties: Array.from(modelsUsed).slice(0, 5) // Top 5 models
    };

    // Cache result
    this.reputationCache.set(address, reputation);
    
    return reputation;
  }

  private async getLeaderboard(limit: number): Promise<ReputationData[]> {
    // Get all unique addresses from payments
    const keys = await this.redis.keys('payment:*');
    const addresses = new Set<string>();
    
    for (const key of keys) {
      const parts = key.split(':');
      if (parts.length >= 3) {
        addresses.add(parts[2]); // Extract address from key
      }
    }

    // Get reputation for each address
    const reputations = await Promise.all(
      Array.from(addresses).map(addr => this.getReputationData(addr))
    );

    // Sort by rating * total calls (weighted score)
    return reputations
      .sort((a, b) => (b.rating * b.totalCalls) - (a.rating * a.totalCalls))
      .slice(0, limit);
  }

  // NEW: Task escrow methods
  private async createTask(params: {
    worker: string;
    amount: string;
    token: string;
    escrowType: string | null;
    rules: any;
    payer: string;
  }): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const task: Task = {
      id: taskId,
      payer: params.payer,
      worker: params.worker,
      amount: params.amount,
      token: params.token,
      escrowType: params.escrowType,
      rules: params.rules,
      status: 'pending',
      createdAt: Date.now()
    };

    // Store in memory and Redis
    this.pendingTasks.set(taskId, task);
    await this.redis.setEx(`task:${taskId}`, 86400, JSON.stringify(task)); // 24 hour expiry

    console.log(`Task created: ${taskId} by ${params.payer} for ${params.worker}`);
    
    return taskId;
  }

  private async completeTask(taskId: string, result: any, worker: string): Promise<boolean> {
    const task = this.pendingTasks.get(taskId);
    if (!task) {
      console.error(`Task not found: ${taskId}`);
      return false;
    }

    if (task.worker !== worker) {
      console.error(`Unauthorized completion attempt by ${worker} for task ${taskId}`);
      return false;
    }

    if (task.status !== 'pending') {
      console.error(`Task ${taskId} is not pending (status: ${task.status})`);
      return false;
    }

    // Validate completion based on escrow type
    if (task.escrowType && this.escrowModules.has(task.escrowType)) {
      const escrow = this.escrowModules.get(task.escrowType)!;
      const isValid = await escrow.validateCompletion(taskId, result, task.rules, task);
      
      if (!isValid) {
        console.error(`Task completion validation failed for ${taskId}`);
        return false;
      }
    }

    // Update task status
    task.status = 'completed';
    task.completedAt = Date.now();
    task.result = result;

    // Update storage
    this.pendingTasks.set(taskId, task);
    await this.redis.setEx(`task:${taskId}`, 86400, JSON.stringify(task));

    console.log(`Task completed: ${taskId}`);
    
    // Here you would release the escrowed funds
    // For now, just log it
    console.log(`Releasing ${task.amount} ${task.token} to ${task.worker}`);
    
    return true;
  }

  private async processTimeouts() {
    const currentTime = Date.now();
    
    for (const [taskId, task] of this.pendingTasks) {
      if (task.status !== 'pending') continue;
      
      const shouldRefund = task.escrowType && this.escrowModules.has(task.escrowType) 
        ? this.escrowModules.get(task.escrowType)!.shouldRefund(task, currentTime)
        : currentTime > task.createdAt + (24 * 60 * 60 * 1000); // Default 24h timeout

      if (shouldRefund) {
        task.status = 'refunded';
        this.pendingTasks.set(taskId, task);
        await this.redis.setEx(`task:${taskId}`, 86400, JSON.stringify(task));
        
        console.log(`Task refunded due to timeout: ${taskId}`);
        // Here you would actually refund the escrowed funds
      }
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

      // NEW: Start timeout processor for tasks
      setInterval(() => {
        this.processTimeouts().catch(console.error);
      }, 60000); // Check every minute

      const port = process.env.PORT || 3000;
      this.app.listen(port, () => {
        console.log(`Gateway running on port ${port}`);
        console.log(`Features enabled: Attribution, Reputation, Task Escrow`);
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