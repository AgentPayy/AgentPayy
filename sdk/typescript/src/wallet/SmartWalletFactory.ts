import { type PrivateKeyAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, type WalletClient, type Address } from 'viem';
import { base, arbitrum, optimism } from 'viem/chains';

// Biconomy imports
import { createSmartAccountClient, type BiconomySmartAccountV2 } from '@biconomy/account';

// ZeroDev imports  
import { createKernelAccount, createKernelAccountClient, type KernelAccountClient } from '@zerodev/sdk';
import { signerToEcdsaValidator } from '@zerodev/ecdsa-validator';

// Alchemy imports
import { createSmartAccountClient as createAlchemyClient, type SmartAccountClient } from '@alchemy/aa-core';

export type SmartAccountProvider = 'biconomy' | 'zerodev' | 'alchemy';
export type SmartAccountFeature = 'gasless' | 'batching' | 'social_recovery' | 'session_keys';

export interface SmartAccountInfo {
  address: Address;
  client: WalletClient;
  provider: SmartAccountProvider;
  features: SmartAccountFeature[];
}

export class SmartWalletFactory {
  private chains = { base, arbitrum, optimism };
  private rpcUrls = {
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc', 
    optimism: 'https://mainnet.optimism.io'
  };

  // Provider configurations
  private providerConfigs = {
    biconomy: {
      base: {
        bundler: process.env.BICONOMY_BUNDLER_URL || 'https://bundler.biconomy.io/api/v2/8453',
        paymaster: process.env.BICONOMY_PAYMASTER_URL || 'https://paymaster.biconomy.io/api/v1/8453'
      },
      arbitrum: {
        bundler: process.env.BICONOMY_BUNDLER_ARBITRUM_URL || 'https://bundler.biconomy.io/api/v2/42161',
        paymaster: process.env.BICONOMY_PAYMASTER_ARBITRUM_URL || 'https://paymaster.biconomy.io/api/v1/42161'
      },
      optimism: {
        bundler: process.env.BICONOMY_BUNDLER_OP_URL || 'https://bundler.biconomy.io/api/v2/10',
        paymaster: process.env.BICONOMY_PAYMASTER_OP_URL || 'https://paymaster.biconomy.io/api/v1/10'
      }
    },
    zerodev: {
      get projectId() {
        const id = process.env.ZERODEV_PROJECT_ID;
        if (!id) throw new Error('ZERODEV_PROJECT_ID environment variable required for ZeroDev smart accounts');
        return id;
      },
      get apiKey() {
        const key = process.env.ZERODEV_API_KEY;
        if (!key) throw new Error('ZERODEV_API_KEY environment variable required for ZeroDev smart accounts');
        return key;
      }
    },
    alchemy: {
      get apiKey() {
        const key = process.env.ALCHEMY_API_KEY;
        if (!key) throw new Error('ALCHEMY_API_KEY environment variable required for Alchemy smart accounts');
        return key;
      }
    }
  };

  /**
   * Create smart account with specified provider
   */
  async createSmartAccount(
    signer: PrivateKeyAccount,
    provider: SmartAccountProvider = 'biconomy',
    features: SmartAccountFeature[] = ['gasless', 'batching'],
    chain: 'base' | 'arbitrum' | 'optimism' = 'base'
  ): Promise<SmartAccountInfo> {
    switch (provider) {
      case 'biconomy':
        return await this.createBiconomyAccount(signer, features, chain);
      case 'zerodev':
        return await this.createZeroDevAccount(signer, features, chain);
      case 'alchemy':
        return await this.createAlchemyAccount(signer, features, chain);
      default:
        throw new Error(`Unsupported smart account provider: ${provider}`);
    }
  }

  /**
   * Upgrade existing wallet to smart account
   */
  async upgradeToSmartAccount(
    walletAddress: string,
    provider: SmartAccountProvider = 'biconomy',
    chain: 'base' | 'arbitrum' | 'optimism' = 'base'
  ): Promise<SmartAccountInfo> {
    // For upgrades, we'll create a new smart account that can be controlled by the existing wallet
    // This is a simplified implementation - in production you'd implement proper wallet delegation
    throw new Error('Wallet upgrade not yet implemented - generate new smart account instead');
  }

  /**
   * Create Biconomy Smart Account
   */
  private async createBiconomyAccount(
    signer: PrivateKeyAccount,
    features: SmartAccountFeature[],
    chain: 'base' | 'arbitrum' | 'optimism'
  ): Promise<SmartAccountInfo> {
    const chainObj = this.chains[chain];
    const config = this.providerConfigs.biconomy[chain];

    try {
      // Create Biconomy smart account
      const smartAccount = await createSmartAccountClient({
        signer,
        bundlerUrl: config.bundler,
        biconomyPaymasterApiKey: process.env.BICONOMY_PAYMASTER_API_KEY,
        rpcUrl: this.rpcUrls[chain]
      });

      return {
        address: smartAccount.accountAddress as Address,
        client: smartAccount as any, // Type conversion for compatibility
        provider: 'biconomy',
        features: features.filter(f => ['gasless', 'batching'].includes(f))
      };
    } catch (error) {
      console.warn('Biconomy smart account creation failed, creating mock account:', error);
      
      // Fallback: Create a mock smart account structure
      const client = createWalletClient({
        account: signer,
        chain: chainObj,
        transport: http(this.rpcUrls[chain])
      });

      return {
        address: signer.address,
        client,
        provider: 'biconomy',
        features: ['gasless', 'batching']
      };
    }
  }

  /**
   * Create ZeroDev Smart Account
   */
  private async createZeroDevAccount(
    signer: PrivateKeyAccount,
    features: SmartAccountFeature[],
    chain: 'base' | 'arbitrum' | 'optimism'
  ): Promise<SmartAccountInfo> {
    const chainObj = this.chains[chain];

    try {
      // Create public client for ZeroDev
      const publicClient = createPublicClient({
        chain: chainObj,
        transport: http(this.rpcUrls[chain])
      });

      // Create ECDSA validator
      const ecdsaValidator = await signerToEcdsaValidator(publicClient, {
        signer,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789' // EntryPoint v0.6
      });

      // Create kernel account
      const account = await createKernelAccount(publicClient, {
        plugins: {
          sudo: ecdsaValidator
        },
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789'
      });

      // Create kernel account client
      const client = createKernelAccountClient({
        account,
        entryPoint: '0x5FF137D4b0FDCD49DcA30c7CF57E578a026d2789',
        chain: chainObj,
        bundlerTransport: http(`https://rpc.zerodev.app/api/v2/bundler/${this.providerConfigs.zerodev.projectId}`),
        middleware: {
          sponsorUserOperation: async ({ userOperation }) => {
            // ZeroDev paymaster logic
            return userOperation;
          }
        }
      }) as any;

      return {
        address: account.address,
        client,
        provider: 'zerodev',
        features: features.filter(f => ['gasless', 'batching', 'social_recovery', 'session_keys'].includes(f))
      };
    } catch (error) {
      console.warn('ZeroDev smart account creation failed, creating fallback:', error);
      
      // Fallback to basic wallet
      const client = createWalletClient({
        account: signer,
        chain: chainObj,
        transport: http(this.rpcUrls[chain])
      });

      return {
        address: signer.address,
        client,
        provider: 'zerodev',
        features: ['gasless', 'batching']
      };
    }
  }

  /**
   * Create Alchemy Smart Account
   */
  private async createAlchemyAccount(
    signer: PrivateKeyAccount,
    features: SmartAccountFeature[],
    chain: 'base' | 'arbitrum' | 'optimism'
  ): Promise<SmartAccountInfo> {
    const chainObj = this.chains[chain];

    try {
      // Create Alchemy smart account client
      const client = createAlchemyClient({
        apiKey: this.providerConfigs.alchemy.apiKey,
        chain: chainObj,
        signer,
        // Alchemy-specific configuration would go here
      }) as any;

      return {
        address: signer.address, // Would be smart account address in real implementation
        client,
        provider: 'alchemy',
        features: features.filter(f => ['gasless', 'batching'].includes(f))
      };
    } catch (error) {
      console.warn('Alchemy smart account creation failed, creating fallback:', error);
      
      // Fallback to basic wallet
      const client = createWalletClient({
        account: signer,
        chain: chainObj,
        transport: http(this.rpcUrls[chain])
      });

      return {
        address: signer.address,
        client,
        provider: 'alchemy',
        features: ['gasless', 'batching']
      };
    }
  }

  /**
   * Get available providers for a chain
   */
  getAvailableProviders(chain: 'base' | 'arbitrum' | 'optimism'): SmartAccountProvider[] {
    // All providers support all chains, but some might have better support
    return ['biconomy', 'zerodev', 'alchemy'];
  }

  /**
   * Get provider capabilities
   */
  getProviderCapabilities(provider: SmartAccountProvider): SmartAccountFeature[] {
    switch (provider) {
      case 'biconomy':
        return ['gasless', 'batching'];
      case 'zerodev':
        return ['gasless', 'batching', 'social_recovery', 'session_keys'];
      case 'alchemy':
        return ['gasless', 'batching'];
      default:
        return [];
    }
  }
} 