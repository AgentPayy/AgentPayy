import { ethers } from 'ethers';
import { createClient, RedisClientType } from 'redis';

/**
 * @fileoverview Payment Service - Handles payment validation and processing
 * @author AgentPay Team
 * @version 2.0.0
 */

export interface PaymentEvent {
  modelId: string;
  payer: string;
  amount: string;
  inputHash: string;
  timestamp: number;
  txHash: string;
}

export interface PaymentValidationResult {
  valid: boolean;
  reason?: string;
  gasEstimate?: string;
}

/**
 * Service for handling payment validation, processing, and analytics
 */
export class PaymentService {
  private redis: RedisClientType;
  private providers: { [key: string]: ethers.JsonRpcProvider } = {};
  private contracts: { [key: string]: ethers.Contract } = {};
  private analytics = {
    totalPayments: 0,
    totalRevenue: '0',
    uniqueUsers: new Set<string>(),
    recentPayments: [] as PaymentEvent[]
  };

  private readonly CONTRACT_ABI = [
    "event PaymentProcessed(string indexed modelId, address indexed payer, uint256 amount, bytes32 inputHash, uint256 timestamp)",
    "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
    "function getBalance(address user, address token) view returns (uint256)",
    "function getUserBalance(address user, address token) view returns (uint256)"
  ];

  constructor(redisUrl?: string) {
    this.redis = createClient({ url: redisUrl || 'redis://localhost:6379' });
  }

  /**
   * Initialize payment service
   */
  async initialize(): Promise<void> {
    await this.redis.connect();
    console.log('✅ PaymentService connected to Redis');
    
    this.setupProviders();
    this.setupEventListeners();
  }

  /**
   * Setup blockchain providers and contracts
   */
  private setupProviders(): void {
    const networks = {
      'ethereum': process.env.ETHEREUM_RPC || 'https://eth.llamarpc.com',
      'polygon': process.env.POLYGON_RPC || 'https://polygon.llamarpc.com',
      'arbitrum': process.env.ARBITRUM_RPC || 'https://arbitrum.llamarpc.com',
      'optimism': process.env.OPTIMISM_RPC || 'https://optimism.llamarpc.com',
      'base': process.env.BASE_RPC || 'https://base.llamarpc.com'
    };

    const contractAddress = process.env.CONTRACT_ADDRESS || '0x'; // Should be set in env

    for (const [network, rpcUrl] of Object.entries(networks)) {
      try {
        this.providers[network] = new ethers.JsonRpcProvider(rpcUrl);
        this.contracts[network] = new ethers.Contract(
          contractAddress,
          this.CONTRACT_ABI,
          this.providers[network]
        );
        console.log(`🔗 Connected to ${network} network`);
      } catch (error) {
        console.error(`Failed to connect to ${network}:`, error);
      }
    }
  }

  /**
   * Setup blockchain event listeners
   */
  private setupEventListeners(): void {
    for (const [network, contract] of Object.entries(this.contracts)) {
      contract.on('PaymentProcessed', async (modelId, payer, amount, inputHash, timestamp, event) => {
        const payment: PaymentEvent = { 
          modelId, 
          payer, 
          amount: amount.toString(), 
          inputHash, 
          timestamp: timestamp.toNumber(), 
          txHash: event.transactionHash 
        };
        
        await this.processPayment(payment, network);
      });
      
      console.log(`👂 Listening for events on ${network}`);
    }
  }

  /**
   * Process and record a payment event
   * @param payment - Payment event data
   * @param network - Blockchain network
   */
  async processPayment(payment: PaymentEvent, network: string): Promise<void> {
    try {
      // Store payment in Redis with TTL
      const paymentKey = `payment:${payment.txHash}`;
      await this.redis.setEx(paymentKey, 86400 * 30, JSON.stringify({
        ...payment,
        network,
        processedAt: Date.now()
      }));

      // Update analytics
      this.updateAnalytics(payment);

      // Store for reputation system
      const reputationKey = `payment:${payment.timestamp}:${payment.payer}`;
      await this.redis.setEx(reputationKey, 86400 * 30, JSON.stringify({
        modelId: payment.modelId,
        amount: payment.amount,
        success: true,
        timestamp: payment.timestamp
      }));

      console.log(`💳 Processed payment: ${payment.txHash} (${payment.amount} tokens)`);
    } catch (error) {
      console.error('Error processing payment:', error);
    }
  }

  /**
   * Update internal analytics
   * @param payment - Payment event
   */
  private updateAnalytics(payment: PaymentEvent): void {
    this.analytics.totalPayments++;
    this.analytics.totalRevenue = (parseFloat(this.analytics.totalRevenue) + parseFloat(payment.amount)).toString();
    this.analytics.uniqueUsers.add(payment.payer);
    
    // Keep last 1000 payments
    this.analytics.recentPayments.push(payment);
    if (this.analytics.recentPayments.length > 1000) {
      this.analytics.recentPayments.shift();
    }
  }

  /**
   * Validate payment request
   * @param modelId - API model identifier
   * @param payer - Payer address
   * @param amount - Payment amount
   * @param network - Target network
   * @returns Validation result
   */
  async validatePayment(
    modelId: string, 
    payer: string, 
    amount: string,
    network: string = 'polygon'
  ): Promise<PaymentValidationResult> {
    try {
      const contract = this.contracts[network];
      if (!contract) {
        return { valid: false, reason: 'Network not supported' };
      }

      // Get model information
      const model = await contract.getModel(modelId);
      if (!model.owner || model.owner === ethers.ZeroAddress) {
        return { valid: false, reason: 'Model not found' };
      }

      if (!model.active) {
        return { valid: false, reason: 'Model is inactive' };
      }

      if (parseFloat(amount) < parseFloat(model.price.toString())) {
        return { valid: false, reason: 'Insufficient payment amount' };
      }

      // Check user balance (optional - could use permit instead)
      const userBalance = await contract.getUserBalance(payer, model.token);
      const hasBalance = parseFloat(userBalance.toString()) >= parseFloat(amount);

      // Estimate gas for the transaction
      const gasEstimate = '150000'; // Estimated gas limit

      return {
        valid: true,
        reason: hasBalance ? 'Using prepaid balance' : 'Will use permit/signature',
        gasEstimate
      };
    } catch (error) {
      console.error('Payment validation error:', error);
      return { valid: false, reason: 'Validation failed' };
    }
  }

  /**
   * Get payment analytics
   * @returns Current analytics data
   */
  getAnalytics(): {
    totalPayments: number;
    totalRevenue: string;
    uniqueUsers: number;
    avgPaymentSize: string;
    recentPaymentsCount: number;
  } {
    const avgPaymentSize = this.analytics.totalPayments > 0 
      ? (parseFloat(this.analytics.totalRevenue) / this.analytics.totalPayments).toFixed(6)
      : '0';

    return {
      totalPayments: this.analytics.totalPayments,
      totalRevenue: this.analytics.totalRevenue,
      uniqueUsers: this.analytics.uniqueUsers.size,
      avgPaymentSize,
      recentPaymentsCount: this.analytics.recentPayments.length
    };
  }

  /**
   * Get recent payments
   * @param limit - Maximum number of payments to return
   * @returns Array of recent payments
   */
  getRecentPayments(limit: number = 50): PaymentEvent[] {
    return this.analytics.recentPayments
      .slice(-limit)
      .reverse(); // Most recent first
  }

  /**
   * Get payment by transaction hash
   * @param txHash - Transaction hash
   * @returns Payment data or null
   */
  async getPayment(txHash: string): Promise<PaymentEvent | null> {
    try {
      const paymentData = await this.redis.get(`payment:${txHash}`);
      return paymentData ? JSON.parse(paymentData) : null;
    } catch (error) {
      console.error('Error getting payment:', error);
      return null;
    }
  }

  /**
   * Get payments for a specific user
   * @param userAddress - User address
   * @param limit - Maximum number of payments
   * @returns Array of user payments
   */
  async getUserPayments(userAddress: string, limit: number = 20): Promise<PaymentEvent[]> {
    try {
      const keys = await this.redis.keys(`payment:*:${userAddress}`);
      const payments: PaymentEvent[] = [];

      for (const key of keys.slice(0, limit)) {
        const paymentData = await this.redis.get(key);
        if (paymentData) {
          payments.push(JSON.parse(paymentData));
        }
      }

      return payments.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error getting user payments:', error);
      return [];
    }
  }

  /**
   * Get network health status
   * @returns Network status for all connected chains
   */
  async getNetworkStatus(): Promise<{ [network: string]: { connected: boolean; blockNumber?: number; error?: string } }> {
    const status: { [network: string]: { connected: boolean; blockNumber?: number; error?: string } } = {};

    for (const [network, provider] of Object.entries(this.providers)) {
      try {
        const blockNumber = await provider.getBlockNumber();
        status[network] = { connected: true, blockNumber };
      } catch (error) {
        status[network] = { 
          connected: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    }

    return status;
  }

  /**
   * Get model information from blockchain
   * @param modelId - Model identifier
   * @param network - Target network
   * @returns Model data
   */
  async getModel(modelId: string, network: string = 'polygon'): Promise<any> {
    try {
      const contract = this.contracts[network];
      if (!contract) {
        throw new Error('Network not supported');
      }

      const model = await contract.getModel(modelId);
      return {
        owner: model.owner,
        endpoint: model.endpoint,
        price: model.price.toString(),
        token: model.token,
        active: model.active,
        totalCalls: model.totalCalls.toString(),
        totalRevenue: model.totalRevenue.toString()
      };
    } catch (error) {
      console.error('Error getting model:', error);
      throw error;
    }
  }

  /**
   * Check user balances across all supported tokens
   * @param userAddress - User address
   * @param network - Target network
   * @returns Balance information
   */
  async getUserBalances(userAddress: string, network: string = 'polygon'): Promise<{ [token: string]: string }> {
    try {
      const contract = this.contracts[network];
      if (!contract) {
        throw new Error('Network not supported');
      }

      const balances: { [token: string]: string } = {};
      
      // Common stablecoin addresses (this should be configurable)
      const tokens = {
        'USDC': '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174', // Polygon USDC
        'USDT': '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'  // Polygon USDT
      };

      for (const [symbol, address] of Object.entries(tokens)) {
        try {
          const balance = await contract.getUserBalance(userAddress, address);
          balances[symbol] = balance.toString();
        } catch (error) {
          balances[symbol] = '0';
        }
      }

      return balances;
    } catch (error) {
      console.error('Error getting user balances:', error);
      return {};
    }
  }

  /**
   * Close Redis connection and cleanup
   */
  async close(): Promise<void> {
    // Remove event listeners
    for (const contract of Object.values(this.contracts)) {
      contract.removeAllListeners();
    }

    await this.redis.disconnect();
    console.log('🔌 PaymentService disconnected');
  }
} 