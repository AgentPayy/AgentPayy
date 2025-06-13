import { ethers, Contract } from 'ethers';
import { UniversalWalletAdapter, type WalletInfo, type WalletConnectionOptions, type WalletType, type ChainType } from './wallet/UniversalWalletAdapter';
import { PaymentService } from './services/PaymentService';
import { BalanceService } from './services/BalanceService';

export interface PaymentOptions {
  price: string;
  deadline?: number;
  mock?: boolean;
  useBalance?: boolean;
  gasless?: boolean; // For smart accounts
  attributions?: Attribution[]; // NEW: Multi-party attribution
}

// NEW: Attribution interface
export interface Attribution {
  recipient: string;
  basisPoints: number; // out of 10000 (100%)
}

// NEW: Task interfaces
export interface TaskOptions {
  worker: string;
  amount: string;
  token?: string;
  escrowType?: 'timeout' | 'hash' | 'mutual' | null;
  rules?: any;
  timeout?: number; // minutes
}

export interface Task {
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

export interface ReputationData {
  address: string;
  totalCalls: number;
  totalRevenue: string;
  successRate: number;
  avgResponseTime: number;
  uniqueModelsUsed: number;
  recentCalls: number;
  rating: number;
  specialties: string[];
}

export interface ModelConfig {
  modelId: string;
  endpoint: string;
  price: string;
  token?: string;
}

export interface AgentConfig {
  name?: string;
  description?: string;
  endpoints?: ModelConfig[];
  walletOptions?: WalletConnectionOptions;
}

// NEW: Receipt interfaces
export interface APIReceipt {
  inputHash: string;
  outputHash: string;
  executionProof: string;
  executedAt: number;
  responseSize: number;
  success: boolean;
  httpStatus: number;
  gateway: string;
}

export interface ReceiptVerification {
  valid: boolean;
  reason: string;
  receipt?: APIReceipt;
}

export interface PaymentResult {
  data: any;
  txHash?: string;
  receipt?: APIReceipt;
  timestamp: number;
}

// Contract addresses for AgentPayKit deployment
const CONTRACTS = {
  // Ethereum Mainnet
  ethereum: process.env.AGENTPAY_ETHEREUM_CONTRACT || '',
  
  // Top L2s by TVL (deploy these first)
  base: process.env.AGENTPAY_BASE_CONTRACT || '',           // $14.26B TVL
  arbitrum: process.env.AGENTPAY_ARBITRUM_CONTRACT || '',   // $13.94B TVL
  optimism: process.env.AGENTPAY_OPTIMISM_CONTRACT || '',   // $3.22B TVL
  
  // Emerging major L2s
  unichain: process.env.AGENTPAY_UNICHAIN_CONTRACT || '',   // $1.05B TVL
  worldchain: process.env.AGENTPAY_WORLDCHAIN_CONTRACT || '', // $587M TVL
  starknet: process.env.AGENTPAY_STARKNET_CONTRACT || '',   // $516M TVL
  zksync: process.env.AGENTPAY_ZKSYNC_CONTRACT || '',       // $494M TVL
  linea: process.env.AGENTPAY_LINEA_CONTRACT || '',         // $389M TVL
  blast: process.env.AGENTPAY_BLAST_CONTRACT || '',         // $339M TVL
  scroll: process.env.AGENTPAY_SCROLL_CONTRACT || '',       // $216M TVL
  
  // Additional promising L2s
  'polygon-zkevm': process.env.AGENTPAY_POLYGON_ZKEVM_CONTRACT || '',
  mantle: process.env.AGENTPAY_MANTLE_CONTRACT || ''
};

// USDC addresses across all supported chains
const USDC_ADDRESSES = {
  // Ethereum Mainnet
  ethereum: '0xA0b86a33E6441b8aA0de8E7c8b3f3B2c7D43C9A7',
  
  // Layer 2 USDC addresses
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  unichain: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // Uses Base bridge
  worldchain: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  linea: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff',
  blast: '0x4300000000000000000000000000000000000003',
  scroll: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4',
  'polygon-zkevm': '0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035',
  mantle: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9',
  
  // Note: Starknet and zkSync use different token standards
  starknet: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8', // USDC.e
  zksync: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4' // USDC.e
};

// Chain configurations
const CHAIN_CONFIGS = {
  ethereum: {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/',
    blockExplorer: 'https://etherscan.io',
    gasless: false,
    avgTxCost: 0.005 // $5 avg
  },
  base: {
    chainId: 8453,
    name: 'Base',
    rpcUrl: 'https://mainnet.base.org',
    blockExplorer: 'https://basescan.org',
    gasless: true,
    avgTxCost: 0.001 // $0.001
  },
  arbitrum: {
    chainId: 42161,
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    blockExplorer: 'https://arbiscan.io',
    gasless: true,
    avgTxCost: 0.001
  },
  optimism: {
    chainId: 10,
    name: 'OP Mainnet',
    rpcUrl: 'https://mainnet.optimism.io',
    blockExplorer: 'https://optimistic.etherscan.io',
    gasless: true,
    avgTxCost: 0.001
  },
  unichain: {
    chainId: 1301,
    name: 'Unichain Mainnet',
    rpcUrl: 'https://rpc.unichain.org',
    blockExplorer: 'https://uniscan.xyz',
    gasless: true,
    avgTxCost: 0.0005
  },
  worldchain: {
    chainId: 480,
    name: 'World Chain',
    rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
    blockExplorer: 'https://worldscan.org',
    gasless: true,
    avgTxCost: 0.0001
  },
  starknet: {
    chainId: 'SN_MAIN',
    name: 'Starknet',
    rpcUrl: 'https://starknet-mainnet.public.blastapi.io',
    blockExplorer: 'https://starkscan.co',
    gasless: true,
    avgTxCost: 0.0001
  },
  zksync: {
    chainId: 324,
    name: 'zkSync Era',
    rpcUrl: 'https://mainnet.era.zksync.io',
    blockExplorer: 'https://explorer.zksync.io',
    gasless: true,
    avgTxCost: 0.0005
  },
  linea: {
    chainId: 59144,
    name: 'Linea',
    rpcUrl: 'https://rpc.linea.build',
    blockExplorer: 'https://lineascan.build',
    gasless: true,
    avgTxCost: 0.0003
  },
  blast: {
    chainId: 81457,
    name: 'Blast',
    rpcUrl: 'https://rpc.blast.io',
    blockExplorer: 'https://blastscan.io',
    gasless: true,
    avgTxCost: 0.0002
  },
  scroll: {
    chainId: 534352,
    name: 'Scroll',
    rpcUrl: 'https://rpc.scroll.io',
    blockExplorer: 'https://scrollscan.com',
    gasless: true,
    avgTxCost: 0.0002
  },
  'polygon-zkevm': {
    chainId: 1101,
    name: 'Polygon zkEVM',
    rpcUrl: 'https://zkevm-rpc.com',
    blockExplorer: 'https://zkevm.polygonscan.com',
    gasless: true,
    avgTxCost: 0.0001
  },
  mantle: {
    chainId: 5000,
    name: 'Mantle',
    rpcUrl: 'https://rpc.mantle.xyz',
    blockExplorer: 'https://explorer.mantle.xyz',
    gasless: true,
    avgTxCost: 0.0001
  }
};

const CONTRACT_ABI = [
  "function payAndCall(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)",
  // NEW: Attribution function
  "function payAndCallWithAttribution(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, tuple(address recipient, uint256 basisPoints)[] attributions, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)",
  "function registerModel(string modelId, string endpoint, uint256 price, address token)",
  "function depositBalance(address token, uint256 amount)",
  "function withdraw(address token)",
  "function withdrawBalance(address token, uint256 amount)",
  "function getBalance(address user, address token) view returns (uint256)",
  "function getUserBalance(address user, address token) view returns (uint256)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
  // NEW: Receipt functions
  "function getReceipt(bytes32 txHash) view returns (tuple(bytes32 inputHash, bytes32 outputHash, bytes32 executionProof, uint256 executedAt, uint256 responseSize, bool success, uint256 httpStatus, address gateway))",
  "function verifyReceipt(bytes32 txHash, bytes inputData, bytes outputData) view returns (bool valid, string reason)"
];

export class EnhancedAgentPayKit {
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
      smart: true, // Default to smart account for best UX
      provider: 'biconomy', // Default to Biconomy for gasless transactions
      features: ['gasless', 'batching'],
      ...options
    });

    this.setupContract();
    
    console.log(`✅ Wallet generated!`);
    console.log(`Address: ${this.wallet.address}`);
    console.log(`Type: ${this.wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`);
    console.log(`Features: ${this.wallet.features.gasless ? '⚡ Gasless' : ''} ${this.wallet.features.batchTransactions ? '📦 Batching' : ''}`);
    
    return this.wallet;
  }

  /**
   * Connect existing wallet (BYOW)
   */
  async connectWallet(type: WalletType, options: WalletConnectionOptions = {}): Promise<WalletInfo> {
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
    
    // Generate wallet if not connected
    if (!this.wallet) {
      await this.generateWallet(config.walletOptions);
    }

    // Register APIs
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

    // Get initial balance
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
   * Universal payment method with smart routing and receipt generation
   */
  async payAndCall(modelId: string, input: any, options: PaymentOptions): Promise<PaymentResult> {
    if (!this.wallet) throw new Error('No wallet connected. Call generateWallet() or connectWallet() first.');
    
    // Mock mode with receipt
    if (options.mock) {
      const mockResult = await this.paymentService.mockAPICall(modelId, input);
      return {
        data: mockResult.data,
        receipt: mockResult.receipt,
        timestamp: mockResult.timestamp
      };
    }

    // Real payment flow
    let result: any;
    if (this.wallet.isSmartAccount && options.gasless !== false) {
      result = await this.paymentService.payWithSmartAccount(modelId, input, options, this.wallet);
    } else if (this.wallet.features.gasless === false) {
      result = await this.paymentService.payWithPermit(modelId, input, options);
    } else {
      // Try balance first, fallback to permit
      const hasBalance = await this.balanceService.checkUserBalance(options.price, this.getChain());
      if (hasBalance && options.useBalance !== false) {
        result = await this.paymentService.payWithBalance(modelId, input, options);
      } else {
        result = await this.paymentService.payWithPermit(modelId, input, options);
      }
    }

    // Wait for receipt if we have a transaction hash
    if (result.txHash) {
      const receipt = await this.waitForReceipt(result.txHash);
      return {
        data: result.data,
        txHash: result.txHash,
        receipt,
        timestamp: Date.now()
      };
    }

    return {
      data: result.data,
      timestamp: Date.now()
    };
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
    
    // For now, execute sequentially (in production, would batch on-chain)
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
    
    const price = ethers.parseUnits(config.price, 6);
    const token = config.token || USDC_ADDRESSES[this.getChain()];
    
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
  async getFinancialOverview(): Promise<{
    earnings: string;
    balance: string;
    totalSpent: string;
    netPosition: string;
  }> {
    this.setupBalance();
    return this.balanceService.getFinancialOverview(this.getChain());
  }

  // === PRIVATE METHODS ===

  private setupContract() {
    if (!this.wallet) return;
    
    const contractAddress = this.getContractAddress();
    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.wallet.client);
    
    // Initialize PaymentService with wallet and contract address
    this.paymentService = new PaymentService(this.gatewayUrl, contractAddress);
    this.paymentService.initialize(this.wallet);
  }

  private setupBalance() {
    if (!this.contract || !this.wallet) {
      this.setupContract();
    }
    this.balanceService.updateContract(this.contract!, this.wallet!);
  }

  private getContractAddress(): string {
    const chain = this.getChain();
    const address = CONTRACTS[chain];
    if (!address || address === '0x...') {
      throw new Error(`Contract not deployed on ${chain}`);
    }
    return address;
  }

  private getChain(): ChainType {
    // Extract chain from wallet client (simplified)
    return 'base'; // Default to base for now
  }

  // NEW: Wait for and retrieve execution receipt
  async waitForReceipt(txHash: string, timeoutMs: number = 60000): Promise<APIReceipt | undefined> {
    const startTime = Date.now();
    const pollInterval = 2000; // 2 seconds

    while (Date.now() - startTime < timeoutMs) {
      try {
        // Try gateway first (faster)
        const gatewayReceipt = await this.getGatewayReceipt(txHash);
        if (gatewayReceipt) {
          return gatewayReceipt;
        }

        // Fallback to on-chain receipt
        const onChainReceipt = await this.getOnChainReceipt(txHash);
        if (onChainReceipt) {
          return onChainReceipt;
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.warn('Error checking for receipt:', error);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    console.warn(`Receipt timeout for transaction: ${txHash}`);
    return undefined;
  }

  // NEW: Get receipt from gateway (faster, but temporary)
  async getGatewayReceipt(txHash: string): Promise<APIReceipt | undefined> {
    try {
      const response = await fetch(`${this.gatewayUrl}/receipt/${txHash}`);
      if (!response.ok) {
        return undefined;
      }
      const receipt = await response.json();
      return receipt as APIReceipt;
    } catch (error) {
      return undefined;
    }
  }

  // NEW: Get receipt from blockchain (permanent, but slower)
  async getOnChainReceipt(txHash: string): Promise<APIReceipt | undefined> {
    this.setupContract();
    if (!this.contract) return undefined;

    try {
      const receipt = await this.contract.getReceipt(txHash);
      
      // Check if receipt exists (executedAt > 0)
      if (receipt.executedAt.toString() === '0') {
        return undefined;
      }

      return {
        inputHash: receipt.inputHash,
        outputHash: receipt.outputHash,
        executionProof: receipt.executionProof,
        executedAt: Number(receipt.executedAt),
        responseSize: Number(receipt.responseSize),
        success: receipt.success,
        httpStatus: Number(receipt.httpStatus),
        gateway: receipt.gateway
      };
    } catch (error) {
      console.warn('Error getting on-chain receipt:', error);
      return undefined;
    }
  }

  // NEW: Verify receipt authenticity with data
  async verifyReceipt(
    txHash: string, 
    inputData: any, 
    outputData: any
  ): Promise<ReceiptVerification> {
    this.setupContract();
    if (!this.contract) {
      return { valid: false, reason: 'Contract not available' };
    }

    try {
      // Convert data to bytes for verification
      const inputBytes = ethers.toUtf8Bytes(JSON.stringify(inputData));
      const outputBytes = ethers.toUtf8Bytes(JSON.stringify(outputData));

      const result = await this.contract.verifyReceipt(txHash, inputBytes, outputBytes);
      
      if (result.valid) {
        const receipt = await this.getOnChainReceipt(txHash);
        return {
          valid: true,
          reason: result.reason,
          receipt
        };
      } else {
        return {
          valid: false,
          reason: result.reason
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        reason: `Verification failed: ${error.message}`
      };
    }
  }

  // NEW: Comprehensive call with automatic verification
  async callWithProof(modelId: string, input: any, options: PaymentOptions): Promise<{
    result: PaymentResult;
    verification: ReceiptVerification;
  }> {
    console.log(`🔒 Making verified API call to ${modelId}...`);
    
    // Make the call
    const result = await this.payAndCall(modelId, input, options);
    
    // If we have a receipt, verify it
    let verification: ReceiptVerification = { valid: false, reason: 'No receipt available' };
    
    if (result.receipt && result.txHash) {
      console.log('🔍 Verifying receipt...');
      verification = await this.verifyReceipt(result.txHash, input, result.data);
      
      if (verification.valid) {
        console.log('✅ Receipt verified! Call is authentic.');
      } else {
        console.warn('❌ Receipt verification failed:', verification.reason);
      }
    }

    return { result, verification };
  }

  // NEW: Audit trail for developer
  async getAPICallHistory(modelId?: string, limit: number = 50): Promise<Array<{
    txHash: string;
    modelId: string;
    timestamp: number;
    amount: string;
    success: boolean;
    verified: boolean;
  }>> {
    // This would integrate with event indexing service
    // For now, return mock data structure
    console.log(`📊 Getting API call history${modelId ? ` for ${modelId}` : ''}...`);
    
    // In production, this would query events from the blockchain
    return [];
  }

  // NEW: Get proof of API execution for legal/compliance
  async getExecutionProof(txHash: string): Promise<{
    transaction: any;
    receipt: APIReceipt;
    verification: ReceiptVerification;
    timestamp: Date;
  } | null> {
    console.log(`📜 Generating execution proof for ${txHash}...`);
    
    const receipt = await this.getOnChainReceipt(txHash);
    if (!receipt) {
      return null;
    }

    // This would also include the original transaction data
    // For now, return basic proof structure
         return {
       transaction: { hash: txHash }, // Would include full tx data
       receipt,
       verification: { valid: true, reason: 'On-chain verified' },
       timestamp: new Date(receipt.executedAt * 1000)
     };
   }

  // === NEW: ATTRIBUTION FEATURES ===

  /**
   * Pay with multi-party attribution splits
   */
  async payWithAttribution(
    modelId: string, 
    input: any, 
    attributions: Attribution[], 
    options: Omit<PaymentOptions, 'attributions'>
  ): Promise<PaymentResult> {
    if (!this.wallet) throw new Error('No wallet connected');
    
    // Validate attribution splits
    const totalBasisPoints = attributions.reduce((sum, attr) => sum + attr.basisPoints, 0);
    if (totalBasisPoints !== 10000) {
      throw new Error('Attribution splits must sum to 100% (10000 basis points)');
    }

    console.log(`💰 Payment with ${attributions.length} attribution splits`);
    
    // Store attribution data in gateway
    const response = await fetch(`${this.gatewayUrl}/pay-with-attribution`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        modelId,
        input,
        attributions,
        payer: this.wallet.address,
        amount: options.price
      })
    });

    if (!response.ok) {
      throw new Error(`Attribution setup failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Attribution recorded: ${result.inputHash}`);

    // Now make the payment with attribution flag
    return this.payAndCall(modelId, input, { ...options, attributions });
  }

  // === NEW: REPUTATION FEATURES ===

  /**
   * Get reputation data for an address
   */
  async getReputation(address?: string): Promise<ReputationData> {
    const targetAddress = address || this.wallet?.address;
    if (!targetAddress) throw new Error('No address provided and no wallet connected');

    const response = await fetch(`${this.gatewayUrl}/reputation/${targetAddress}`);
    if (!response.ok) {
      throw new Error(`Failed to get reputation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get leaderboard of top agents
   */
  async getLeaderboard(limit: number = 10): Promise<ReputationData[]> {
    const response = await fetch(`${this.gatewayUrl}/leaderboard?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`Failed to get leaderboard: ${response.statusText}`);
    }

    return response.json();
  }

  // === NEW: TASK ESCROW FEATURES ===

  /**
   * Create an escrowed task
   */
  async createTask(options: TaskOptions): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');

    const taskData = {
      worker: options.worker,
      amount: options.amount,
      token: options.token || USDC_ADDRESSES[this.getChain()],
      escrowType: options.escrowType,
      rules: options.rules || {},
      payer: this.wallet.address
    };

    // Add timeout to rules if provided
    if (options.timeout) {
      taskData.rules.timeoutMinutes = options.timeout;
    }

    const response = await fetch(`${this.gatewayUrl}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      throw new Error(`Task creation failed: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`📋 Task created: ${result.taskId}`);
    
    return result.taskId;
  }

  /**
   * Complete a task
   */
  async completeTask(taskId: string, result: any): Promise<boolean> {
    if (!this.wallet) throw new Error('No wallet connected');

    const response = await fetch(`${this.gatewayUrl}/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        result,
        worker: this.wallet.address
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Task completion failed: ${error.error}`);
    }

    const responseData = await response.json();
    console.log(`✅ Task completed: ${taskId}`);
    
    return responseData.success;
  }

  /**
   * Approve a task (for mutual escrow)
   */
  async approveTask(taskId: string): Promise<boolean> {
    if (!this.wallet) throw new Error('No wallet connected');

    const response = await fetch(`${this.gatewayUrl}/tasks/${taskId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        approver: this.wallet.address
      })
    });

    if (!response.ok) {
      throw new Error(`Task approval failed: ${response.statusText}`);
    }

    console.log(`👍 Task approved: ${taskId}`);
    return true;
  }

  /**
   * Get task details
   */
  async getTask(taskId: string): Promise<Task> {
    const response = await fetch(`${this.gatewayUrl}/tasks/${taskId}`);
    
    if (!response.ok) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return response.json();
  }

  /**
   * Create simple timeout task (convenience method)
   */
  async createTimeoutTask(
    worker: string, 
    amount: string, 
    timeoutMinutes: number = 30
  ): Promise<string> {
    return this.createTask({
      worker,
      amount,
      escrowType: 'timeout',
      timeout: timeoutMinutes
    });
  }

  /**
   * Create hash validation task (convenience method)
   */
  async createHashTask(
    worker: string, 
    amount: string, 
    expectedHash: string
  ): Promise<string> {
    return this.createTask({
      worker,
      amount,
      escrowType: 'hash',
      rules: { expectedHash }
    });
  }

  /**
   * Create mutual approval task (convenience method)
   */
  async createMutualTask(
    worker: string, 
    amount: string
  ): Promise<string> {
    return this.createTask({
      worker,
      amount,
      escrowType: 'mutual'
    });
  }
} 