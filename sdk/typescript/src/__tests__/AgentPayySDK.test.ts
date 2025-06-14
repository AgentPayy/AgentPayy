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

    it('should generate a wallet with smart account option', async () => {
      const wallet = await sdk.generateWallet({ smart: true });
      
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(wallet.smart).toBe(true);
    });

    it('should connect an existing wallet', async () => {
      const privateKey = '0x' + '1'.repeat(64);
      const wallet = await sdk.connectWallet(privateKey);
      
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(wallet.smart).toBe(false);
    });

    it('should check if wallet is connected', async () => {
      expect(sdk.isWalletConnected()).toBe(false);
      
      // Connect a wallet
      await sdk.connectWallet('0x' + '1'.repeat(64));
      expect(sdk.isWalletConnected()).toBe(true);
    });

    it('should get wallet address when connected', async () => {
      const privateKey = '0x' + '1'.repeat(64);
      await sdk.connectWallet(privateKey);
      
      const address = sdk.getWalletAddress();
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });

    it('should disconnect wallet', async () => {
      const privateKey = '0x' + '1'.repeat(64);
      await sdk.connectWallet(privateKey);
      
      expect(sdk.isWalletConnected()).toBe(true);
      sdk.disconnectWallet();
      expect(sdk.isWalletConnected()).toBe(false);
    });
  });

  describe('Payment Operations', () => {
    beforeEach(async () => {
      // Connect a wallet for payment tests
      await sdk.connectWallet('0x' + '1'.repeat(64));
    });

    it('should process mock payment', async () => {
      const result = await sdk.pay('model-1', 'test-input', {
        price: '1.0',
        mock: true
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBeDefined();
    });

    it('should validate payment successfully', async () => {
      // Mock successful validation response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true })
      });

      const result = await sdk.validatePayment('model-1', 'test-input', '1.0');
      
      expect(result.valid).toBe(true);
    });

    it('should handle payment validation failure', async () => {
      // Mock validation failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Validation request failed'));

      const result = await sdk.validatePayment('model-1', 'test-input', '1.0');
      
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Validation failed');
    });

    it('should handle payment with attribution', async () => {
      // Mock successful attribution payment
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          success: true, 
          txHash: '0xabc123',
          attributions: [{ recipient: '0x1234567890123456789012345678901234567890', amount: '1.0' }]
        })
      });

      const result = await sdk.pay('model-1', 'test-input', {
        price: '1.0',
        attributions: [{ recipient: '0x1234567890123456789012345678901234567890', basisPoints: 10000 }]
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xabc123');
    });

    it('should handle payment error', async () => {
      // Mock payment failure
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Insufficient funds'));

      const result = await sdk.pay('model-1', 'test-input', { price: '1000.0' });
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('Balance Operations', () => {
    beforeEach(async () => {
      await sdk.connectWallet('0x' + '1'.repeat(64));
    });

    it('should get user balances', async () => {
      const mockBalances = { USDC: '100.0', USDT: '50.0' };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBalances
      });

      const balances = await sdk.getBalances('0x123');
      
      expect(balances).toEqual(mockBalances);
    });

    it('should handle balance fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to get balances'));

      const balances = await sdk.getBalances('0x123');
      
      expect(balances).toEqual({});
    });
  });

  describe('Model Operations', () => {
    beforeEach(async () => {
      await sdk.connectWallet('0x' + '1'.repeat(64));
    });

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
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Model not found'));

      const model = await sdk.getModel('nonexistent-model');
      
      expect(model).toBeNull();
    });

    it('should register a model', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, txHash: '0xdef456' })
      });

      const result = await sdk.registerModel({
        modelId: 'new-model',
        endpoint: 'https://api.example.com',
        price: '1.0'
      });
      
      expect(result.success).toBe(true);
      expect(result.txHash).toBe('0xdef456');
    });
  });

  describe('Payment History', () => {
    beforeEach(async () => {
      await sdk.connectWallet('0x' + '1'.repeat(64));
    });

    it('should get payment history', async () => {
      const mockHistory = [{
        txHash: '0x123',
        modelId: 'model-1',
        amount: '1.0',
        timestamp: 1234567890,
        status: 'completed'
      }];
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory
      });

      const history = await sdk.getPaymentHistory('0x123', 10);
      
      expect(history).toEqual(mockHistory);
    });

    it('should handle payment history fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Failed to get payment history'));

      const history = await sdk.getPaymentHistory('0x123', 10);
      
      expect(history).toEqual([]);
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
      const mockAPIs = [{
        modelId: 'api-1',
        tags: ['nlp']
      }];
      
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
        totalDevelopers: 50,
        totalCategories: 10,
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
      const mockTrending = [{
        modelId: 'trending-1',
        calls: 1000
      }];
      
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
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00Z',
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
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Gateway unavailable'));

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
        networks: {
          base: 500,
          arbitrum: 500
        }
      };
      
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnalytics
      });

      const analytics = await sdk.getAnalytics();
      
      expect(analytics).toEqual(mockAnalytics);
    });

    it('should handle analytics fetch error', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Analytics unavailable'));

      const analytics = await sdk.getAnalytics();
      
      expect(analytics).toEqual({
        totalPayments: 0,
        totalRevenue: '0',
        uniqueUsers: 0,
        avgPaymentSize: '0',
        networks: {}
      });
    });
  });
}); 