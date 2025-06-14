import { createConfig, connect, getAccount, type GetAccountReturnType } from 'wagmi';
import { walletConnect, metaMask, coinbaseWallet } from 'wagmi/connectors';
import { base, arbitrum, optimism } from 'viem/chains';
import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { createWalletClient, createPublicClient, http, type WalletClient, type PublicClient } from 'viem';
import { SmartWalletFactory } from './SmartWalletFactory';

export type WalletType = 'metamask' | 'coinbase' | 'walletconnect' | 'generated' | 'imported';
export type ChainType = 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'unichain' | 'worldchain' | 'starknet' | 'zksync' | 'linea' | 'blast' | 'scroll' | 'polygon-zkevm' | 'mantle';

export interface WalletInfo {
  type: WalletType;
  address: string;
  isSmartAccount: boolean;
  smartAccountAddress?: string;
  signerAddress?: string;
  features: {
    gasless: boolean;
    batchTransactions: boolean;
    socialRecovery: boolean;
    multiChain: boolean;
    sessionKeys: boolean;
  };
  client: WalletClient;
  publicClient: PublicClient;
  privateKey?: string; // Only for generated/imported wallets
}

export interface WalletConnectionOptions {
  chain?: ChainType;
  smart?: boolean;
  provider?: 'biconomy' | 'zerodev' | 'alchemy';
  features?: ('gasless' | 'social_recovery' | 'batching' | 'session_keys')[];
}

export class UniversalWalletAdapter {
  private smartWalletFactory: SmartWalletFactory;
  private chains = { base, arbitrum, optimism };
  private rpcUrls = {
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io'
  };

  constructor() {
    this.smartWalletFactory = new SmartWalletFactory();
    this.initializeWagmi();
  }

  private initializeWagmi() {
    const config = createConfig({
      chains: [base, arbitrum, optimism],
      connectors: [
        metaMask(),
        coinbaseWallet({ appName: 'AgentPayyKit' }),
        walletConnect({ 
          projectId: process.env.WALLETCONNECT_PROJECT_ID || 'agentpayykit' 
        })
      ]
    });
  }

  /**
   * Generate new wallet with smart account capabilities
   */
  async generateWallet(options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    const chain = this.chains[options.chain || 'base'];
    const privateKey = generatePrivateKey();
    const account = privateKeyToAccount(privateKey);

    // Create basic wallet client
    const client = createWalletClient({
      account,
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    if (options.smart) {
      // Generate smart account
      const smartAccount = await this.smartWalletFactory.createSmartAccount(
        account,
        options.provider || 'biconomy',
        options.features || ['gasless', 'batching']
      );

      return {
        type: 'generated',
        address: smartAccount.address,
        isSmartAccount: true,
        smartAccountAddress: smartAccount.address,
        signerAddress: account.address,
        features: {
          gasless: options.features?.includes('gasless') ?? true,
          batchTransactions: options.features?.includes('batching') ?? true,
          socialRecovery: options.features?.includes('social_recovery') ?? false,
          multiChain: true,
          sessionKeys: options.features?.includes('session_keys') ?? false
        },
        client: smartAccount.client,
        publicClient,
        privateKey
      };
    } else {
      // Standard EOA wallet
      return {
        type: 'generated',
        address: account.address,
        isSmartAccount: false,
        features: {
          gasless: false,
          batchTransactions: false,
          socialRecovery: false,
          multiChain: true,
          sessionKeys: false
        },
        client,
        publicClient,
        privateKey
      };
    }
  }

  /**
   * Connect existing wallet (BYOW)
   */
  async connectWallet(type: WalletType, options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    let account: GetAccountReturnType;
    
    switch (type) {
      case 'metamask':
        account = await connect({ connector: metaMask() });
        break;
      case 'coinbase':
        account = await connect({ connector: coinbaseWallet({ appName: 'AgentPayyKit' }) });
        break;
      case 'walletconnect':
        account = await connect({ 
          connector: walletConnect({ 
            projectId: process.env.WALLETCONNECT_PROJECT_ID || 'agentpayykit' 
          }) 
        });
        break;
      default:
        throw new Error(`Unsupported wallet type: ${type}`);
    }

    const chain = this.chains[options.chain || 'base'];
    const client = createWalletClient({
      account: account.address as any,
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    // Check if user wants to upgrade to smart account
    if (options.smart && account.address) {
      const smartAccount = await this.smartWalletFactory.upgradeToSmartAccount(
        account.address,
        options.provider || 'biconomy'
      );

      return {
        type,
        address: smartAccount.address,
        isSmartAccount: true,
        smartAccountAddress: smartAccount.address,
        signerAddress: account.address,
        features: {
          gasless: true,
          batchTransactions: true,
          socialRecovery: false,
          multiChain: true,
          sessionKeys: false
        },
        client: smartAccount.client,
        publicClient
      };
    }

    return {
      type,
      address: account.address!,
      isSmartAccount: false,
      features: {
        gasless: false,
        batchTransactions: false,
        socialRecovery: false,
        multiChain: true,
        sessionKeys: false
      },
      client,
      publicClient
    };
  }

  /**
   * Import wallet from private key
   */
  async importWallet(privateKey: string, options: WalletConnectionOptions = {}): Promise<WalletInfo> {
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format');
    }

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const chain = this.chains[options.chain || 'base'];

    const client = createWalletClient({
      account,
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(this.rpcUrls[options.chain || 'base'])
    });

    if (options.smart) {
      const smartAccount = await this.smartWalletFactory.createSmartAccount(
        account,
        options.provider || 'biconomy',
        options.features || ['gasless', 'batching']
      );

      return {
        type: 'imported',
        address: smartAccount.address,
        isSmartAccount: true,
        smartAccountAddress: smartAccount.address,
        signerAddress: account.address,
        features: {
          gasless: true,
          batchTransactions: true,
          socialRecovery: options.features?.includes('social_recovery') ?? false,
          multiChain: true,
          sessionKeys: options.features?.includes('session_keys') ?? false
        },
        client: smartAccount.client,
        publicClient,
        privateKey
      };
    }

    return {
      type: 'imported',
      address: account.address,
      isSmartAccount: false,
      features: {
        gasless: false,
        batchTransactions: false,
        socialRecovery: false,
        multiChain: true,
        sessionKeys: false
      },
      client,
      publicClient,
      privateKey
    };
  }

  /**
   * Get wallet capabilities
   */
  async getWalletCapabilities(address: string): Promise<{
    isSmartAccount: boolean;
    supportsGasless: boolean;
    supportsBatching: boolean;
    supportsSessionKeys: boolean;
  }> {
    // Check if address is a smart contract
    const publicClient = createPublicClient({
      chain: base,
      transport: http(this.rpcUrls.base)
    });

    const code = await publicClient.getBytecode({ address: address as `0x${string}` });
    const isSmartAccount = !!code && code !== '0x';

    return {
      isSmartAccount,
      supportsGasless: isSmartAccount,
      supportsBatching: isSmartAccount,
      supportsSessionKeys: isSmartAccount
    };
  }

  /**
   * Switch chain for existing wallet
   */
  async switchChain(walletInfo: WalletInfo, newChain: ChainType): Promise<WalletInfo> {
    const chain = this.chains[newChain];
    
    // Create new clients for the new chain
    const client = createWalletClient({
      account: walletInfo.client.account,
      chain,
      transport: http(this.rpcUrls[newChain])
    });

    const publicClient = createPublicClient({
      chain,
      transport: http(this.rpcUrls[newChain])
    });

    return {
      ...walletInfo,
      client,
      publicClient
    };
  }
} 