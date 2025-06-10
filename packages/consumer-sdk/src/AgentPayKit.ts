import { ethers, Contract } from 'ethers';
import axios from 'axios';
import {
  getContractAddress,
  getUSDCAddress,
  CONTRACT_ABI,
  createInputHash,
  createPaymentProof,
  prepareSmartWalletPayment,
  preparePermitPayment,
  parseAmount,
  formatAmount
} from '@agentpay/core';
import type {
  PaymentOptions,
  ModelConfig,
  WalletInfo,
  WalletConnectionOptions,
  ChainType,
  PaymentData,
  FinancialOverview,
  PaymentProof
} from '@agentpay/core';
import { UniversalWalletAdapter } from './wallet/UniversalWalletAdapter';
import { PaymentService } from './services/PaymentService';
import { BalanceService } from './services/BalanceService';

export interface AgentConfig {
  name?: string;
  description?: string;
  endpoints?: ModelConfig[];
  walletOptions?: WalletConnectionOptions;
}

export class AgentPayKit {
  private walletAdapter: UniversalWalletAdapter;
  private wallet?: WalletInfo;
  private gatewayUrl: string;
  private contract?: Contract;
  private paymentService: PaymentService;
  private balanceService: BalanceService;

  constructor(gatewayUrl: string = 'http://localhost:3000') {
    this.walletAdapter = new UniversalWalletAdapter();
    this.gatewayUrl = gatewayUrl;
    this.paymentService = new PaymentService(gatewayUrl);
    this.balanceService = new BalanceService();
  }

  // === WALLET MANAGEMENT ===

  /**
   * Generate new wallet with smart account capabilities
   */
  async generateWallet(options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    console.log('🔑 Generating new wallet...');
    
    this.wallet = await this.walletAdapter.generateWallet({
      smart: true,
      provider: 'biconomy',
      features: ['gasless', 'batching'],
      ...options
    });

    this.setupContract();
    
    console.log(`✅ Wallet generated!`);
    console.log(`Address: ${this.wallet.address}`);
    console.log(`Type: ${this.wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`);
    
    return this.wallet;
  }

  /**
   * Connect existing wallet (BYOW)
   */
  async connectWallet(type: 'metamask' | 'coinbase' | 'walletconnect', options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    console.log(`🔌 Connecting ${type} wallet...`);
    
    this.wallet = await this.walletAdapter.connectWallet(type, options);
    this.setupContract();
    
    console.log(`✅ ${type} wallet connected!`);
    console.log(`Address: ${this.wallet.address}`);
    
    return this.wallet;
  }

  /**
   * Import wallet from private key
   */
  async importWallet(privateKey: string, options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    console.log('📥 Importing wallet...');
    
    this.wallet = await this.walletAdapter.importWallet(privateKey, options);
    this.setupContract();
    
    console.log(`✅ Wallet imported!`);
    console.log(`Address: ${this.wallet.address}`);
    
    return this.wallet;
  }

  /**
   * Get current wallet info
   */
  getWalletInfo(): WalletInfo | undefined {
    return this.wallet;
  }

  // === AGENT SETUP ===

  /**
   * Setup agent (register APIs and configure wallet)
   */
  async setupAgent(config: AgentConfig): Promise<{
    wallet: WalletInfo;
    registeredApis: string[];
    balance: string;
  }> {
    console.log(`🤖 Setting up agent: ${config.name || 'Unnamed Agent'}`);
    
    if (!this.wallet) {
      await this.generateWallet(config.walletOptions);
    }

    const registeredApis: string[] = [];
    if (config.endpoints) {
      for (const endpoint of config.endpoints) {
        try {
          await this.registerModel(endpoint);
          registeredApis.push(endpoint.modelId);
          console.log(`✅ Registered API: ${endpoint.modelId}`);
        } catch (error) {
          console.warn(`❌ Failed to register ${endpoint.modelId}:`, error);
        }
      }
    }

    const balance = await this.getUserBalance();
    
    console.log(`🚀 Agent setup complete!`);
    console.log(`APIs registered: ${registeredApis.length}`);
    console.log(`Current balance: $${balance} USDC`);
    
    return {
      wallet: this.wallet!,
      registeredApis,
      balance
    };
  }

  // === API INTERACTION ===

  /**
   * Universal payment method with smart routing
   */
  async payAndCall(modelId: string, input: any, options: PaymentOptions): Promise<any> {
    if (!this.wallet) throw new Error('No wallet connected. Call generateWallet() or connectWallet() first.');
    
    if (options.mock) {
      return this.paymentService.mockAPICall(modelId, input);
    }

    // Smart routing based on wallet capabilities
    if (this.wallet.isSmartAccount && options.gasless !== false) {
      return await this.paymentService.payWithSmartAccount(modelId, input, options, this.wallet);
    } else {
      const hasBalance = await this.balanceService.checkUserBalance(options.price, this.getChain());
      if (hasBalance && options.useBalance !== false) {
        return await this.paymentService.payWithBalance(modelId, input, options);
      } else {
        return await this.paymentService.payWithPermit(modelId, input, options);
      }
    }
  }

  /**
   * Call API with direct endpoint (creates payment proof)
   */
  async callAPI(endpoint: string, input: any, options: PaymentOptions): Promise<any> {
    if (!this.wallet) throw new Error('No wallet connected');

    // Create payment proof
    const inputHash = createInputHash(input);
    const timestamp = Date.now();
    const paymentHash = ethers.solidityKeccak256(
      ['string', 'address', 'uint256', 'uint256'],
      [endpoint, this.wallet.address, parseAmount(options.price), timestamp]
    );

    // Sign payment proof
    const signature = await this.wallet.client.signMessage(ethers.getBytes(paymentHash));
    
    const paymentProof = createPaymentProof(
      paymentHash,
      signature,
      this.wallet.address,
      parseAmount(options.price),
      timestamp
    );

    // Make HTTP request with payment proof
    const response = await axios.post(endpoint, input, {
      headers: {
        'X-AgentPay-Proof': JSON.stringify(paymentProof),
        'X-User-Wallet': this.wallet.address,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    return response.data;
  }

  /**
   * Batch multiple API calls (smart accounts only)
   */
  async batchPayAndCall(calls: Array<{
    modelId: string;
    input: any;
    options: PaymentOptions;
  }>): Promise<any[]> {
    if (!this.wallet?.features.batchTransactions) {
      throw new Error('Batch transactions not supported. Use smart account.');
    }

    console.log(`📦 Batching ${calls.length} API calls...`);
    
    const results = [];
    for (const call of calls) {
      const result = await this.payAndCall(call.modelId, call.input, call.options);
      results.push(result);
    }
    
    return results;
  }

  // === BALANCE MANAGEMENT ===

  /**
   * Deposit to prepaid balance
   */
  async depositBalance(amount: string, tokenAddress?: string): Promise<string> {
    this.setupBalance();
    return this.balanceService.depositBalance(amount, tokenAddress, this.getChain());
  }

  /**
   * Get user's prepaid balance
   */
  async getUserBalance(userAddress?: string, tokenAddress?: string): Promise<string> {
    this.setupBalance();
    return this.balanceService.getUserBalance(userAddress, tokenAddress, this.getChain());
  }

  /**
   * Check if user has sufficient balance
   */
  async checkUserBalance(requiredAmount: string): Promise<boolean> {
    this.setupBalance();
    return this.balanceService.checkUserBalance(requiredAmount, this.getChain());
  }

  /**
   * Withdraw from prepaid balance
   */
  async withdrawBalance(amount: string, tokenAddress?: string): Promise<string> {
    this.setupBalance();
    return this.balanceService.withdrawBalance(amount, tokenAddress, this.getChain());
  }

  // === API PROVIDER FUNCTIONS ===

  /**
   * Register API endpoint
   */
  async registerModel(config: ModelConfig): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');
    
    console.log(`📝 Registering API: ${config.modelId}`);
    
    const price = parseAmount(config.price);
    const token = config.token || getUSDCAddress(this.getChain());
    
    const tx = await this.contract!.registerModel(config.modelId, config.endpoint, price, token);
    return tx.hash;
  }

  /**
   * Get earnings from API sales
   */
  async getEarnings(tokenAddress?: string): Promise<string> {
    this.setupBalance();
    return this.balanceService.getEarnings(tokenAddress, this.getChain());
  }

  /**
   * Withdraw earnings
   */
  async withdrawEarnings(tokenAddress?: string): Promise<string> {
    this.setupBalance();
    return this.balanceService.withdrawEarnings(tokenAddress, this.getChain());
  }

  // === FINANCIAL OVERVIEW ===

  /**
   * Get complete financial overview
   */
  async getFinancialOverview(): Promise<FinancialOverview> {
    this.setupBalance();
    return this.balanceService.getFinancialOverview(this.getChain());
  }

  // === PRIVATE METHODS ===

  private setupContract() {
    if (!this.wallet) return;
    
    const contractAddress = getContractAddress(this.getChain());
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.wallet.client);
  }

  private setupBalance() {
    if (!this.contract || !this.wallet) {
      this.setupContract();
    }
    this.balanceService.updateContract(this.contract!, this.wallet!);
  }

  private getChain(): ChainType {
    return 'base'; // Default to base for now
  }
} 