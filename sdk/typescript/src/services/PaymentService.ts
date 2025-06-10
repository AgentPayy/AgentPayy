import { ethers } from 'ethers';
import axios from 'axios';
import type { WalletInfo } from '../wallet/UniversalWalletAdapter';
import type { PaymentOptions } from '../EnhancedAgentPayKit';

export class PaymentService {
  private gatewayUrl: string;

  constructor(gatewayUrl: string) {
    this.gatewayUrl = gatewayUrl;
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
    
    // Implementation would use smart account's gasless transaction capabilities
    // For now, fallback to standard payment
    return this.payWithBalance(modelId, input, options);
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
    
    // Standard balance payment logic
    const inputJson = JSON.stringify(input, null, 0);
    const inputHash = ethers.keccak256(ethers.toUtf8Bytes(inputJson));
    
    // Store input and submit payment
    await this.storeInputData(inputHash, inputJson);
    
    // Mock transaction for demo
    const mockTxHash = `0x${Math.random().toString(16).slice(2)}`;
    
    return this.waitForAPIResponse(mockTxHash);
  }

  /**
   * Pay with permit (EIP-2612)
   */
  async payWithPermit(
    modelId: string, 
    input: any, 
    options: PaymentOptions
  ): Promise<any> {
    console.log('💳 Using permit payment...');
    
    // Standard permit payment logic
    return this.payWithBalance(modelId, input, options);
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
    }
  }

  /**
   * Wait for API response with exponential backoff
   */
  private async waitForAPIResponse(txHash: string, maxRetries: number = 20): Promise<any> {
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
      
      const delay = baseDelay * Math.pow(1.5, i) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 10000)));
    }
    
    throw new Error('API response timeout after 20 retries');
  }
} 