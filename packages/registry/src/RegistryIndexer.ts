import { ethers, Contract } from 'ethers';

export interface IndexedAPI {
  // Core data from smart contract
  modelId: string;
  owner: string;
  endpoint: string;
  pricePerCall: string;
  paymentToken: string;
  isActive: boolean;
  totalCalls: number;
  totalRevenue: string;
  registeredAt: number;
  category: string;
  tags: string[];
  
  // Enhanced metadata (from indexer)
  name: string;
  description: string;
  logoUrl?: string;
  documentationUrl?: string;
  exampleRequests: ExampleRequest[];
  rating: number;
  ratingCount: number;
  healthStatus: 'healthy' | 'degraded' | 'down';
  lastHealthCheck: number;
  responseTimeMs: number;
  uptimePercentage: number;
  
  // Discovery metadata
  featured: boolean;
  trending: boolean;
  verified: boolean;
  searchScore: number;
}

export interface ExampleRequest {
  name: string;
  description: string;
  input: any;
  expectedOutput: any;
  curlExample: string;
}

export interface SearchFilters {
  category?: string;
  priceRange?: { min: string; max: string };
  tags?: string[];
  minRating?: number;
  sortBy?: 'price' | 'rating' | 'calls' | 'revenue' | 'recent' | 'trending';
  query?: string;
  onlyActive?: boolean;
  verified?: boolean;
}

export interface RegistryStats {
  totalAPIs: number;
  totalCategories: number;
  totalDevelopers: number;
  totalCalls: number;
  totalRevenue: string;
  topCategories: Array<{ category: string; count: number }>;
  recentRegistrations: IndexedAPI[];
  trending: IndexedAPI[];
  featured: IndexedAPI[];
}

export class RegistryIndexer {
  private contract: Contract;
  private database: Map<string, IndexedAPI> = new Map();
  private provider: ethers.Provider;
  private isIndexing = false;
  
  constructor(contractAddress: string, provider: ethers.Provider) {
    this.provider = provider;
    this.contract = new Contract(contractAddress, this.getABI(), provider);
    this.startIndexing();
  }

  /**
   * Start listening to contract events and indexing
   */
  private async startIndexing(): Promise<void> {
    if (this.isIndexing) return;
    this.isIndexing = true;

    console.log('🔍 Starting registry indexing...');

    // Index historical events
    await this.indexHistoricalEvents();

    // Listen for new events
    this.contract.on('APIRegistered', this.handleAPIRegistered.bind(this));
    this.contract.on('APIUpdated', this.handleAPIUpdated.bind(this));
    this.contract.on('APICallProcessed', this.handleAPICallProcessed.bind(this));

    // Start background tasks
    this.startBackgroundTasks();

    console.log('✅ Registry indexing started');
  }

  /**
   * Index all historical events
   */
  private async indexHistoricalEvents(): Promise<void> {
    try {
      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Last ~10k blocks

      console.log(`📚 Indexing events from block ${fromBlock} to ${currentBlock}`);

      // Get all APIRegistered events
      const registeredEvents = await this.contract.queryFilter(
        this.contract.filters.APIRegistered(),
        fromBlock,
        currentBlock
      );

      for (const event of registeredEvents) {
        await this.handleAPIRegistered(...(event.args || []));
      }

      // Get all APICallProcessed events for stats
      const callEvents = await this.contract.queryFilter(
        this.contract.filters.APICallProcessed(),
        fromBlock,
        currentBlock
      );

      for (const event of callEvents) {
        await this.handleAPICallProcessed(...(event.args || []));
      }

      console.log(`✅ Indexed ${registeredEvents.length} APIs and ${callEvents.length} calls`);
    } catch (error) {
      console.error('❌ Error indexing historical events:', error);
    }
  }

  /**
   * Handle new API registration
   */
  private async handleAPIRegistered(
    modelId: string,
    owner: string,
    endpoint: string,
    pricePerCall: bigint,
    category: string,
    tags: string[],
    timestamp: bigint
  ): Promise<void> {
    console.log(`📝 New API registered: ${modelId}`);

    // Fetch additional data from contract
    const apiData = await this.contract.getAPI(modelId);

    // Create enhanced API entry
    const indexedAPI: IndexedAPI = {
      // Core contract data
      modelId,
      owner,
      endpoint,
      pricePerCall: ethers.formatUnits(pricePerCall, 6), // USDC has 6 decimals
      paymentToken: apiData.paymentToken,
      isActive: apiData.isActive,
      totalCalls: Number(apiData.totalCalls),
      totalRevenue: ethers.formatUnits(apiData.totalRevenue, 6),
      registeredAt: Number(timestamp),
      category,
      tags,

      // Enhanced metadata (would come from IPFS or API in production)
      name: this.generateAPIName(modelId),
      description: this.generateDescription(modelId, category),
      exampleRequests: this.generateExamples(modelId, category),
      rating: 5.0, // Default rating
      ratingCount: 0,
      healthStatus: 'healthy',
      lastHealthCheck: Date.now(),
      responseTimeMs: 0,
      uptimePercentage: 100,

      // Discovery metadata
      featured: false,
      trending: false,
      verified: false,
      searchScore: this.calculateSearchScore(modelId, category, tags)
    };

    // Store in database
    this.database.set(modelId, indexedAPI);

    // Perform health check
    await this.performHealthCheck(modelId);
  }

  /**
   * Handle API updates
   */
  private async handleAPIUpdated(
    modelId: string,
    endpoint: string,
    pricePerCall: bigint,
    isActive: boolean,
    category: string
  ): Promise<void> {
    const existing = this.database.get(modelId);
    if (!existing) return;

    // Update the stored API
    existing.endpoint = endpoint;
    existing.pricePerCall = ethers.formatUnits(pricePerCall, 6);
    existing.isActive = isActive;
    existing.category = category;

    this.database.set(modelId, existing);

    // Re-check health if endpoint changed
    await this.performHealthCheck(modelId);
  }

  /**
   * Handle API call events (for statistics)
   */
  private async handleAPICallProcessed(
    modelId: string,
    caller: string,
    amount: bigint,
    timestamp: bigint
  ): Promise<void> {
    const api = this.database.get(modelId);
    if (!api) return;

    // Update stats
    api.totalCalls++;
    api.totalRevenue = (parseFloat(api.totalRevenue) + parseFloat(ethers.formatUnits(amount, 6))).toFixed(6);

    // Update trending status
    api.trending = this.isTrending(api);

    this.database.set(modelId, api);
  }

  /**
   * Search APIs with filters
   */
  public searchAPIs(filters: SearchFilters = {}): IndexedAPI[] {
    let results = Array.from(this.database.values());

    // Apply filters
    if (filters.onlyActive !== false) {
      results = results.filter(api => api.isActive);
    }

    if (filters.category) {
      results = results.filter(api => 
        api.category.toLowerCase() === filters.category!.toLowerCase()
      );
    }

    if (filters.priceRange) {
      const { min, max } = filters.priceRange;
      results = results.filter(api => {
        const price = parseFloat(api.pricePerCall);
        return price >= parseFloat(min) && price <= parseFloat(max);
      });
    }

    if (filters.tags && filters.tags.length > 0) {
      results = results.filter(api =>
        filters.tags!.some(tag =>
          api.tags.some(apiTag => 
            apiTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    if (filters.minRating) {
      results = results.filter(api => api.rating >= filters.minRating!);
    }

    if (filters.verified) {
      results = results.filter(api => api.verified);
    }

    if (filters.query) {
      const query = filters.query.toLowerCase();
      results = results.filter(api =>
        api.name.toLowerCase().includes(query) ||
        api.description.toLowerCase().includes(query) ||
        api.tags.some(tag => tag.toLowerCase().includes(query)) ||
        api.modelId.toLowerCase().includes(query)
      );
    }

    // Sort results
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'price':
            return parseFloat(a.pricePerCall) - parseFloat(b.pricePerCall);
          case 'rating':
            return b.rating - a.rating;
          case 'calls':
            return b.totalCalls - a.totalCalls;
          case 'revenue':
            return parseFloat(b.totalRevenue) - parseFloat(a.totalRevenue);
          case 'recent':
            return b.registeredAt - a.registeredAt;
          case 'trending':
            return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
          default:
            return 0;
        }
      });
    }

    return results;
  }

  /**
   * Get registry statistics
   */
  public getStats(): RegistryStats {
    const apis = Array.from(this.database.values());
    const activeAPIs = apis.filter(api => api.isActive);

    // Calculate category distribution
    const categoryCount = new Map<string, number>();
    activeAPIs.forEach(api => {
      categoryCount.set(api.category, (categoryCount.get(api.category) || 0) + 1);
    });

    const topCategories = Array.from(categoryCount.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Get recent and trending
    const recent = activeAPIs
      .sort((a, b) => b.registeredAt - a.registeredAt)
      .slice(0, 10);

    const trending = activeAPIs
      .filter(api => api.trending)
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 10);

    const featured = activeAPIs.filter(api => api.featured);

    return {
      totalAPIs: activeAPIs.length,
      totalCategories: categoryCount.size,
      totalDevelopers: new Set(activeAPIs.map(api => api.owner)).size,
      totalCalls: activeAPIs.reduce((sum, api) => sum + api.totalCalls, 0),
      totalRevenue: activeAPIs.reduce((sum, api) => sum + parseFloat(api.totalRevenue), 0).toFixed(6),
      topCategories,
      recentRegistrations: recent,
      trending,
      featured
    };
  }

  /**
   * Get API by ID
   */
  public getAPI(modelId: string): IndexedAPI | undefined {
    return this.database.get(modelId);
  }

  /**
   * Get all APIs (paginated)
   */
  public getAllAPIs(offset = 0, limit = 50): IndexedAPI[] {
    const apis = Array.from(this.database.values())
      .filter(api => api.isActive)
      .sort((a, b) => b.registeredAt - a.registeredAt);
    
    return apis.slice(offset, offset + limit);
  }

  /**
   * Background tasks
   */
  private startBackgroundTasks(): void {
    // Health checks every 5 minutes
    setInterval(() => {
      this.performBatchHealthChecks();
    }, 5 * 60 * 1000);

    // Update trending APIs every hour
    setInterval(() => {
      this.updateTrendingAPIs();
    }, 60 * 60 * 1000);
  }

  /**
   * Perform health check on an API
   */
  private async performHealthCheck(modelId: string): Promise<void> {
    const api = this.database.get(modelId);
    if (!api) return;

    try {
      const start = Date.now();
      const response = await fetch(`${api.endpoint}/health`, {
        method: 'GET',
        timeout: 5000
      });
      const responseTime = Date.now() - start;

      if (response.ok) {
        api.healthStatus = 'healthy';
        api.responseTimeMs = responseTime;
        api.uptimePercentage = Math.min(100, api.uptimePercentage + 0.1);
      } else {
        api.healthStatus = response.status >= 500 ? 'down' : 'degraded';
        api.uptimePercentage = Math.max(0, api.uptimePercentage - 1);
      }
    } catch (error) {
      api.healthStatus = 'down';
      api.uptimePercentage = Math.max(0, api.uptimePercentage - 2);
    }

    api.lastHealthCheck = Date.now();
    this.database.set(modelId, api);
  }

  /**
   * Batch health checks
   */
  private async performBatchHealthChecks(): Promise<void> {
    const apis = Array.from(this.database.values());
    const staleAPIs = apis.filter(api => 
      Date.now() - api.lastHealthCheck > 10 * 60 * 1000 // 10 minutes
    );

    console.log(`🏥 Performing health checks on ${staleAPIs.length} APIs`);

    // Check in batches to avoid overwhelming
    for (let i = 0; i < staleAPIs.length; i += 5) {
      const batch = staleAPIs.slice(i, i + 5);
      await Promise.all(
        batch.map(api => this.performHealthCheck(api.modelId))
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  /**
   * Update trending status
   */
  private updateTrendingAPIs(): void {
    const apis = Array.from(this.database.values());
    
    apis.forEach(api => {
      api.trending = this.isTrending(api);
      this.database.set(api.modelId, api);
    });

    console.log(`📈 Updated trending status for ${apis.length} APIs`);
  }

  /**
   * Helper methods
   */
  private generateAPIName(modelId: string): string {
    return modelId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private generateDescription(modelId: string, category: string): string {
    const templates = {
      'Weather & Environment': `Get real-time weather data and environmental information`,
      'AI & Machine Learning': `AI-powered analysis and machine learning capabilities`,
      'Financial Data': `Access financial markets and economic data`,
      'Crypto & Blockchain': `Cryptocurrency prices and blockchain data`,
      'Image Processing': `Image analysis and processing services`,
      'Text Processing': `Text analysis, NLP, and content processing`,
      'Translation': `Language translation and localization services`,
      'General': `API services and data access`
    };

    return templates[category as keyof typeof templates] || templates['General'];
  }

  private generateExamples(modelId: string, category: string): ExampleRequest[] {
    // Would generate category-specific examples
    return [
      {
        name: 'Basic Request',
        description: 'Simple API call example',
        input: { query: 'example' },
        expectedOutput: { result: 'success' },
        curlExample: `curl -X POST ${this.database.get(modelId)?.endpoint} -H "Content-Type: application/json" -d '{"query":"example"}'`
      }
    ];
  }

  private calculateSearchScore(modelId: string, category: string, tags: string[]): number {
    // Simple scoring algorithm
    let score = 1.0;
    
    // Boost popular categories
    const popularCategories = ['AI & Machine Learning', 'Financial Data', 'Weather & Environment'];
    if (popularCategories.includes(category)) {
      score += 0.2;
    }

    // Boost APIs with more tags
    score += Math.min(tags.length * 0.1, 0.5);

    return score;
  }

  private isTrending(api: IndexedAPI): boolean {
    // Simple trending algorithm
    const recentCalls = api.totalCalls; // Would use time-based data in production
    const avgPrice = parseFloat(api.pricePerCall);
    const ageInDays = (Date.now() - api.registeredAt * 1000) / (1000 * 60 * 60 * 24);
    
    const trendingScore = (recentCalls * avgPrice) / Math.max(ageInDays, 1);
    return trendingScore > 10; // Threshold for trending
  }

  private getABI(): string[] {
    // Simplified ABI for the events we need
    return [
      'event APIRegistered(string indexed modelId, address indexed owner, string endpoint, uint256 pricePerCall, string category, string[] tags, uint256 timestamp)',
      'event APIUpdated(string indexed modelId, string endpoint, uint256 pricePerCall, bool isActive, string category)',
      'event APICallProcessed(string indexed modelId, address indexed caller, uint256 amount, uint256 timestamp)',
      'function getAPI(string calldata modelId) external view returns (tuple(address owner, string endpoint, uint256 pricePerCall, address paymentToken, bool isActive, uint256 totalCalls, uint256 totalRevenue, uint256 registeredAt, string category, string[] tags))'
    ];
  }
}

// Singleton instance
export const registryIndexer = new RegistryIndexer(
  process.env.REGISTRY_CONTRACT_ADDRESS || '0x...',
  new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.base.org')
); 