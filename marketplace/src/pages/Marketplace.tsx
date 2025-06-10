import React, { useState, useEffect } from 'react';
import { Search, Filter, Star, Activity, DollarSign, Clock, Shield, ExternalLink } from 'lucide-react';
import { apiRegistry, RegisteredAPI, SearchFilters, APIStats } from '@agentpay/registry';

interface MarketplaceProps {}

export const Marketplace: React.FC<MarketplaceProps> = () => {
  const [apis, setAPIs] = useState<RegisteredAPI[]>([]);
  const [filteredAPIs, setFilteredAPIs] = useState<RegisteredAPI[]>([]);
  const [stats, setStats] = useState<APIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '0', max: '1' });
  const [sortBy, setSortBy] = useState<SearchFilters['sortBy']>('rating');

  const categories = [
    'all',
    'Weather & Environment',
    'Financial Data',
    'Crypto Data',
    'Artificial Intelligence',
    'Translation',
    'Image Processing',
    'Text Processing',
    'General'
  ];

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedCategory, priceRange, sortBy, apis]);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      const [allAPIs, marketplaceStats] = await Promise.all([
        apiRegistry.getAllAPIs(),
        apiRegistry.getStats()
      ]);
      
      setAPIs(allAPIs);
      setStats(marketplaceStats);
    } catch (error) {
      console.error('Error loading marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = async () => {
    const filters: SearchFilters = {
      searchTerm: searchTerm || undefined,
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      priceRange: { min: priceRange.min, max: priceRange.max },
      sortBy
    };

    const filtered = await apiRegistry.searchAPIs(filters);
    setFilteredAPIs(filtered);
  };

  const formatPrice = (price: string): string => {
    return `$${parseFloat(price).toFixed(4)} USDC`;
  };

  const getHealthBadge = (status: RegisteredAPI['healthStatus']) => {
    const colors = {
      healthy: 'bg-green-100 text-green-800',
      degraded: 'bg-yellow-100 text-yellow-800',
      down: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const renderAPICard = (api: RegisteredAPI) => (
    <div
      key={api.modelId}
      className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{api.name}</h3>
          <p className="text-gray-600 text-sm mb-2">{api.description}</p>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              {api.category}
            </span>
            {getHealthBadge(api.healthStatus)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600 mb-1">
            {formatPrice(api.price)}
          </div>
          <div className="text-sm text-gray-500">per call</div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-500" />
          <span>{api.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Activity className="w-4 h-4" />
          <span>{api.totalCalls.toLocaleString()} calls</span>
        </div>
        <div className="flex items-center gap-1">
          <DollarSign className="w-4 h-4" />
          <span>${parseFloat(api.totalRevenue).toFixed(2)} earned</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-4">
        {api.tags.map((tag, index) => (
          <span
            key={index}
            className="bg-gray-100 text-gray-700 px-2 py-1 rounded-md text-xs"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          by {api.owner.slice(0, 6)}...{api.owner.slice(-4)}
        </div>
        <div className="flex gap-2">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
            Try API
          </button>
          <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const renderStats = () => {
    if (!stats) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total APIs</p>
              <p className="text-3xl font-bold">{stats.totalAPIs}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Categories</p>
              <p className="text-3xl font-bold">{stats.totalCategories}</p>
            </div>
            <Filter className="w-8 h-8 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Top Rating</p>
              <p className="text-3xl font-bold">
                {stats.topAPIs[0]?.rating.toFixed(1) || 'N/A'}
              </p>
            </div>
            <Star className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AgentPayKit Marketplace
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Discover and monetize APIs with crypto payments
            </p>
          </div>
          
          {renderStats()}

          {/* Search and Filters */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search APIs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>

              {/* Price Range */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min price"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.001"
                />
                <input
                  type="number"
                  placeholder="Max price"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  step="0.001"
                />
              </div>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SearchFilters['sortBy'])}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="rating">Highest Rated</option>
                <option value="price">Lowest Price</option>
                <option value="calls">Most Popular</option>
                <option value="revenue">Highest Revenue</option>
                <option value="recent">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* API Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {filteredAPIs.length} API{filteredAPIs.length !== 1 ? 's' : ''} found
          </h2>
          <button
            onClick={loadMarketplaceData}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Clock className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {filteredAPIs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">No APIs found matching your criteria</div>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
                setPriceRange({ min: '0', max: '1' });
              }}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAPIs.map(renderAPICard)}
          </div>
        )}
      </div>

      {/* Trending Section */}
      {stats && stats.topAPIs.length > 0 && (
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Trending APIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {stats.topAPIs.slice(0, 3).map(renderAPICard)}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">AgentPayKit</h3>
              <p className="text-gray-400">
                The easiest way to monetize APIs with crypto payments
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">For Developers</h3>
              <ul className="text-gray-400 space-y-2">
                <li><a href="#" className="hover:text-white">Documentation</a></li>
                <li><a href="#" className="hover:text-white">SDK Downloads</a></li>
                <li><a href="#" className="hover:text-white">Examples</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Community</h3>
              <ul className="text-gray-400 space-y-2">
                <li><a href="#" className="hover:text-white">Discord</a></li>
                <li><a href="#" className="hover:text-white">GitHub</a></li>
                <li><a href="#" className="hover:text-white">Twitter</a></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}; 