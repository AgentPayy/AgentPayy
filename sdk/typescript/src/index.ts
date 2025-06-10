import { ethers, Contract, Wallet, JsonRpcProvider } from 'ethers';
import axios from 'axios';

export interface PaymentOptions {
  chain?: 'base' | 'arbitrum' | 'optimism';
  price: string;
  deadline?: number;
  mock?: boolean;
  useBalance?: boolean;
}

export interface ModelConfig {
  modelId: string;
  endpoint: string;
  price: string;
  token?: string;
}

interface PaymentData {
  modelId: string;
  inputHash: string;
  amount: string;
  deadline: number;
  smartWalletSig: string;
  v: number;
  r: string;
  s: string;
}

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

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
};

const CONTRACT_ABI = [
  "function payAndCall(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)",
  "function registerModel(string modelId, string endpoint, uint256 price, address token)",
  "function depositBalance(address token, uint256 amount)",
  "function withdraw(address token)",
  "function withdrawBalance(address token, uint256 amount)",
  "function getBalance(address user, address token) view returns (uint256)",
  "function getUserBalance(address user, address token) view returns (uint256)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))"
];

export class AgentPayKit {
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
}

export default AgentPayKit;

// Enhanced SDK
export { EnhancedAgentPayKit } from './EnhancedAgentPayKit';

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
  AgentConfig
} from './EnhancedAgentPayKit';

export type {
  SmartAccountProvider,
  SmartAccountFeature,
  SmartAccountInfo
} from './wallet/SmartWalletFactory'; 