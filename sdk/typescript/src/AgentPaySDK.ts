import { ethers } from 'ethers';
import { AttributionModule, type Attribution } from './AttributionModule';
import { ReputationModule, type ReputationData } from './ReputationModule';

/**
 * @fileoverview Main AgentPayy SDK - Orchestrates all payment and agent functionality
 * @author AgentPayy Team
 * @version 2.0.0
 */

export interface PaymentOptions {
  price: string;
  deadline?: number;
  mock?: boolean;
  useBalance?: boolean;
  gasless?: boolean;
  chain?: string;
  attributions?: Attribution[];
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  receipt?: any;
  error?: string;
  gasUsed?: string;
}

export interface WalletConfig {
  smart?: boolean;
  provider?: ethers.Provider;
  chainId?: number;
}

/**
 * Main AgentPayy SDK for payments, attribution, and reputation
 */
export class AgentPayySDK {
  private gatewayUrl: string;
  private wallet: ethers.HDNodeWallet | ethers.Wallet | null = null;
  private provider: ethers.Provider | null = null;

  // Specialized modules
  public attribution: AttributionModule;
  public reputation: ReputationModule;

  constructor(gatewayUrl: string = 'http://localhost:3000') {
    this.gatewayUrl = gatewayUrl.replace(/\/$/, ''); // Remove trailing slash
    
    // Initialize modules
    this.attribution = new AttributionModule(this.gatewayUrl);
    this.reputation = new ReputationModule(this.gatewayUrl);
  }

  /**
   * Generate a new wallet for payments
   * @param config - Wallet configuration
   * @returns Generated wallet details
   */
  async generateWallet(config: WalletConfig = {}): Promise<{
    address: string;
    privateKey: string;
    mnemonic?: string;
    smart: boolean;
  }> {
    if (config.smart) {
      // For smart wallets, we'd integrate with account abstraction
      // For now, return a regular wallet with smart flag
      console.log('🔄 Smart wallet support coming soon, using regular wallet');
    }

    this.wallet = ethers.Wallet.createRandom();
    
    if (config.provider) {
      this.provider = config.provider;
      this.wallet = this.wallet.connect(this.provider);
    }

    const result: {
      address: string;
      privateKey: string;
      mnemonic?: string;
      smart: boolean;
    } = {
      address: this.wallet.address,
      privateKey: this.wallet.privateKey,
      smart: config.smart || false
    };
    
    if ('mnemonic' in this.wallet && this.wallet.mnemonic?.phrase) {
      result.mnemonic = this.wallet.mnemonic.phrase;
    }
    
    return result;
  }

  /**
   * Connect existing wallet
   * @param privateKey - Wallet private key
   * @param config - Wallet configuration
   * @returns Connected wallet details
   */
  async connectWallet(privateKey: string, config: WalletConfig = {}): Promise<{
    address: string;
    smart: boolean;
  }> {
    this.wallet = new ethers.Wallet(privateKey);
    
    if (config.provider) {
      this.provider = config.provider;
      this.wallet = this.wallet.connect(this.provider);
    }

    return {
      address: this.wallet.address,
      smart: config.smart || false
    };
  }

  /**
   * Pay for API access with basic payment
   * @param modelId - API model identifier
   * @param input - Input data for the API
   * @param options - Payment options
   * @returns Payment result
   */
  async pay(modelId: string, input: any, options: PaymentOptions): Promise<PaymentResult> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet connected. Use generateWallet() or connectWallet()');
      }

      // If attributions are specified, use attribution module
      if (options.attributions && options.attributions.length > 0) {
        const result = await this.attribution.payWithAttribution(modelId, input, options.attributions, options);
        const paymentResult: PaymentResult = {
          success: result.success
        };
        
        if (result.txHash) {
          paymentResult.txHash = result.txHash;
        }
        
        if (result.error) {
          paymentResult.error = result.error;
        }
        
        return paymentResult;
      }

      const inputHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(input)));
      const deadline = options.deadline || Math.floor(Date.now() / 1000) + 3600; // 1 hour

      if (options.mock) {
        return this.mockPayment(modelId, options.price);
      }

      // Validate payment first
      const validation = await this.validatePayment(modelId, this.wallet.address, options.price, options.chain);
      
      if (!validation.valid) {
        throw new Error(validation.reason || 'Payment validation failed');
      }

      // Process payment through gateway
      const response = await fetch(`${this.gatewayUrl}/payment/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          payer: this.wallet.address,
          inputHash,
          amount: options.price,
          deadline,
          chain: options.chain || 'polygon',
          useBalance: options.useBalance,
          gasless: options.gasless
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Payment failed');
      }

      return {
        success: true,
        txHash: result.txHash,
        receipt: result.receipt,
        gasUsed: result.gasUsed
      };
    } catch (error) {
      console.error('Payment error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate payment before processing
   * @param modelId - API model identifier
   * @param payer - Payer address
   * @param amount - Payment amount
   * @param network - Target network
   * @returns Validation result
   */
  async validatePayment(modelId: string, payer: string, amount: string, network?: string): Promise<{
    valid: boolean;
    reason?: string;
    gasEstimate?: string;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/payment/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          payer,
          amount,
          network: network || 'polygon'
        })
      });

      if (!response.ok) {
        throw new Error('Validation request failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Validation error:', error);
      return {
        valid: false,
        reason: 'Validation failed'
      };
    }
  }

  /**
   * Get user balances across supported tokens
   * @param address - User address (optional, uses connected wallet)
   * @param network - Target network
   * @returns Balance information
   */
  async getBalances(address?: string, network?: string): Promise<{ [token: string]: string }> {
    try {
      const userAddress = address || (this.wallet ? this.wallet.address : null);
      
      if (!userAddress) {
        throw new Error('No address provided and no wallet connected');
      }

      const response = await fetch(
        `${this.gatewayUrl}/balances/${userAddress}${network ? `?network=${network}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to get balances');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting balances:', error);
      return {};
    }
  }

  /**
   * Get payment history for user
   * @param address - User address (optional, uses connected wallet)
   * @param limit - Maximum number of payments to return
   * @returns Array of payment history
   */
  async getPaymentHistory(address?: string, limit?: number): Promise<Array<{
    txHash: string;
    modelId: string;
    amount: string;
    timestamp: number;
    status: string;
  }>> {
    try {
      const userAddress = address || (this.wallet ? this.wallet.address : null);
      
      if (!userAddress) {
        throw new Error('No address provided and no wallet connected');
      }

      const response = await fetch(
        `${this.gatewayUrl}/payments/${userAddress}${limit ? `?limit=${limit}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Failed to get payment history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Get information about an API model
   * @param modelId - Model identifier
   * @param network - Target network
   * @returns Model information
   */
  async getModel(modelId: string, network?: string): Promise<{
    owner: string;
    endpoint: string;
    price: string;
    token: string;
    active: boolean;
    totalCalls: string;
    totalRevenue: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.gatewayUrl}/models/${modelId}${network ? `?network=${network}` : ''}`
      );

      if (!response.ok) {
        throw new Error('Model not found');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting model:', error);
      return null;
    }
  }

  /**
   * Mock payment for testing
   * @param modelId - Model identifier
   * @param amount - Payment amount
   * @returns Mock payment result
   */
  private mockPayment(modelId: string, amount: string): Promise<PaymentResult> {
    console.log(`🧪 MOCK: Payment of ${amount} tokens for model ${modelId}`);
    console.log(`   ✅ Transaction simulated successfully`);
    
    return Promise.resolve({
      success: true,
      txHash: `0x${ethers.hexlify(ethers.randomBytes(32)).slice(2)}`,
      gasUsed: '150000'
    });
  }

  /**
   * Get gateway health status
   * @returns Gateway health information
   */
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    version: string;
    services: string[];
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/health`);
      
      if (!response.ok) {
        throw new Error('Gateway unavailable');
      }

      return await response.json();
    } catch (error) {
      console.error('Health check error:', error);
      return {
        status: 'unavailable',
        timestamp: new Date().toISOString(),
        version: 'unknown',
        services: []
      };
    }
  }

  /**
   * Get platform analytics
   * @returns Platform analytics data
   */
  async getAnalytics(): Promise<{
    totalPayments: number;
    totalRevenue: string;
    uniqueUsers: number;
    avgPaymentSize: string;
    networks: any;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/analytics`);
      
      if (!response.ok) {
        throw new Error('Failed to get analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics error:', error);
      return {
        totalPayments: 0,
        totalRevenue: '0',
        uniqueUsers: 0,
        avgPaymentSize: '0',
        networks: {}
      };
    }
  }

  /**
   * Get connected wallet address
   * @returns Wallet address or null if not connected
   */
  getWalletAddress(): string | null {
    return this.wallet ? this.wallet.address : null;
  }

  /**
   * Check if wallet is connected
   * @returns Whether a wallet is connected
   */
  isWalletConnected(): boolean {
    return this.wallet !== null;
  }

  /**
   * Disconnect wallet
   */
  disconnectWallet(): void {
    this.wallet = null;
    this.provider = null;
    console.log('🔌 Wallet disconnected');
  }

  // === API DISCOVERY METHODS ===

  /**
   * Get APIs by category
   * @param category - API category to filter by
   * @returns Array of APIs in the specified category
   */
  async getAPIsByCategory(category: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.gatewayUrl}/registry/category/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error('Failed to get APIs by category');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting APIs by category:', error);
      return [];
    }
  }

  /**
   * Search APIs by tag
   * @param tag - Tag to search for
   * @returns Array of APIs matching the tag
   */
  async searchAPIsByTag(tag: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.gatewayUrl}/registry/search?tag=${encodeURIComponent(tag)}`);
      
      if (!response.ok) {
        throw new Error('Failed to search APIs by tag');
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching APIs by tag:', error);
      return [];
    }
  }

  /**
   * Get marketplace statistics
   * @returns Marketplace statistics
   */
  async getMarketplaceStats(): Promise<{
    totalAPIs: number;
    totalCategories: number;
    totalDevelopers: number;
    totalCalls: number;
    totalRevenue: string;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/registry/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to get marketplace stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting marketplace stats:', error);
      return {
        totalAPIs: 0,
        totalCategories: 0,
        totalDevelopers: 0,
        totalCalls: 0,
        totalRevenue: '0'
      };
    }
  }

  /**
   * Get trending APIs
   * @param limit - Maximum number of APIs to return
   * @returns Array of trending APIs
   */
  async getTrendingAPIs(limit: number = 10): Promise<any[]> {
    try {
      const response = await fetch(`${this.gatewayUrl}/registry/trending?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to get trending APIs');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting trending APIs:', error);
      return [];
    }
  }

  /**
   * Register API model for discovery
   * @param config - API configuration
   * @returns Registration result
   */
  async registerModel(config: {
    modelId: string;
    endpoint: string;
    price: string;
    category?: string;
    tags?: string[];
    description?: string;
  }): Promise<{
    success: boolean;
    txHash?: string;
    error?: string;
  }> {
    try {
      if (!this.wallet) {
        throw new Error('No wallet connected. Use generateWallet() or connectWallet()');
      }

      const response = await fetch(`${this.gatewayUrl}/registry/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...config,
          owner: this.wallet.address
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      return {
        success: true,
        txHash: result.txHash
      };
    } catch (error) {
      console.error('Model registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 