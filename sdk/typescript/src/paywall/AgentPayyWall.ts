import { Request, Response, NextFunction } from 'express';
import { ethers, Contract, JsonRpcProvider, Wallet } from 'ethers';
import axios from 'axios';

// Import from consolidated core
import type { 
  ChainType, 
  ModelConfig, 
  PaymentOptions,
  PaymentData,
  WalletInfo 
} from '../core';
import { getContractAddress, USDC_ADDRESSES } from '../core';
import {
  getUSDCAddress,
  CONTRACT_ABI,
  createPaymentHash,
  verifyPaymentSignature,
  parseAmount,
  formatAmount
} from '../core';
import type {
  PaymentProof,
  APICallMetadata,
  PaymentError,
  AgentPayyError
} from '../core';

export interface PaywallOptions {
  apiKey: string;
  pricePerQuery?: string;
  chain?: ChainType;
  requireBalance?: boolean;
  analytics?: boolean;
}

export interface RouteOptions {
  price?: string;
  description?: string;
  rateLimit?: number;
  requireVerification?: boolean;
}

export interface PaymentRequest {
  error: string;
  payment: {
    price: string;
    currency: string;
    endpoint: string;
    apiProvider: string;
    paymentMethods: string[];
  };
}

export interface Analytics {
  totalCalls: number;
  totalRevenue: string;
  uniqueUsers: number;
  averagePrice: string;
  recentCalls: Array<{
    timestamp: number;
    payer: string;
    amount: string;
    endpoint: string;
  }>;
}

export class AgentPayyWall {
  private apiKey: string;
  private pricePerQuery: string;
  private chain: ChainType;
  private contract?: Contract;
  private requireBalance: boolean;
  private analytics: boolean;
  private callHistory: Array<any> = [];

  constructor(options: PaywallOptions) {
    this.apiKey = options.apiKey;
    this.pricePerQuery = options.pricePerQuery || '0.01';
    this.chain = options.chain || 'base';
    this.requireBalance = options.requireBalance ?? true;
    this.analytics = options.analytics ?? true;
    
    this.initializeContract();
  }

  /**
   * Main middleware function to protect routes
   */
  protect(routeOptions: RouteOptions = {}) {
    return async (req: Request & { agentpay?: APICallMetadata }, res: Response, next: NextFunction) => {
      try {
        const price = routeOptions.price || this.pricePerQuery;
        
        // Check for payment proof in headers
        const paymentProofHeader = req.headers['x-agentpay-proof'] as string;
        const userWallet = req.headers['x-user-wallet'] as string;
        
        if (!paymentProofHeader && !userWallet) {
          return this.requestPayment(res, price, req.path);
        }

        // Verify payment
        const isValid = await this.verifyPayment(paymentProofHeader, userWallet, price, req.path);
        
        if (!isValid) {
          return this.requestPayment(res, price, req.path);
        }

        // Record transaction for analytics
        if (this.analytics) {
          await this.recordTransaction(userWallet, price, req.path);
        }

        // Add payment metadata to request
        req.agentpay = {
          payer: userWallet,
          paymentAmount: parseAmount(price),
          timestamp: Date.now(),
          verified: true,
          apiEndpoint: req.path
        };

        next(); // Payment verified, proceed to API
      } catch (error) {
        console.error('AgentPayyWall error:', error);
        res.status(500).json({
          error: 'Payment verification failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };
  }

  /**
   * Verify payment proof or balance
   */
  private async verifyPayment(
    paymentProofHeader: string,
    userWallet: string,
    requiredAmount: string,
    endpoint: string
  ): Promise<boolean> {
    try {
      if (paymentProofHeader) {
        // Verify payment proof signature
        const paymentProof: PaymentProof = JSON.parse(paymentProofHeader);
        
        const expectedHash = createPaymentHash(
          endpoint,
          paymentProof.payer,
          paymentProof.amount,
          paymentProof.timestamp
        );
        
        return verifyPaymentSignature(
          expectedHash,
          paymentProof.signature,
          paymentProof.payer
        );
      } else if (userWallet && this.requireBalance) {
        // Check user's prepaid balance
        return await this.checkBalance(userWallet, requiredAmount);
      }
      
      return false;
    } catch (error) {
      console.error('Payment verification error:', error);
      return false;
    }
  }

  /**
   * Check user's on-chain balance
   */
  private async checkBalance(userWallet: string, requiredAmount: string): Promise<boolean> {
    if (!this.contract) return false;
    
    try {
      const tokenAddress = getUSDCAddress(this.chain);
      const balance = await this.contract.getUserBalance(userWallet, tokenAddress);
      const required = parseAmount(requiredAmount);
      
      return balance >= BigInt(required);
    } catch (error) {
      console.error('Balance check error:', error);
      return false;
    }
  }

  /**
   * Return payment required response
   */
  private requestPayment(res: Response, price: string, endpoint: string): void {
    const paymentRequest: PaymentRequest = {
      error: 'Payment Required',
      payment: {
        price: price,
        currency: 'USDC',
        endpoint: endpoint,
        apiProvider: this.apiKey,
        paymentMethods: ['balance', 'permit', 'smart-account']
      }
    };
    
    res.status(402).json(paymentRequest);
  }

  /**
   * Record transaction for analytics
   */
  private async recordTransaction(userWallet: string, amount: string, endpoint: string): Promise<void> {
    const transaction = {
      timestamp: Date.now(),
      payer: userWallet,
      amount: amount,
      endpoint: endpoint
    };
    
    this.callHistory.push(transaction);
    
    // Keep only last 1000 transactions
    if (this.callHistory.length > 1000) {
      this.callHistory = this.callHistory.slice(-1000);
    }
  }

  /**
   * Get analytics data
   */
  getAnalytics(): Analytics {
    const totalCalls = this.callHistory.length;
    const totalRevenue = this.callHistory.reduce((sum, call) => {
      return sum + parseFloat(call.amount);
    }, 0).toFixed(6);
    
    const uniqueUsers = new Set(this.callHistory.map(call => call.payer)).size;
    const averagePrice = totalCalls > 0 ? (parseFloat(totalRevenue) / totalCalls).toFixed(6) : '0.00';
    
    return {
      totalCalls,
      totalRevenue,
      uniqueUsers,
      averagePrice,
      recentCalls: this.callHistory.slice(-10)
    };
  }

  /**
   * Withdraw earnings (requires separate wallet connection)
   */
  async withdrawEarnings(signerWallet: ethers.Signer, tokenAddress?: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const token = tokenAddress || getUSDCAddress(this.chain);
    const contractWithSigner = this.contract.connect(signerWallet);
    
    const tx = await contractWithSigner['withdraw'](token);
    return tx.hash;
  }

  /**
   * Check earnings balance
   */
  async checkEarnings(providerAddress: string, tokenAddress?: string): Promise<string> {
    if (!this.contract) throw new Error('Contract not initialized');
    
    const token = tokenAddress || getUSDCAddress(this.chain);
    const balance = await this.contract.getBalance(providerAddress, token);
    
    return formatAmount(balance.toString());
  }

  /**
   * Initialize smart contract connection
   */
  private initializeContract(): void {
    try {
      const contractAddress = getContractAddress(this.chain);
      const provider = new ethers.JsonRpcProvider(this.getRPCUrl());
      
      this.contract = new Contract(contractAddress, CONTRACT_ABI, provider);
    } catch (error) {
      console.warn('Failed to initialize contract:', error);
    }
  }

  /**
   * Get RPC URL for chain
   */
  private getRPCUrl(): string {
    const urls = {
      base: 'https://mainnet.base.org',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      optimism: 'https://mainnet.optimism.io'
    };
    
    return urls[this.chain];
  }

  /**
   * Health check endpoint
   */
  healthCheck() {
    return (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        apiKey: this.apiKey.substring(0, 8) + '...',
        chain: this.chain,
        pricePerQuery: this.pricePerQuery,
        contractConnected: !!this.contract,
        analytics: this.analytics ? this.getAnalytics() : undefined
      });
    };
  }
} 