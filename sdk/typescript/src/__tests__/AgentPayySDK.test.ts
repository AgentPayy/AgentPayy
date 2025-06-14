import { AgentPayySDK } from '../AgentPayySDK';
import { ethers } from 'ethers';

// Mock fetch globally
global.fetch = jest.fn();

describe('AgentPayySDK', () => {
  let sdk: AgentPayySDK;
  const mockGatewayUrl = 'http://localhost:3000';
  
  beforeEach(() => {
    sdk = new AgentPayySDK(mockGatewayUrl);
    jest.clearAllMocks();
  });

  describe('Wallet Management', () => {
    it('should generate a new wallet', async () => {
      const wallet = await sdk.generateWallet();
      
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.smart).toBe(false);
    });

    it('should connect an existing wallet', async () => {
      const privateKey = '0x' + '1'.repeat(64);
      const wallet = await sdk.connectWallet(privateKey);
      
      expect(wallet.address).toBeDefined();
      expect(wallet.smart).toBe(false);
    });

    it('should check if wallet is connected', () => {
      expect(sdk.isWalletConnected()).toBe(false);
    });

    it('should get wallet address when connected', async () => {
      await sdk.generateWallet();
      const address = sdk.getWalletAddress();
      
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should disconnect wallet', async () => {
      await sdk.generateWallet();
      sdk.disconnectWallet();
      
      expect(sdk.isWalletConnected()).toBe(false);
      expect(sdk.getWalletAddress()).toBeNull();
    });
  });

  describe('Payment Operations', () => {
    beforeEach(async () => {
      await sdk.generateWallet();
    });

    it('should process mock payment', async () => {
      const result = await sdk.pay('model-1', { test: 'data' }, {
        price: '1.0',
        mock: true
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(result.gasUsed).toBe('150000');
    });

    it('should validate payment successfully', async () => {
      const mockResponse = {
        valid: true,
        gasEstimate: '100000'
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.validatePayment('model-1', '0x123', '1.0');
      
      expect(result.valid).toBe(true);
      expect(result.gasEstimate).toBe('100000');
    });

    it('should handle payment validation failure', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid model' })
      });

      const result = await sdk.validatePayment('invalid-model', '0x123', '1.0');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Validation failed');
    });

    it('should handle payment with attribution', async () => {
      const attributions = [
        { recipient: '0x123', basisPoints: 5000 },
        { recipient: '0x456', basisPoints: 5000 }
      ];

      const mockResponse = {
        txHash: '0xabc123',
        success: true
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.pay('model-1', { test: 'data' }, {
        price: '1.0',
        attributions
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xabc123');
    });

    it('should handle payment error', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ valid: true })
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Insufficient funds' })
        });

      const result = await sdk.pay('model-1', { test: 'data' }, {
        price: '1.0'
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Insufficient funds');
    });
  });

  describe('Balance Operations', () => {
    it('should get user balances', async () => {
      const mockBalances = {
        'USDC': '100.0',
        'USDT': '50.0'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalances
      });

      const balances = await sdk.getBalances('0x123');
      
      expect(balances).toEqual(mockBalances);
    });

    it('should handle balance fetch error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Failed' })
      });

      const balances = await sdk.getBalances('0x123');
      
      expect(balances).toEqual({});
    });
  });

  describe('Model Operations', () => {
    it('should get model information', async () => {
      const mockModel = {
        owner: '0x123',
        endpoint: 'https://api.example.com',
        price: '1.0',
        token: '0xUSDC',
        active: true,
        totalCalls: '100',
        totalRevenue: '100.0'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockModel
      });

      const model = await sdk.getModel('model-1');
      
      expect(model).toEqual(mockModel);
    });

    it('should handle model not found', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' })
      });

      const model = await sdk.getModel('invalid-model');
      
      expect(model).toBeNull();
    });

    it('should register a model', async () => {
      await sdk.generateWallet();
      
      const mockResponse = {
        txHash: '0xdef456'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await sdk.registerModel({
        modelId: 'new-model',
        endpoint: 'https://api.new.com',
        price: '2.0',
        category: 'AI',
        tags: ['nlp', 'sentiment']
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xdef456');
    });
  });

  describe('Payment History', () => {
    it('should get payment history', async () => {
      const mockHistory = [
        {
          txHash: '0x123',
          modelId: 'model-1',
          amount: '1.0',
          timestamp: 1234567890,
          status: 'completed'
        }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      });

      const history = await sdk.getPaymentHistory('0x123', 10);
      
      expect(history).toEqual(mockHistory);
    });
  });

  describe('API Discovery', () => {
    it('should get APIs by category', async () => {
      const mockAPIs = [
        { modelId: 'api-1', category: 'AI' },
        { modelId: 'api-2', category: 'AI' }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAPIs
      });

      const apis = await sdk.getAPIsByCategory('AI');
      
      expect(apis).toEqual(mockAPIs);
    });

    it('should search APIs by tag', async () => {
      const mockAPIs = [
        { modelId: 'api-1', tags: ['nlp'] }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAPIs
      });

      const apis = await sdk.searchAPIsByTag('nlp');
      
      expect(apis).toEqual(mockAPIs);
    });

    it('should get marketplace stats', async () => {
      const mockStats = {
        totalAPIs: 100,
        totalCategories: 10,
        totalDevelopers: 50,
        totalCalls: 10000,
        totalRevenue: '50000.0'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockStats
      });

      const stats = await sdk.getMarketplaceStats();
      
      expect(stats).toEqual(mockStats);
    });

    it('should get trending APIs', async () => {
      const mockTrending = [
        { modelId: 'trending-1', calls: 1000 }
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrending
      });

      const trending = await sdk.getTrendingAPIs(5);
      
      expect(trending).toEqual(mockTrending);
    });
  });

  describe('Health Check', () => {
    it('should get gateway health', async () => {
      const mockHealth = {
        status: 'healthy',
        timestamp: '2024-01-01T00:00:00Z',
        version: '1.0.0',
        services: ['payment', 'registry']
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHealth
      });

      const health = await sdk.getHealth();
      
      expect(health).toEqual(mockHealth);
    });

    it('should handle gateway unavailable', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const health = await sdk.getHealth();
      
      expect(health.status).toBe('unavailable');
      expect(health.version).toBe('unknown');
      expect(health.services).toEqual([]);
    });
  });

  describe('Analytics', () => {
    it('should get platform analytics', async () => {
      const mockAnalytics = {
        totalPayments: 1000,
        totalRevenue: '10000.0',
        uniqueUsers: 100,
        avgPaymentSize: '10.0',
        networks: { base: 500, arbitrum: 500 }
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const analytics = await sdk.getAnalytics();
      
      expect(analytics).toEqual(mockAnalytics);
    });
  });
}); 