import { ethers, Contract } from 'ethers';
import type { WalletInfo, ChainType } from '../wallet/UniversalWalletAdapter';

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
};

export class BalanceService {
  private contract?: Contract;
  private wallet?: WalletInfo;

  constructor(contract?: Contract, wallet?: WalletInfo) {
    this.contract = contract;
    this.wallet = wallet;
  }

  updateContract(contract: Contract, wallet: WalletInfo) {
    this.contract = contract;
    this.wallet = wallet;
  }

  /**
   * Deposit to prepaid balance
   */
  async depositBalance(amount: string, tokenAddress?: string, chain: ChainType = 'base'): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');
    if (!this.contract) throw new Error('Contract not initialized');
    
    console.log(`💰 Depositing $${amount} USDC to balance...`);
    
    const token = tokenAddress || USDC_ADDRESSES[chain];
    const amountWei = ethers.parseUnits(amount, 6);
    
    // Smart account flow (gasless)
    if (this.wallet.isSmartAccount && this.wallet.features.gasless) {
      // Implementation would use smart account's gasless deposit
      console.log('Using gasless deposit...');
    }
    
    // Standard flow - approve then deposit
    const tokenContract = new Contract(token, [
      "function approve(address spender, uint256 amount) returns (bool)"
    ], this.wallet.client as any);
    
    const approveTx = await tokenContract.approve(this.contract.target, amountWei);
    console.log('Approval transaction sent...');
    
    const depositTx = await this.contract.depositBalance(token, amountWei);
    console.log('Deposit transaction sent...');
    
    return depositTx.hash;
  }

  /**
   * Get user's prepaid balance
   */
  async getUserBalance(userAddress?: string, tokenAddress?: string, chain: ChainType = 'base'): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const user = userAddress || this.wallet?.address;
    const token = tokenAddress || USDC_ADDRESSES[chain];
    
    if (!user) throw new Error('User address required');
    
    const balance = await this.contract.getUserBalance(user, token);
    return ethers.formatUnits(balance, 6);
  }

  /**
   * Check if user has sufficient balance
   */
  async checkUserBalance(requiredAmount: string, chain: ChainType = 'base'): Promise<boolean> {
    const balance = await this.getUserBalance(undefined, undefined, chain);
    return parseFloat(balance) >= parseFloat(requiredAmount);
  }

  /**
   * Withdraw from prepaid balance
   */
  async withdrawBalance(amount: string, tokenAddress?: string, chain: ChainType = 'base'): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');
    if (!this.contract) throw new Error('Contract not initialized');
    
    console.log(`💸 Withdrawing $${amount} USDC from balance...`);
    
    const token = tokenAddress || USDC_ADDRESSES[chain];
    const amountWei = ethers.parseUnits(amount, 6);
    
    const tx = await this.contract.withdrawBalance(token, amountWei);
    return tx.hash;
  }

  /**
   * Get earnings from API sales
   */
  async getEarnings(tokenAddress?: string, chain: ChainType = 'base'): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    if (!this.wallet) throw new Error('No wallet connected');
    
    const token = tokenAddress || USDC_ADDRESSES[chain];
    const balance = await this.contract.getBalance(this.wallet.address, token);
    return ethers.formatUnits(balance, 6);
  }

  /**
   * Withdraw earnings
   */
  async withdrawEarnings(tokenAddress?: string, chain: ChainType = 'base'): Promise<string> {
    if (!this.wallet) throw new Error('No wallet connected');
    if (!this.contract) throw new Error('Contract not initialized');
    
    console.log('💰 Withdrawing earnings...');
    
    const token = tokenAddress || USDC_ADDRESSES[chain];
    const tx = await this.contract.withdraw(token);
    return tx.hash;
  }

  /**
   * Get complete financial overview
   */
  async getFinancialOverview(chain: ChainType = 'base'): Promise<{
    earnings: string;
    balance: string;
    totalSpent: string;
    netPosition: string;
  }> {
    const earnings = await this.getEarnings(undefined, chain);
    const balance = await this.getUserBalance(undefined, undefined, chain);
    
    // Calculate total spent (this would be tracked separately in production)
    const totalSpent = "0"; // Placeholder
    
    const netPosition = (parseFloat(earnings) + parseFloat(balance) - parseFloat(totalSpent)).toFixed(6);
    
    return {
      earnings,
      balance,
      totalSpent,
      netPosition
    };
  }
} 