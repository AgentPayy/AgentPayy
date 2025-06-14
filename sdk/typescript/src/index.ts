import { ethers, JsonRpcProvider, Wallet, Contract } from 'ethers';
import axios from 'axios';

// Import from consolidated core
import type { 
  ChainType, 
  ModelConfig, 
  PaymentOptions, 
  PaymentData,
  WalletInfo,
  WalletConnectionOptions,
  WalletType
} from './core';
import { getContractAddress, USDC_ADDRESSES } from './core';

// Types are now imported from ./core

const CONTRACTS = {
  base: '0x...',  // Set after deployment
  arbitrum: '0x...',
  optimism: '0x...'
};

const RPC_URLS = {
  base: 'https://mainnet.base.org',
  arbitrum: 'https://arb1.arbitrum.io/rpc',
  optimism: 'https://mainnet.optimism.io'
};

const CONTRACT_ABI = [
  "function payAndCall(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)",
  "function registerModel(string modelId, string endpoint, uint256 price, address token)",
  "function depositBalance(address token, uint256 amount)",
  "function withdraw(address token)",
  "function withdrawBalance(address token, uint256 amount)",
  "function getBalance(address user, address token) view returns (uint256)",
  "function getUserBalance(address user, address token) view returns (uint256)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))",
  "function validatePayment(string txHash, string inputHash) view returns (bool)",
  "function markPaymentValidated(string txHash) returns (bool)"
];

export class AgentPayyKit {
  private provider: JsonRpcProvider;
  private contract: Contract;
  private signer?: Wallet;
  private chain: 'base' | 'arbitrum' | 'optimism';
  private gatewayUrl: string;

  constructor(
    signerOrProvider: Wallet | JsonRpcProvider,
    chain: 'base' | 'arbitrum' | 'optimism' = 'base',
    gatewayUrl: string = 'http://localhost:3000'
  ) {
    this.chain = chain;
    this.gatewayUrl = gatewayUrl;
    
    if (signerOrProvider instanceof Wallet) {
      this.signer = signerOrProvider;
      this.provider = signerOrProvider.provider as JsonRpcProvider || new JsonRpcProvider(RPC_URLS[chain]);
    } else {
      this.provider = signerOrProvider;
    }

    const contractAddress = CONTRACTS[chain];
    if (!contractAddress || contractAddress === '0x...') {
      throw new Error(`Contract not deployed on ${chain}. Please check deployment.`);
    }

    this.contract = new Contract(contractAddress, CONTRACT_ABI, this.signer || this.provider);
  }

  async payAndCall(modelId: string, input: any, options: PaymentOptions): Promise<any> {
    if (!modelId || typeof modelId !== 'string') throw new Error('Invalid modelId');
    if (!options.price || isNaN(Number(options.price))) throw new Error('Invalid price');

    if (options.mock) {
      return this.mockAPICall(modelId, input);
    }

    if (!this.signer) throw new Error('Signer required for payments');

    if (options.useBalance !== false) {
      const hasBalance = await this.checkUserBalance(options.price);
      if (hasBalance) {
        console.log('Using prepaid balance for payment');
      } else {
        console.log('Insufficient balance, falling back to permit payment');
      }
    }

    const inputJson = JSON.stringify(input, null, 0);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
    const deadline = options.deadline || Math.floor(Date.now() / 1000) + 3600;
    const amount = ethers.parseUnits(options.price, 6);

    await this.storeInputData(inputHash, inputJson);

    const walletAddress = await this.signer.getAddress();
    const isSmartWallet = await this.isSmartWallet(walletAddress);

    const paymentData = isSmartWallet 
      ? await this.prepareSmartWalletPayment(modelId, inputHash, amount.toString(), deadline)
      : await this.preparePermitPayment(modelId, inputHash, amount.toString(), deadline);

    const tx = await this.contract.payAndCall(paymentData);
    const receipt = await tx.wait();

    return this.waitForAPIResponse(receipt.hash);
  }

  async depositBalance(amount: string, tokenAddress?: string): Promise<string> {
    if (!this.signer) throw new Error('Signer required for deposit');
    
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    const amountWei = ethers.parseUnits(amount, 6);
    
    const tokenContract = new Contract(token, [
      "function approve(address spender, uint256 amount) returns (bool)"
    ], this.signer);
    
    const approveTx = await tokenContract.approve(this.contract.target, amountWei);
    await approveTx.wait();
    
    const tx = await this.contract.depositBalance(token, amountWei);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async checkUserBalance(requiredAmount: string, userAddress?: string, tokenAddress?: string): Promise<boolean> {
    const user = userAddress || (this.signer ? await this.signer.getAddress() : '');
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    
    if (!user) throw new Error('User address required');
    
    const balance = await this.contract.getUserBalance(user, token);
    const required = ethers.parseUnits(requiredAmount, 6);
    
    return balance >= required;
  }

  async getUserBalance(userAddress?: string, tokenAddress?: string): Promise<string> {
    const user = userAddress || (this.signer ? await this.signer.getAddress() : '');
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    
    if (!user) throw new Error('User address required');
    
    const balance = await this.contract.getUserBalance(user, token);
    return ethers.formatUnits(balance, 6);
  }

  async withdrawBalance(amount: string, tokenAddress?: string): Promise<string> {
    if (!this.signer) throw new Error('Signer required for withdrawal');
    
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    const amountWei = ethers.parseUnits(amount, 6);
    
    const tx = await this.contract.withdrawBalance(token, amountWei);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async registerModel(config: ModelConfig): Promise<string> {
    if (!this.signer) throw new Error('Signer required for registration');
    if (!config.modelId || !config.endpoint || !config.price) {
      throw new Error('Missing required fields: modelId, endpoint, price');
    }

    const price = ethers.parseUnits(config.price, 6);
    const token = config.token || USDC_ADDRESSES[this.chain];

    const tx = await this.contract.registerModel(config.modelId, config.endpoint, price, token);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async withdraw(tokenAddress?: string): Promise<string> {
    if (!this.signer) throw new Error('Signer required for withdrawal');
    
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    const tx = await this.contract.withdraw(token);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async getBalance(userAddress?: string, tokenAddress?: string): Promise<string> {
    const user = userAddress || (this.signer ? await this.signer.getAddress() : '');
    const token = tokenAddress || USDC_ADDRESSES[this.chain];
    
    if (!user) throw new Error('User address required');
    
    const balance = await this.contract.getBalance(user, token);
    return ethers.formatUnits(balance, 6);
  }

  async getModel(modelId: string) {
    if (!modelId) throw new Error('Model ID required');
    return await this.contract.getModel(modelId);
  }

  private async isSmartWallet(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch {
      return false;
    }
  }

  private async prepareSmartWalletPayment(
    modelId: string, inputHash: string, amount: string, deadline: number
  ): Promise<PaymentData> {
    const messageHash = ethers.keccak256(
      ethers.solidityPacked(['string', 'bytes32', 'uint256', 'uint256'], [modelId, inputHash, amount, deadline])
    );

    const signature = await this.signer!.signMessage(ethers.getBytes(messageHash));

    return {
      modelId, inputHash, amount, deadline,
      smartWalletSig: signature,
      v: 0, r: ethers.ZeroHash, s: ethers.ZeroHash
    };
  }

  private async preparePermitPayment(
    modelId: string, inputHash: string, amount: string, deadline: number
  ): Promise<PaymentData> {
    const tokenAddress = USDC_ADDRESSES[this.chain];
    const spender = CONTRACTS[this.chain];
    const owner = await this.signer!.getAddress();

    const tokenContract = new Contract(tokenAddress, ['function nonces(address) view returns (uint256)'], this.provider);
    const nonce = await tokenContract.nonces(owner);

    const domain = {
      name: 'USD Coin',
      version: '2',
      chainId: await this.provider.getNetwork().then(n => Number(n.chainId)),
      verifyingContract: tokenAddress
    };

    const types = {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' }
      ]
    };

    const value = { owner, spender, value: amount, nonce, deadline };
    const signature = await this.signer!.signTypedData(domain, types, value);
    const { v, r, s } = ethers.Signature.from(signature);

    return {
      modelId, inputHash, amount, deadline,
      smartWalletSig: '0x', v, r, s
    };
  }

  private async storeInputData(inputHash: string, inputData: string): Promise<void> {
    try {
      await axios.post(`${this.gatewayUrl}/store-input`, { hash: inputHash, data: inputData }, { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to store input data:', error);
      // Continue anyway - gateway will handle missing data
    }
  }

  private async waitForAPIResponse(txHash: string): Promise<any> {
    const maxRetries = 20;
    const baseDelay = 1000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${this.gatewayUrl}/response/${txHash}`, { timeout: 5000 });
        if (response.data && !response.data.error) {
          return response.data;
        }
      } catch (error) {
        // Continue polling
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(1.5, i) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
    }

    throw new Error('API response timeout after 20 retries');
  }

  private async mockAPICall(modelId: string, input: any): Promise<any> {
    try {
      const response = await axios.post(`${this.gatewayUrl}/api/mock/${modelId}`, {
        input,
        mock: true
      }, { timeout: 10000 });
      
      return response.data;
    } catch (error) {
      // Return mock data if endpoint doesn't exist
      return {
        mock: true,
        modelId,
        input,
        result: `Mock response for ${modelId}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Privacy-First API Call
   * Pay for API call and execute it directly (no gateway needed)
   */
  async callAPI(
    apiUrl: string,
    input: any,
    modelId: string,
    options: {
      maxCost?: string;
      timeout?: number;
    } = {}
  ): Promise<{
    response: any;
    receipt: string;
    cost: string;
  }> {
    // 1. Get model info and validate cost
    const model = await this.getModel(modelId);
    const cost = ethers.parseUnits(model.price.toString(), 6); // Assuming USDC
    
    if (options.maxCost && cost > ethers.parseUnits(options.maxCost, 6)) {
      throw new Error(`Cost ${ethers.formatUnits(cost, 6)} exceeds max ${options.maxCost}`);
    }

    // 2. Create input hash (privacy preserved)
    const inputHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(input))
    );

    // 3. Pay on-chain
    const paymentTx = await this.pay({
      modelId,
      inputHash,
      amount: cost,
      deadline: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    });

    const receipt = await paymentTx.wait();
    const txHash = receipt.hash;

    // 4. Call API directly with payment proof
    const apiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `AgentPayy ${txHash}`,
        'X-Input-Hash': inputHash,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(options.timeout || 30000),
    });

    if (!apiResponse.ok) {
      throw new Error(`API call failed: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const responseData = await apiResponse.json();

    return {
      response: responseData,
      receipt: txHash,
      cost: ethers.formatUnits(cost, 6),
    };
  }

  /**
   * Validate payment for API providers
   */
  async validatePayment(txHash: string, inputData: any): Promise<boolean> {
    const inputHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(inputData))
    );
    
    return await this.contract.validatePayment(txHash, inputHash);
  }

  /**
   * Mark payment as validated (for API providers)
   */
  async markValidated(txHash: string): Promise<ethers.ContractTransactionResponse> {
    return await this.contract.markPaymentValidated(txHash);
  }

  // === API DISCOVERY METHODS ===

  /**
   * Get APIs by category
   * @param category - API category to filter by
   * @returns Array of APIs in the specified category
   */
  async getAPIsByCategory(category: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.gatewayUrl}/registry/category/${encodeURIComponent(category)}`);
      return response.data;
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
      const response = await axios.get(`${this.gatewayUrl}/registry/search?tag=${encodeURIComponent(tag)}`);
      return response.data;
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
      const response = await axios.get(`${this.gatewayUrl}/registry/stats`);
      return response.data;
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
      const response = await axios.get(`${this.gatewayUrl}/registry/trending?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting trending APIs:', error);
      return [];
    }
  }
}

export default AgentPayyKit;

// Core utilities and types
export * from './core';

// Modules
export { ReputationModule } from './ReputationModule';
export { AttributionModule } from './AttributionModule';

// Specialized modules
export { AgentPayyWall } from './paywall';
export { APIRegistry } from './registry/APIRegistry';
export { RegistryIndexer } from './registry/RegistryIndexer';

// Wallet Infrastructure
export { UniversalWalletAdapter } from './wallet/UniversalWalletAdapter';
export { SmartWalletFactory } from './wallet/SmartWalletFactory';

// Services
export { PaymentService } from './services/PaymentService';
export { BalanceService } from './services/BalanceService';

// Additional Types
export type {
  WalletInfo,
  WalletConnectionOptions,
  WalletType,
  ChainType
} from './wallet/UniversalWalletAdapter';

export type {
  SmartAccountProvider,
  SmartAccountFeature,
  SmartAccountInfo
} from './wallet/SmartWalletFactory'; 