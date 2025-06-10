import { ethers, Contract } from 'ethers';
import { getContractAddress, CONTRACT_ABI } from '@agentpay/core';
import type { ChainType } from '@agentpay/core';

export interface RegisteredAPI {
  modelId: string;
  name: string;
  description: string;
  category: string;
  owner: string;
  endpoint: string;
  price: string;
  token: string;
  active: boolean;
  totalCalls: number;
  totalRevenue: string;
  rating: number;
  tags: string[];
  examples: APIExample[];
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastChecked: number;
  createdAt: number;
}

export interface APIExample {
  input: any;
  output: any;
  description: string;
}

export interface APIStats {
  totalAPIs: number;
  totalCategories: number;
  topAPIs: RegisteredAPI[];
  recentlyAdded: RegisteredAPI[];
  mostRevenue: RegisteredAPI[];
}

export interface SearchFilters {
  category?: string;
  priceRange?: { min: string; max: string };
  tags?: string[];
  rating?: number;
  sortBy?: 'price' | 'rating' | 'calls' | 'revenue' | 'recent';
  searchTerm?: string;
}

export class APIRegistry {
  private contract: Contract;
  private cache: Map<string, RegisteredAPI> = new Map();
  private lastSync: number = 0;
  private syncInterval: number = 5 * 60 * 1000; // 5 minutes

  constructor(private chain: ChainType = 'base') {
    this.initializeContract();
    this.startAutoSync();
  }

  /**
   * Get all registered APIs with enhanced metadata
   */
  async getAllAPIs(): Promise<RegisteredAPI[]> {
    await this.syncWithContract();
    return Array.from(this.cache.values()).filter(api => api.active);
  }

  /**
   * Search and filter APIs
   */
  async searchAPIs(filters: SearchFilters = {}): Promise<RegisteredAPI[]> {
    const allAPIs = await this.getAllAPIs();
    
    let filtered = allAPIs;

    // Apply filters
    if (filters.category) {
      filtered = filtered.filter(api => 
        api.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      filtered = filtered.filter(api => {
        const price = parseFloat(api.price);
        return price >= parseFloat(min) && price <= parseFloat(max);
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(api => 
        filters.tags!.some(tag => 
          api.tags.some(apiTag => 
            apiTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(api => api.rating >= filters.rating!);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(api =>
        api.name.toLowerCase().includes(term) ||
        api.description.toLowerCase().includes(term) ||
        api.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    // Sort results
    if (filters.sortBy) {
      filtered.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return parseFloat(a.price) - parseFloat(b.price);
          case 'rating':
            return b.rating - a.rating;
          case 'calls':
            return b.totalCalls - a.totalCalls;
          case 'revenue':
            return parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue);
          case 'recent':
            return b.createdAt - a.createdAt;
          default:
            return 0;
        }
      });
    }

    return filtered;
  }

  /**
   * Get API by ID with health check
   */
  async getAPI(modelId: string): Promise<RegisteredAPI | null> {
    await this.syncWithContract();
    const api = this.cache.get(modelId);
    
    if (api) {
      // Perform health check if last check was > 10 minutes ago
      if (Date.now() - api.lastChecked > 10 * 60 * 1000) {
        await this.checkAPIHealth(api);
      }
    }
    
    return api || null;
  }

  /**
   * Get registry statistics
   */
  async getStats(): Promise<APIStats> {
    const allAPIs = await this.getAllAPIs();
    
    const categories = new Set(allAPIs.map(api => api.category));
    const sortedByRevenue = [...allAPIs].sort((a, b) => 
      parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue)
    );
    const sortedByRating = [...allAPIs].sort((a, b) => b.rating - a.rating);
    const sortedByRecent = [...allAPIs].sort((a, b) => b.createdAt - a.createdAt);

    return {
      totalAPIs: allAPIs.length,
      totalCategories: categories.size,
      topAPIs: sortedByRating.slice(0, 10),
      recentlyAdded: sortedByRecent.slice(0, 10),
      mostRevenue: sortedByRevenue.slice(0, 10)
    };
  }

  /**
   * Get APIs by category
   */
  async getAPIsByCategory(category: string): Promise<RegisteredAPI[]> {
    return this.searchAPIs({ category });
  }

  /**
   * Get trending APIs (high activity recently)
   */
  async getTrendingAPIs(limit: number = 10): Promise<RegisteredAPI[]> {
    const allAPIs = await this.getAllAPIs();
    
    // Sort by recent activity (calls in last 24h would be ideal, but we use total calls for now)
    return allAPIs
      .sort((a, b) => {
        // Simple trending score: calls * rating * (1 / days since created)
        const ageA = (Date.now() - a.createdAt) / (1000 * 60 * 60 * 24);
        const ageB = (Date.now() - b.createdAt) / (1000 * 60 * 60 * 24);
        
        const scoreA = (a.totalCalls * a.rating) / Math.max(ageA, 1);
        const scoreB = (b.totalCalls * b.rating) / Math.max(ageB, 1);
        
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  /**
   * Register API with enhanced metadata
   */
  async registerAPI(
    modelId: string,
    metadata: {
      name: string;
      description: string;
      category: string;
      endpoint: string;
      price: string;
      tags: string[];
      examples: APIExample[];
    },
    signer: ethers.Signer
  ): Promise<string> {
    // Register in smart contract first
    const contractWithSigner = this.contract.connect(signer);
    const tokenAddress = this.getUSDCAddress();
    
    const tx = await contractWithSigner.registerModel(
      modelId,
      metadata.endpoint,
      ethers.parseUnits(metadata.price, 6), // USDC has 6 decimals
      tokenAddress
    );
    
    // Store enhanced metadata (in practice, this would go to IPFS or a database)
    const enhancedAPI: RegisteredAPI = {
      modelId,
      name: metadata.name,
      description: metadata.description,
      category: metadata.category,
      owner: await signer.getAddress(),
      endpoint: metadata.endpoint,
      price: metadata.price,
      token: tokenAddress,
      active: true,
      totalCalls: 0,
      totalRevenue: '0',
      rating: 5.0, // Default rating
      tags: metadata.tags,
      examples: metadata.examples,
      healthStatus: 'healthy',
      lastChecked: Date.now(),
      createdAt: Date.now()
    };
    
    this.cache.set(modelId, enhancedAPI);
    
    return tx.hash;
  }

  /**
   * Sync with smart contract
   */
  private async syncWithContract(): Promise<void> {
    if (Date.now() - this.lastSync < this.syncInterval) return;
    
    try {
      // This would typically involve listening to events or querying all models
      // For now, we'll implement a simple sync mechanism
      
      // Get all ModelRegistered events
      const filter = this.contract.filters.ModelRegistered();
      const events = await this.contract.queryFilter(filter, -10000);
      
      for (const event of events) {
        const [modelId, owner, price] = event.args || [];
        
        if (!this.cache.has(modelId)) {
          // Get model details from contract
          const model = await this.contract.getModel(modelId);
          
          // Create basic registry entry (enhanced metadata would come from IPFS/DB)
          const registryEntry: RegisteredAPI = {
            modelId,
            name: this.generateAPIName(modelId),
            description: `API endpoint: ${model.endpoint}`,
            category: this.guessCategory(modelId),
            owner: model.owner,
            endpoint: model.endpoint,
            price: ethers.formatUnits(model.price, 6),
            token: model.token,
            active: model.active,
            totalCalls: Number(model.totalCalls),
            totalRevenue: ethers.formatUnits(model.totalRevenue, 6),
            rating: 5.0,
            tags: this.generateTags(modelId),
            examples: [],
            healthStatus: 'healthy',
            lastChecked: Date.now(),
            createdAt: Date.now()
          };
          
          this.cache.set(modelId, registryEntry);
        }
      }
      
      this.lastSync = Date.now();
    } catch (error) {
      console.error('Error syncing with contract:', error);
    }
  }

  /**
   * Check API health status
   */
  private async checkAPIHealth(api: RegisteredAPI): Promise<void> {
    try {
      const response = await fetch(`${api.endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      if (response.ok) {
        api.healthStatus = 'healthy';
      } else if (response.status >= 500) {
        api.healthStatus = 'down';
      } else {
        api.healthStatus = 'degraded';
      }
    } catch (error) {
      api.healthStatus = 'down';
    }
    
    api.lastChecked = Date.now();
    this.cache.set(api.modelId, api);
  }

  /**
   * Start automatic synchronization
   */
  private startAutoSync(): void {
    setInterval(() => {
      this.syncWithContract();
    }, this.syncInterval);
  }

  /**
   * Initialize contract connection
   */
  private initializeContract(): void {
    const contractAddress = getContractAddress(this.chain);
    const provider = new ethers.JsonRpcProvider(this.getRPCUrl());
    
    this.contract = new Contract(contractAddress, CONTRACT_ABI, provider);
  }

  /**
   * Helper methods
   */
  private generateAPIName(modelId: string): string {
    return modelId.charAt(0).toUpperCase() + modelId.slice(1).replace(/-/g, ' ');
  }

  private guessCategory(modelId: string): string {
    const categories = {
      weather: 'Weather & Environment',
      price: 'Financial Data',
      token: 'Crypto Data',
      ai: 'Artificial Intelligence',
      translate: 'Translation',
      image: 'Image Processing',
      text: 'Text Processing'
    };
    
    const key = Object.keys(categories).find(k => modelId.toLowerCase().includes(k));
    return categories[key as keyof typeof categories] || 'General';
  }

  private generateTags(modelId: string): string[] {
    const words = modelId.toLowerCase().split(/[-_]/);
    return words.filter(word => word.length > 2);
  }

  private getRPCUrl(): string {
    const urls = {
      base: 'https://mainnet.base.org',
      arbitrum: 'https://arb1.arbitrum.io/rpc',
      optimism: 'https://mainnet.optimism.io'
    };
    
    return urls[this.chain];
  }

  private getUSDCAddress(): string {
    const addresses = {
      base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      optimism: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
    };
    
    return addresses[this.chain];
  }
}

// Singleton instance
export const apiRegistry = new APIRegistry(); 