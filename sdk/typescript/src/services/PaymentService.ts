import { ethers, Contract } from 'ethers';
import axios from 'axios';
import type { WalletInfo } from '../wallet/UniversalWalletAdapter';
import type { PaymentOptions } from '../index';

// AgentPayyKit contract ABI (essential functions only)
const AGENTPAY_ABI = [
  'function payAndCall(tuple(string modelId, bytes32 inputHash, uint256 amount, uint256 deadline, bytes smartWalletSig, uint8 v, bytes32 r, bytes32 s) payment)',
  'function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))',
  'function getUserBalance(address user, address token) view returns (uint256)',
  'function depositBalance(address token, uint256 amount)',
  'event PaymentProcessed(string indexed modelId, address indexed payer, uint256 amount, bytes32 indexed inputHash, uint256 timestamp)'
];

// ERC20 ABI for token operations
const ERC20_ABI = [
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function balanceOf(address account) view returns (uint256)',
  'function permit(address owner, address spender, uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s)'
];

export interface PaymentData {
  modelId: string;
  inputHash: string;
  amount: string;
  deadline: number;
  smartWalletSig: string;
  v: number;
  r: string;
  s: string;
}

export class PaymentService {
  private gatewayUrl: string;
  private provider?: ethers.Provider;
  private signer?: ethers.Signer;
  private contractAddress: string;

  constructor(gatewayUrl: string, contractAddress: string = '') {
    this.gatewayUrl = gatewayUrl;
    this.contractAddress = contractAddress;
  }

  /**
   * Initialize with wallet for blockchain interactions
   */
  initialize(wallet: WalletInfo) {
    // Convert Viem client to ethers provider/signer
    if (wallet.client && wallet.publicClient) {
      // Use viem client as provider
      this.provider = new ethers.BrowserProvider(wallet.client as any);
      
      if (wallet.privateKey) {
        // For generated/imported wallets, create signer from private key
        this.signer = new ethers.Wallet(wallet.privateKey, this.provider);
      } else {
        // For connected wallets, use the provider's signer
        this.signer = this.provider.getSigner(wallet.address);
      }
    }
  }

  /**
   * Pay with smart account (gasless)
   */
  async payWithSmartAccount(
    modelId: string, 
    input: any, 
    options: PaymentOptions,
    wallet: WalletInfo
  ): Promise<any> {
    console.log('⚡ Using smart account (gasless payment)...');
    
    if (!this.signer || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const contract = new Contract(this.contractAddress, AGENTPAY_ABI, this.signer);
    
    // Get model info to determine price and token
    const model = await contract.getModel(modelId);
    if (model.owner === ethers.ZeroAddress) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Create input hash
    const inputJson = JSON.stringify(input, null, 0);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
    
    // Store input data first
    await this.storeInputData(inputHash, inputJson);

    // Create deadline (15 minutes from now)
    const deadline = Math.floor(Date.now() / 1000) + 900;
    
    // For smart accounts, create a signature proving authorization
    const messageHash = ethers.keccak256(ethers.solidityPacked(
      ['string', 'bytes32', 'uint256', 'uint256'],
      [modelId, inputHash, model.price, deadline]
    ));
    
    const signature = await this.signer.signMessage(ethers.getBytes(messageHash));
    
    const paymentData: PaymentData = {
      modelId,
      inputHash,
      amount: model.price.toString(),
      deadline,
      smartWalletSig: signature,
      v: 0,
      r: ethers.ZeroHash,
      s: ethers.ZeroHash
    };

    // Send transaction
    const tx = await contract.payAndCall(paymentData, {
      gasLimit: 300000 // Smart account transactions can be gas-intensive
    });

    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return this.waitForAPIResponse(tx.hash);
  }

  /**
   * Pay with prepaid balance
   */
  async payWithBalance(
    modelId: string, 
    input: any, 
    options: PaymentOptions
  ): Promise<any> {
    console.log('💰 Using prepaid balance...');
    
    if (!this.signer || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const contract = new Contract(this.contractAddress, AGENTPAY_ABI, this.signer);
    
    // Get model info
    const model = await contract.getModel(modelId);
    if (model.owner === ethers.ZeroAddress) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Check user balance
    const userAddress = await this.signer.getAddress();
    const balance = await contract.getUserBalance(userAddress, model.token);
    
    if (balance < model.price) {
      throw new Error(`Insufficient balance. Required: ${ethers.formatUnits(model.price, 6)} USDC, Available: ${ethers.formatUnits(balance, 6)} USDC`);
    }

    // Create input hash
    const inputJson = JSON.stringify(input, null, 0);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
    
    // Store input data
    await this.storeInputData(inputHash, inputJson);

    // Create payment data (balance payment doesn't need permit signature)
    const deadline = Math.floor(Date.now() / 1000) + 900;
    
    const paymentData: PaymentData = {
      modelId,
      inputHash,
      amount: model.price.toString(),
      deadline,
      smartWalletSig: '0x',
      v: 0,
      r: ethers.ZeroHash,
      s: ethers.ZeroHash
    };

    // Send transaction
    const tx = await contract.payAndCall(paymentData, {
      gasLimit: 200000
    });

    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return this.waitForAPIResponse(tx.hash);
  }

  /**
   * Pay with permit (EIP-2612) - for tokens that support gasless approvals
   */
  async payWithPermit(
    modelId: string, 
    input: any, 
    options: PaymentOptions
  ): Promise<any> {
    console.log('💳 Using permit payment...');
    
    if (!this.signer || !this.provider) {
      throw new Error('Wallet not initialized');
    }

    const contract = new Contract(this.contractAddress, AGENTPAY_ABI, this.signer);
    
    // Get model info
    const model = await contract.getModel(modelId);
    if (model.owner === ethers.ZeroAddress) {
      throw new Error(`Model ${modelId} not found`);
    }

    // Check token balance
    const tokenContract = new Contract(model.token, ERC20_ABI, this.signer);
    const userAddress = await this.signer.getAddress();
    const tokenBalance = await tokenContract.balanceOf(userAddress);
    
    if (tokenBalance < model.price) {
      throw new Error(`Insufficient token balance. Required: ${ethers.formatUnits(model.price, 6)} USDC`);
    }

    // Create input hash
    const inputJson = JSON.stringify(input, null, 0);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
    
    // Store input data
    await this.storeInputData(inputHash, inputJson);

    // Create permit signature
    const deadline = Math.floor(Date.now() / 1000) + 900;
    const nonce = await tokenContract.nonces(userAddress);
    
         // EIP-712 domain for permit
     const domain = {
       name: 'USD Coin',
       version: '2',
       chainId: await this.provider.getNetwork().then((n: any) => n.chainId),
       verifyingContract: model.token
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

    const value = {
      owner: userAddress,
      spender: this.contractAddress,
      value: model.price,
      nonce: nonce,
      deadline: deadline
    };

    // Sign permit
    const signature = await this.signer.signTypedData(domain, types, value);
    const sig = ethers.Signature.from(signature);

    const paymentData: PaymentData = {
      modelId,
      inputHash,
      amount: model.price.toString(),
      deadline,
      smartWalletSig: '0x',
      v: sig.v,
      r: sig.r,
      s: sig.s
    };

    // Send transaction
    const tx = await contract.payAndCall(paymentData, {
      gasLimit: 250000
    });

    console.log(`Transaction sent: ${tx.hash}`);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

    return this.waitForAPIResponse(tx.hash);
  }

  /**
   * Mock API call for testing
   */
  async mockAPICall(modelId: string, input: any): Promise<any> {
    try {
      const response = await axios.post(`${this.gatewayUrl}/api/mock/${modelId}`, {
        input,
        mock: true
      }, { timeout: 10000 });
      
      return response.data;
    } catch (error) {
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
   * Store input data for API processing
   */
  private async storeInputData(inputHash: string, inputData: string): Promise<void> {
    try {
      await axios.post(`${this.gatewayUrl}/store-input`, { 
        hash: inputHash, 
        data: inputData 
      }, { timeout: 5000 });
    } catch (error) {
      console.warn('Failed to store input data:', error);
      // Don't throw - this is not critical for payment processing
    }
  }

  /**
   * Wait for API response with exponential backoff
   */
  private async waitForAPIResponse(txHash: string, maxRetries: number = 30): Promise<any> {
    const baseDelay = 2000; // Start with 2 seconds for blockchain confirmation
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await axios.get(`${this.gatewayUrl}/response/${txHash}`, { timeout: 5000 });
        if (response.data && !response.data.error) {
          return response.data;
        }
      } catch (error) {
        // Continue polling
      }
      
      const delay = baseDelay * Math.pow(1.3, i) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 15000)));
    }
    
    throw new Error(`API response timeout after ${maxRetries} retries. Transaction may still be processing.`);
  }

  /**
   * Get contract instance
   */
  getContract(): Contract | null {
    if (!this.signer || !this.contractAddress) {
      return null;
    }
    return new Contract(this.contractAddress, AGENTPAY_ABI, this.signer);
  }
} 