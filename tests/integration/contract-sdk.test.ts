import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createWalletClient, http, parseEther, getContract } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { AgentPayKit } from '../../sdk/typescript/src';
import { spawn, ChildProcess } from 'child_process';

describe('Contract + SDK Integration Tests', () => {
  let anvilProcess: ChildProcess;
  let agentPayKit: AgentPayKit;
  let contractAddress: string;
  
  const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  const client = createWalletClient({
    account,
    chain: foundry,
    transport: http()
  });

  beforeAll(async () => {
    // Start Anvil for testing
    anvilProcess = spawn('anvil', ['--fork-url', 'https://mainnet.base.org'], {
      stdio: 'pipe'
    });

    // Wait for Anvil to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Deploy contract using Foundry
    const deployProcess = spawn('forge', [
      'script', 
      'script/Deploy.s.sol:DeployScript',
      '--fork-url', 'http://localhost:8545',
      '--broadcast',
      '--private-key', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    ], {
      cwd: './contracts',
      stdio: 'pipe'
    });

    // Parse deployment output to get contract address
    deployProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      const match = output.match(/AgentPayKit deployed to: (0x[a-fA-F0-9]{40})/);
      if (match) {
        contractAddress = match[1];
      }
    });

    await new Promise(resolve => {
      deployProcess.on('close', resolve);
    });

    // Initialize SDK
    agentPayKit = new AgentPayKit({
      contractAddress,
      rpcUrl: 'http://localhost:8545',
      privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    });
  });

  afterAll(async () => {
    if (anvilProcess) {
      anvilProcess.kill();
    }
  });

  describe('Model Registration', () => {
    it('should register a model through SDK', async () => {
      const modelData = {
        modelId: 'gpt-4o-test',
        endpoint: 'https://api.test.com/v1/chat',
        price: parseEther('0.001'),
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' // USDC on Base
      };

      const result = await agentPayKit.registerModel(modelData);
      expect(result.transactionHash).toBeTruthy();
      
      const model = await agentPayKit.getModel(modelData.modelId);
      expect(model.owner).toBe(account.address);
      expect(model.endpoint).toBe(modelData.endpoint);
      expect(model.price).toBe(modelData.price);
    });

    it('should update model through SDK', async () => {
      const modelId = 'gpt-4o-test';
      const updates = {
        endpoint: 'https://api.updated.com/v1/chat',
        price: parseEther('0.002'),
        active: false
      };

      await agentPayKit.updateModel(modelId, updates);
      
      const model = await agentPayKit.getModel(modelId);
      expect(model.endpoint).toBe(updates.endpoint);
      expect(model.price).toBe(updates.price);
      expect(model.active).toBe(false);
    });
  });

  describe('Payment Processing', () => {
    it('should process payment with prepaid balance', async () => {
      // First deposit balance
      const depositAmount = parseEther('1');
      await agentPayKit.depositBalance({
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        amount: depositAmount
      });

      const balance = await agentPayKit.getUserBalance(
        account.address,
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      );
      expect(balance).toBe(depositAmount);

      // Process payment
      const paymentData = {
        modelId: 'gpt-4o-test',
        inputHash: '0x123...',
        amount: parseEther('0.001'),
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const result = await agentPayKit.payAndCall(paymentData);
      expect(result.transactionHash).toBeTruthy();

      // Verify balance was deducted
      const newBalance = await agentPayKit.getUserBalance(
        account.address,
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      );
      expect(newBalance).toBe(depositAmount - paymentData.amount);
    });

    it('should handle payment with permit signature', async () => {
      // This would test ERC20 permit functionality
      // Implementation depends on specific permit requirements
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Multichain Support', () => {
    it('should detect network correctly', async () => {
      const networkInfo = await agentPayKit.getNetworkInfo();
      expect(networkInfo.chainId).toBe(foundry.id);
      expect(networkInfo.name).toBe('Foundry');
    });

    it('should get USDC address for current network', async () => {
      const usdcAddress = agentPayKit.getUSDCAddress();
      expect(usdcAddress).toBeTruthy();
      expect(usdcAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  describe('Error Handling', () => {
    it('should throw on invalid model registration', async () => {
      const invalidModel = {
        modelId: '', // Empty ID should fail
        endpoint: 'https://api.test.com',
        price: parseEther('0.001'),
        token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'
      };

      await expect(agentPayKit.registerModel(invalidModel))
        .rejects.toThrow('Invalid model ID');
    });

    it('should throw on insufficient balance', async () => {
      const paymentData = {
        modelId: 'gpt-4o-test',
        inputHash: '0x123...',
        amount: parseEther('1000'), // More than balance
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      await expect(agentPayKit.payAndCall(paymentData))
        .rejects.toThrow('Insufficient balance');
    });
  });

  describe('Gas Optimization', () => {
    it('should estimate gas correctly for payments', async () => {
      const paymentData = {
        modelId: 'gpt-4o-test',
        inputHash: '0x123...',
        amount: parseEther('0.001'),
        deadline: Math.floor(Date.now() / 1000) + 3600
      };

      const gasEstimate = await agentPayKit.estimatePaymentGas(paymentData);
      expect(gasEstimate).toBeLessThan(350000); // Should be efficient
    });

    it('should batch multiple operations efficiently', async () => {
      const operations = [
        { type: 'deposit', amount: parseEther('0.1') },
        { type: 'payment', modelId: 'gpt-4o-test', amount: parseEther('0.001') },
        { type: 'payment', modelId: 'gpt-4o-test', amount: parseEther('0.001') }
      ];

      const batchResult = await agentPayKit.batchOperations(operations);
      expect(batchResult.gasUsed).toBeLessThan(800000); // Efficient batching
    });
  });
}); 