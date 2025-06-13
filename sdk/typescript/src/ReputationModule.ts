/**
 * @fileoverview Reputation Module - Handles agent reputation and discovery
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
  recentCalls: number;
  rating: number;
  specialties: string[];
}

export interface AgentProfile {
  address: string;
  reputation: ReputationData;
  services: string[];
  pricing: { [service: string]: string };
  availability: 'online' | 'offline' | 'busy';
  description?: string;
}

/**
 * Manages agent reputation, discovery, and marketplace functionality
 */
export class ReputationModule {
  private gatewayUrl: string;

  constructor(gatewayUrl: string) {
    this.gatewayUrl = gatewayUrl;
  }

  /**
   * Get reputation data for an agent
   * @param address - Agent address
   * @returns Comprehensive reputation metrics
   */
  async getReputation(address: string): Promise<ReputationData> {
    try {
      const response = await fetch(`${this.gatewayUrl}/reputation/${address}`);
      
      if (!response.ok) {
        throw new Error('Failed to get reputation data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting reputation:', error);
      
      // Return default reputation for new agents
      return {
        address,
        totalCalls: 0,
        totalRevenue: '0',
        successRate: 0,
        avgResponseTime: 0,
        uniqueModelsUsed: 0,
        recentCalls: 0,
        rating: 0,
        specialties: []
      };
    }
  }

  /**
   * Get leaderboard of top agents
   * @param limit - Maximum number of agents to return
   * @returns Array of top-performing agents
   */
  async getLeaderboard(limit: number = 10): Promise<ReputationData[]> {
    try {
      const response = await fetch(`${this.gatewayUrl}/leaderboard?limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Failed to get leaderboard');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      return [];
    }
  }

  /**
   * Find agents by specialty
   * @param specialty - Service/API specialty to search for
   * @param minRating - Minimum reputation rating (0-5)
   * @returns Array of specialist agents
   */
  async findAgentsBySpecialty(specialty: string, minRating: number = 3.0): Promise<ReputationData[]> {
    try {
      const response = await fetch(
        `${this.gatewayUrl}/agents/specialty/${encodeURIComponent(specialty)}?minRating=${minRating}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to find specialist agents');
      }

      return await response.json();
    } catch (error) {
      console.error('Error finding specialist agents:', error);
      return [];
    }
  }

  /**
   * Get comprehensive agent profile
   * @param address - Agent address
   * @returns Full agent profile with reputation and services
   */
  async getAgentProfile(address: string): Promise<AgentProfile | null> {
    try {
      const reputation = await this.getReputation(address);
      
      // Additional profile data could come from a separate endpoint
      // For now, construct a basic profile from reputation data
      return {
        address,
        reputation,
        services: reputation.specialties,
        pricing: {}, // Would be populated from separate service registry
        availability: reputation.recentCalls > 0 ? 'online' : 'offline'
      };
    } catch (error) {
      console.error('Error getting agent profile:', error);
      return null;
    }
  }

  /**
   * Search for agents by multiple criteria
   * @param criteria - Search criteria
   * @returns Array of matching agents
   */
  async searchAgents(criteria: {
    specialties?: string[];
    minRating?: number;
    maxPrice?: string;
    availability?: 'online' | 'offline' | 'any';
    sortBy?: 'rating' | 'price' | 'activity' | 'responseTime';
  }): Promise<ReputationData[]> {
    try {
      // If specialties specified, search by each specialty and combine
      if (criteria.specialties && criteria.specialties.length > 0) {
        const specialtyResults = await Promise.all(
          criteria.specialties.map(specialty => 
            this.findAgentsBySpecialty(specialty, criteria.minRating || 0)
          )
        );
        
        // Combine and deduplicate results
        const combined = new Map<string, ReputationData>();
        for (const results of specialtyResults) {
          for (const agent of results) {
            combined.set(agent.address, agent);
          }
        }
        
        let agents = Array.from(combined.values());
        
        // Apply additional filters
        if (criteria.minRating) {
          agents = agents.filter(agent => agent.rating >= criteria.minRating!);
        }
        
        // Apply sorting
        if (criteria.sortBy) {
          agents = this.sortAgents(agents, criteria.sortBy);
        }
        
        return agents;
      } else {
        // Get general leaderboard and filter
        const agents = await this.getLeaderboard(50); // Get more for filtering
        
        return agents.filter(agent => {
          if (criteria.minRating && agent.rating < criteria.minRating) return false;
          // Add more filters as needed
          return true;
        });
      }
    } catch (error) {
      console.error('Error searching agents:', error);
      return [];
    }
  }

  /**
   * Sort agents by specified criteria
   * @param agents - Array of agents to sort
   * @param sortBy - Sort criteria
   * @returns Sorted array of agents
   */
  private sortAgents(agents: ReputationData[], sortBy: string): ReputationData[] {
    const sortFunctions = {
      'rating': (a: ReputationData, b: ReputationData) => b.rating - a.rating,
      'activity': (a: ReputationData, b: ReputationData) => b.recentCalls - a.recentCalls,
      'responseTime': (a: ReputationData, b: ReputationData) => a.avgResponseTime - b.avgResponseTime,
      'price': () => 0 // Would need pricing data
    };

    const sortFn = sortFunctions[sortBy as keyof typeof sortFunctions];
    return sortFn ? [...agents].sort(sortFn) : agents;
  }

  /**
   * Get reputation statistics across the platform
   * @returns Platform-wide reputation statistics
   */
  async getPlatformStats(): Promise<{
    totalAgents: number;
    avgRating: number;
    totalTransactions: number;
    activeAgents: number; // active in last 7 days
    topSpecialties: Array<{ name: string; agentCount: number }>;
  }> {
    try {
      const leaderboard = await this.getLeaderboard(100); // Get more agents for stats
      
      const totalAgents = leaderboard.length;
      const avgRating = totalAgents > 0 
        ? leaderboard.reduce((sum, agent) => sum + agent.rating, 0) / totalAgents 
        : 0;
      
      const totalTransactions = leaderboard.reduce((sum, agent) => sum + agent.totalCalls, 0);
      const activeAgents = leaderboard.filter(agent => agent.recentCalls > 0).length;
      
      // Count specialties
      const specialtyCount = new Map<string, number>();
      for (const agent of leaderboard) {
        for (const specialty of agent.specialties) {
          specialtyCount.set(specialty, (specialtyCount.get(specialty) || 0) + 1);
        }
      }
      
      const topSpecialties = Array.from(specialtyCount.entries())
        .map(([name, agentCount]) => ({ name, agentCount }))
        .sort((a, b) => b.agentCount - a.agentCount)
        .slice(0, 10);

      return {
        totalAgents,
        avgRating: Math.round(avgRating * 100) / 100,
        totalTransactions,
        activeAgents,
        topSpecialties
      };
    } catch (error) {
      console.error('Error getting platform stats:', error);
      return {
        totalAgents: 0,
        avgRating: 0,
        totalTransactions: 0,
        activeAgents: 0,
        topSpecialties: []
      };
    }
  }

  /**
   * Get recommended agents for a specific task
   * @param taskDescription - Description of the task
   * @param requirements - Task requirements
   * @returns Array of recommended agents
   */
  async getRecommendations(
    taskDescription: string,
    requirements: {
      minRating?: number;
      maxResponseTime?: number;
      preferredSpecialties?: string[];
      budget?: string;
    } = {}
  ): Promise<ReputationData[]> {
    try {
      // If preferred specialties are specified, use them
      if (requirements.preferredSpecialties && requirements.preferredSpecialties.length > 0) {
        return await this.searchAgents({
          specialties: requirements.preferredSpecialties,
          minRating: requirements.minRating || 3.0,
          sortBy: 'rating'
        });
      }
      
      // Otherwise, return top-rated active agents
      const agents = await this.getLeaderboard(20);
      
      return agents.filter(agent => {
        if (requirements.minRating && agent.rating < requirements.minRating) return false;
        if (requirements.maxResponseTime && agent.avgResponseTime > requirements.maxResponseTime) return false;
        if (agent.recentCalls === 0) return false; // Only active agents
        return true;
      }).slice(0, 5); // Top 5 recommendations
    } catch (error) {
      console.error('Error getting recommendations:', error);
      return [];
    }
  }

  /**
   * Check if an agent is reliable for a specific service
   * @param address - Agent address
   * @param service - Service name to check
   * @returns Reliability assessment
   */
  async checkReliability(address: string, service?: string): Promise<{
    reliable: boolean;
    confidence: number; // 0-1
    reasons: string[];
    recommendation: 'use' | 'caution' | 'avoid';
  }> {
    try {
      const reputation = await this.getReputation(address);
      
      const reasons: string[] = [];
      let confidence = 0;
      let reliable = false;
      
      // Check success rate
      if (reputation.successRate >= 95) {
        reasons.push('High success rate');
        confidence += 0.3;
      } else if (reputation.successRate < 80) {
        reasons.push('Low success rate');
        confidence -= 0.3;
      }
      
      // Check experience
      if (reputation.totalCalls >= 100) {
        reasons.push('Experienced (100+ calls)');
        confidence += 0.2;
      } else if (reputation.totalCalls < 10) {
        reasons.push('Limited experience');
        confidence -= 0.2;
      }
      
      // Check recent activity
      if (reputation.recentCalls > 0) {
        reasons.push('Recently active');
        confidence += 0.2;
      } else {
        reasons.push('Inactive recently');
        confidence -= 0.1;
      }
      
      // Check service specialty
      if (service && reputation.specialties.includes(service)) {
        reasons.push(`Specializes in ${service}`);
        confidence += 0.3;
      }
      
      // Check response time
      if (reputation.avgResponseTime > 0 && reputation.avgResponseTime < 5000) { // < 5 seconds
        reasons.push('Fast response time');
        confidence += 0.1;
      }
      
      reliable = confidence > 0.3 && reputation.rating >= 3.0;
      confidence = Math.max(0, Math.min(1, confidence));
      
      let recommendation: 'use' | 'caution' | 'avoid';
      if (reliable && confidence > 0.7) {
        recommendation = 'use';
      } else if (reliable || confidence > 0.3) {
        recommendation = 'caution';
      } else {
        recommendation = 'avoid';
      }
      
      return {
        reliable,
        confidence,
        reasons,
        recommendation
      };
    } catch (error) {
      console.error('Error checking reliability:', error);
      return {
        reliable: false,
        confidence: 0,
        reasons: ['Unable to verify reliability'],
        recommendation: 'avoid'
      };
    }
  }
} 