import { ethers } from 'ethers';

export interface Attribution {
  recipient: string;
  basisPoints: number; // out of 10000 (100%)
}

/**
 * @fileoverview Attribution Module - Handles multi-party revenue attribution
 * @author AgentPayy Team
 * @version 2.0.0
 */

export interface AttributionOptions {
  attributions: Attribution[];
  validateSplits?: boolean;
  allowEmptyAttributions?: boolean;
}

/**
 * Manages multi-party revenue attribution for complex agent workflows
 */
export class AttributionModule {
  private gatewayUrl: string;

  constructor(gatewayUrl: string) {
    this.gatewayUrl = gatewayUrl;
  }

  /**
   * Pay with multi-party attribution splits
   * @param modelId - API model identifier
   * @param input - Input data
   * @param attributions - Revenue attribution splits
   * @param options - Payment options
   * @returns Payment result with attribution tracking
   */
  async payWithAttribution(
    modelId: string,
    input: any,
    attributions: Attribution[],
    options: {
      price: string;
      deadline?: number;
      mock?: boolean;
      chain?: string;
    }
  ): Promise<{
    success: boolean;
    txHash?: string;
    attributions: Attribution[];
    totalAmount: string;
    error?: string;
  }> {
    try {
      // Validate attribution splits
      this.validateAttributions(attributions);

      const inputHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(input)));
      const deadline = options.deadline || Math.floor(Date.now() / 1000) + 3600; // 1 hour

      if (options.mock) {
        return this.mockAttributedPayment(modelId, attributions, options.price);
      }

      // Call attribution contract or gateway
      const response = await fetch(`${this.gatewayUrl}/attribution/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId,
          inputHash,
          amount: options.price,
          deadline,
          attributions,
          chain: options.chain || 'polygon'
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Attribution payment failed');
      }

      return {
        success: true,
        txHash: result.txHash,
        attributions,
        totalAmount: options.price,
      };
    } catch (error) {
      console.error('Attribution payment error:', error);
      return {
        success: false,
        attributions,
        totalAmount: options.price,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create attribution splits for a workflow
   * @param workflow - Workflow configuration
   * @returns Attribution array
   */
  createWorkflowAttributions(workflow: {
    agents: Array<{
      address: string;
      role: string;
      share: number; // percentage (0-100)
    }>;
  }): Attribution[] {
    const attributions: Attribution[] = [];
    let totalShare = 0;

    // Convert percentages to basis points and validate
    for (const agent of workflow.agents) {
      if (agent.share <= 0 || agent.share > 100) {
        throw new Error(`Invalid share for ${agent.role}: ${agent.share}%`);
      }

      const basisPoints = Math.round(agent.share * 100); // Convert to basis points
      attributions.push({
        recipient: agent.address,
        basisPoints
      });

      totalShare += agent.share;
    }

    if (Math.abs(totalShare - 100) > 0.01) { // Allow small floating point errors
      throw new Error(`Workflow shares must sum to 100%, got ${totalShare}%`);
    }

    return attributions;
  }

  /**
   * Create attribution for common agent patterns
   * @param pattern - Pre-defined attribution pattern
   * @param addresses - Agent addresses
   * @returns Attribution array
   */
  createPatternAttributions(
    pattern: 'equal' | 'data-heavy' | 'analysis-heavy' | 'custom',
    addresses: {
      dataAgent?: string;
      analysisAgent?: string;
      summaryAgent?: string;
      [key: string]: string | undefined;
    },
    customShares?: { [address: string]: number }
  ): Attribution[] {
    const patterns = {
      'equal': () => {
        const agents = Object.values(addresses).filter(Boolean);
        const sharePerAgent = 10000 / agents.length; // Equal split in basis points
        return agents.map(address => ({
          recipient: address!,
          basisPoints: Math.floor(sharePerAgent)
        }));
      },

      'data-heavy': () => {
        if (!addresses.dataAgent || !addresses.analysisAgent) {
          throw new Error('Data-heavy pattern requires dataAgent and analysisAgent');
        }
        return [
          { recipient: addresses.dataAgent, basisPoints: 6000 }, // 60%
          { recipient: addresses.analysisAgent, basisPoints: 4000 } // 40%
        ];
      },

      'analysis-heavy': () => {
        if (!addresses.dataAgent || !addresses.analysisAgent) {
          throw new Error('Analysis-heavy pattern requires dataAgent and analysisAgent');
        }
        return [
          { recipient: addresses.dataAgent, basisPoints: 3000 }, // 30%
          { recipient: addresses.analysisAgent, basisPoints: 7000 } // 70%
        ];
      },

      'custom': () => {
        if (!customShares) {
          throw new Error('Custom pattern requires customShares');
        }
        
        const totalShare = Object.values(customShares).reduce((sum, share) => sum + share, 0);
        if (Math.abs(totalShare - 100) > 0.01) {
          throw new Error(`Custom shares must sum to 100%, got ${totalShare}%`);
        }

        return Object.entries(customShares).map(([address, share]) => ({
          recipient: address,
          basisPoints: Math.round(share * 100)
        }));
      }
    };

    return patterns[pattern]();
  }

  /**
   * Validate attribution splits
   * @param attributions - Attribution array to validate
   */
  private validateAttributions(attributions: Attribution[]): void {
    if (attributions.length === 0) {
      throw new Error('At least one attribution recipient required');
    }

    if (attributions.length > 10) {
      throw new Error('Maximum 10 attribution recipients allowed');
    }

    let totalBasisPoints = 0;
    const seenAddresses = new Set<string>();

    for (const attribution of attributions) {
      // Validate address
      if (!ethers.isAddress(attribution.recipient)) {
        throw new Error(`Invalid recipient address: ${attribution.recipient}`);
      }

      // Check for duplicates
      if (seenAddresses.has(attribution.recipient)) {
        throw new Error(`Duplicate recipient address: ${attribution.recipient}`);
      }
      seenAddresses.add(attribution.recipient);

      // Validate basis points
      if (attribution.basisPoints <= 0 || attribution.basisPoints > 10000) {
        throw new Error(`Invalid basis points: ${attribution.basisPoints}`);
      }

      totalBasisPoints += attribution.basisPoints;
    }

    // Must sum to exactly 100% (10000 basis points)
    if (totalBasisPoints !== 10000) {
      throw new Error(`Attribution must sum to 100% (10000 basis points), got ${totalBasisPoints}`);
    }
  }

  /**
   * Mock attribution payment for testing
   * @param modelId - Model identifier
   * @param attributions - Attribution splits
   * @param amount - Payment amount
   * @returns Mock payment result
   */
  private mockAttributedPayment(
    modelId: string,
    attributions: Attribution[],
    amount: string
  ): Promise<{
    success: boolean;
    txHash: string;
    attributions: Attribution[];
    totalAmount: string;
  }> {
    console.log(`🧪 MOCK: Attribution payment for ${modelId}`);
    console.log(`💰 Amount: ${amount} tokens distributed to ${attributions.length} recipients`);
    
    for (const attr of attributions) {
      const recipientAmount = (parseFloat(amount) * attr.basisPoints / 10000).toFixed(6);
      console.log(`   └─ ${attr.recipient}: ${recipientAmount} tokens (${attr.basisPoints/100}%)`);
    }

    return Promise.resolve({
      success: true,
      txHash: `0x${ethers.hexlify(ethers.randomBytes(32)).slice(2)}`,
      attributions,
      totalAmount: amount
    });
  }

  /**
   * Get attribution balance for an address
   * @param address - Address to check
   * @param token - Token address (optional)
   * @returns Attribution balance
   */
  async getAttributionBalance(address: string, token?: string): Promise<{
    balance: string;
    token: string;
    pendingAttributions: number;
  }> {
    try {
      const response = await fetch(
        `${this.gatewayUrl}/attribution/balance/${address}${token ? `?token=${token}` : ''}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get attribution balance');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting attribution balance:', error);
      return {
        balance: '0',
        token: token || 'USDC',
        pendingAttributions: 0
      };
    }
  }

  /**
   * Get attribution history for an address
   * @param address - Address to check
   * @param limit - Maximum number of attributions to return
   * @returns Attribution history
   */
  async getAttributionHistory(address: string, limit: number = 20): Promise<Array<{
    txHash: string;
    modelId: string;
    amount: string;
    percentage: number;
    timestamp: number;
    status: 'completed' | 'pending';
  }>> {
    try {
      const response = await fetch(
        `${this.gatewayUrl}/attribution/history/${address}?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get attribution history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting attribution history:', error);
      return [];
    }
  }

  /**
   * Withdraw attributed earnings
   * @param token - Token address to withdraw
   * @returns Withdrawal result
   */
  async withdrawAttributions(token: string): Promise<{
    success: boolean;
    txHash?: string;
    amount?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.gatewayUrl}/attribution/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      return {
        success: true,
        txHash: result.txHash,
        amount: result.amount
      };
    } catch (error) {
      console.error('Attribution withdrawal error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
} 