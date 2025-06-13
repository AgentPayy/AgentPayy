import { createClient, RedisClientType } from 'redis';

/**
 * @fileoverview Reputation Service - Manages agent reputation and leaderboards
 * @author AgentPay Team
 * @version 2.0.0
 */

export interface ReputationData {
  address: string;
  totalCalls: number;
  totalRevenue: string;
  successRate: number;
  avgResponseTime: number;
  uniqueModelsUsed: number;
  recentCalls: number; // Last 7 days
  rating: number;
  specialties: string[];
}

/**
 * Service for managing agent reputation and performance metrics
 */
export class ReputationService {
  private redis: RedisClientType;
  private cache = new Map<string, ReputationData>();
  private cacheTimeout = 300000; // 5 minutes

  constructor(redisUrl?: string) {
    this.redis = createClient({ url: redisUrl || 'redis://localhost:6379' });
  }

  /**
   * Initialize Redis connection
   */
  async initialize(): Promise<void> {
    await this.redis.connect();
    console.log('✅ ReputationService connected to Redis');
  }

  /**
   * Get comprehensive reputation data for an address
   * @param address - Agent address to analyze
   * @returns Reputation metrics and statistics
   */
  async getReputationData(address: string): Promise<ReputationData> {
    // Check cache first
    if (this.cache.has(address)) {
      const cached = this.cache.get(address)!;
      // Refresh if older than 5 minutes
      if (Date.now() - cached.rating < this.cacheTimeout) {
        return cached;
      }
    }

    try {
      // Aggregate data from Redis
      let totalCalls = 0;
      let totalRevenue = 0;
      let successfulCalls = 0;
      let responseTimes: number[] = [];
      let modelsUsed = new Set<string>();
      let recentCalls = 0;
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

      // Get all payment events for this address
      const keys = await this.redis.keys(`payment:*:${address}`);
      
      for (const key of keys) {
        const paymentData = await this.redis.get(key);
        if (paymentData) {
          const payment = JSON.parse(paymentData);
          totalCalls++;
          totalRevenue += parseFloat(payment.amount);
          modelsUsed.add(payment.modelId);
          
          if (payment.timestamp > sevenDaysAgo) {
            recentCalls++;
          }
          
          if (payment.success !== false) {
            successfulCalls++;
          }
          
          if (payment.responseTime) {
            responseTimes.push(payment.responseTime);
          }
        }
      }

      const successRate = totalCalls > 0 ? (successfulCalls / totalCalls) * 100 : 0;
      const avgResponseTime = responseTimes.length > 0 ? 
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
      
      // Calculate rating (0-5 scale based on success rate and activity)
      const rating = Math.min(5, (successRate / 100) * 5 * Math.log10(totalCalls + 1));

      const reputation: ReputationData = {
        address,
        totalCalls,
        totalRevenue: totalRevenue.toFixed(6),
        successRate: Math.round(successRate * 100) / 100,
        avgResponseTime: Math.round(avgResponseTime),
        uniqueModelsUsed: modelsUsed.size,
        recentCalls,
        rating: Math.round(rating * 100) / 100,
        specialties: Array.from(modelsUsed).slice(0, 5) // Top 5 models
      };

      // Cache result
      this.cache.set(address, reputation);
      
      return reputation;
    } catch (error) {
      console.error('Error getting reputation data:', error);
      throw new Error('Failed to retrieve reputation data');
    }
  }

  /**
   * Get leaderboard of top-performing agents
   * @param limit - Maximum number of agents to return
   * @returns Array of top agents sorted by performance
   */
  async getLeaderboard(limit: number = 10): Promise<ReputationData[]> {
    try {
      // Get all unique addresses from payments
      const keys = await this.redis.keys('payment:*');
      const addresses = new Set<string>();
      
      for (const key of keys) {
        const parts = key.split(':');
        if (parts.length >= 3) {
          addresses.add(parts[2]); // Extract address from key
        }
      }

      // Get reputation for each address
      const reputations = await Promise.all(
        Array.from(addresses).map(addr => this.getReputationData(addr))
      );

      // Sort by rating * total calls (weighted score)
      return reputations
        .sort((a, b) => (b.rating * b.totalCalls) - (a.rating * a.totalCalls))
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw new Error('Failed to retrieve leaderboard');
    }
  }

  /**
   * Record a new payment for reputation tracking
   * @param address - Agent address
   * @param payment - Payment details
   */
  async recordPayment(address: string, payment: {
    modelId: string;
    amount: string;
    success: boolean;
    responseTime?: number;
    timestamp: number;
  }): Promise<void> {
    try {
      const key = `payment:${payment.timestamp}:${address}`;
      await this.redis.setEx(key, 86400 * 30, JSON.stringify(payment)); // 30 days
      
      // Invalidate cache for this address
      this.cache.delete(address);
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  }

  /**
   * Get reputation score for quick lookups
   * @param address - Agent address
   * @returns Reputation score (0-5)
   */
  async getQuickRating(address: string): Promise<number> {
    const cached = this.cache.get(address);
    if (cached) {
      return cached.rating;
    }

    const reputation = await this.getReputationData(address);
    return reputation.rating;
  }

  /**
   * Get agents by specialty
   * @param specialty - Model/API specialty to filter by
   * @param minRating - Minimum rating threshold
   * @returns Array of agents specializing in the given area
   */
  async getAgentsBySpecialty(specialty: string, minRating: number = 3.0): Promise<ReputationData[]> {
    try {
      const leaderboard = await this.getLeaderboard(50); // Get more for filtering
      
      return leaderboard.filter(agent => 
        agent.specialties.includes(specialty) && agent.rating >= minRating
      );
    } catch (error) {
      console.error('Error getting agents by specialty:', error);
      throw new Error('Failed to retrieve specialist agents');
    }
  }

  /**
   * Clear reputation cache
   */
  clearCache(): void {
    this.cache.clear();
    console.log('📊 Reputation cache cleared');
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.disconnect();
    console.log('🔌 ReputationService disconnected from Redis');
  }
} 