#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { EnhancedAgentPayyKit } from '../../../sdk/typescript/src/EnhancedAgentPayyKit';

const program = new Command();

interface WalletStorage {
  name: string;
  address: string;
  type: 'generated' | 'imported';
  isSmartAccount: boolean;
  features: string[];
  encrypted: boolean;
}

class WalletManager {
  private agentpay: EnhancedAgentPayyKit;
  private storageFile = '.agentpay-wallets.json';

  constructor() {
    this.agentpay = new EnhancedAgentPayyKit();
  }

  async generateWallet(options: {
    name?: string;
    smart?: boolean;
    provider?: 'biconomy' | 'zerodev' | 'alchemy';
    save?: boolean;
    fund?: string;
    testnet?: boolean;
  }) {
    console.log(chalk.blue('🔑 Generating new wallet...\n'));

    // Security warnings for new users
    this.displaySecurityWarnings();

    // Get user preferences if not provided
    const preferences = await this.getWalletPreferences(options);

    try {
      // Generate wallet with smart account capabilities
      const wallet = await this.agentpay.generateWallet({
        smart: preferences.smart,
        provider: preferences.provider,
        features: preferences.smart ? ['gasless', 'batching'] : [],
        chain: preferences.testnet ? 'base' : 'base' // Would use testnet in real implementation
      });

      // Display wallet information
      this.displayWalletInfo(wallet, preferences);

      // Save wallet if requested
      if (preferences.save) {
        await this.saveWallet(wallet, preferences.name);
      }

      // Fund on testnet if requested
      if (preferences.fund && preferences.testnet) {
        console.log(chalk.yellow(`\n💰 Funding with ${preferences.fund} ETH on testnet...`));
        console.log(chalk.gray('Note: Testnet funding would be implemented here'));
      }

      // Show next steps
      this.showNextSteps(wallet);

      return wallet;
    } catch (error) {
      console.error(chalk.red('❌ Failed to generate wallet:'), error);
      process.exit(1);
    }
  }

  async connectWallet(type: 'metamask' | 'coinbase' | 'walletconnect', options: {
    smart?: boolean;
    save?: boolean;
    name?: string;
  }) {
    console.log(chalk.blue(`🔌 Connecting ${type} wallet...\n`));

    try {
      const wallet = await this.agentpay.connectWallet(type, {
        smart: options.smart
      });

      this.displayWalletInfo(wallet, options);

      if (options.save) {
        await this.saveWallet(wallet, options.name);
      }

      return wallet;
    } catch (error) {
      console.error(chalk.red('❌ Failed to connect wallet:'), error);
      process.exit(1);
    }
  }

  async importWallet(privateKey: string, options: {
    smart?: boolean;
    save?: boolean;
    name?: string;
  }) {
    console.log(chalk.blue('📥 Importing wallet...\n'));

    // Validate private key format
    if (!privateKey.startsWith('0x') || privateKey.length !== 66) {
      console.error(chalk.red('❌ Invalid private key format. Must be 0x followed by 64 hex characters.'));
      process.exit(1);
    }

    try {
      const wallet = await this.agentpay.importWallet(privateKey, {
        smart: options.smart
      });

      this.displayWalletInfo(wallet, options);

      if (options.save) {
        await this.saveWallet(wallet, options.name);
      }

      return wallet;
    } catch (error) {
      console.error(chalk.red('❌ Failed to import wallet:'), error);
      process.exit(1);
    }
  }

  async listWallets() {
    console.log(chalk.blue('📄 Saved Wallets:\n'));

    try {
      const wallets = await this.loadSavedWallets();
      
      if (wallets.length === 0) {
        console.log(chalk.gray('No saved wallets found.'));
        console.log(chalk.gray('Use "agentpay generate-wallet --save" to save a wallet.'));
        return;
      }

      const table = wallets.map((wallet, index) => ({
        '#': index + 1,
        'Name': wallet.name,
        'Address': `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
        'Type': wallet.isSmartAccount ? 'Smart Account' : 'EOA',
        'Features': wallet.features.join(', ') || 'Basic'
      }));

      console.table(table);
    } catch (error) {
      console.error(chalk.red('❌ Failed to load wallets:'), error);
    }
  }

  async useWallet(nameOrAddress: string) {
    console.log(chalk.blue(`🔑 Loading wallet: ${nameOrAddress}\n`));

    try {
      const wallets = await this.loadSavedWallets();
      const wallet = wallets.find(w => 
        w.name === nameOrAddress || 
        w.address.toLowerCase() === nameOrAddress.toLowerCase()
      );

      if (!wallet) {
        console.error(chalk.red('❌ Wallet not found.'));
        console.log(chalk.gray('Use "agentpay wallets list" to see available wallets.'));
        process.exit(1);
      }

      console.log(chalk.green(`✅ Using wallet: ${wallet.name}`));
      console.log(chalk.gray(`Address: ${wallet.address}`));
      console.log(chalk.gray(`Type: ${wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`));

      // In a real implementation, this would set the active wallet
      return wallet;
    } catch (error) {
      console.error(chalk.red('❌ Failed to use wallet:'), error);
      process.exit(1);
    }
  }

  private displaySecurityWarnings() {
    console.log(chalk.yellow('⚠️  SECURITY WARNINGS:'));
    console.log(chalk.gray('   • This wallet is for DEVELOPMENT/TESTING only'));
    console.log(chalk.gray('   • Never use for large amounts of cryptocurrency'));
    console.log(chalk.gray('   • For production, use hardware wallets (Ledger, Trezor)'));
    console.log(chalk.gray('   • Keep your private key secure and never share it'));
    console.log(chalk.gray('   • Back up your private key in a secure location\n'));
  }

  private async getWalletPreferences(options: any) {
    const questions = [];

    if (!options.name && options.save) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Enter a name for this wallet:',
        default: `wallet-${Date.now()}`
      });
    }

    if (options.smart === undefined) {
      questions.push({
        type: 'confirm',
        name: 'smart',
        message: 'Create smart account for gasless transactions?',
        default: true
      });
    }

    if (options.smart !== false && !options.provider) {
      questions.push({
        type: 'list',
        name: 'provider',
        message: 'Choose smart account provider:',
        choices: [
          { name: 'Biconomy (Recommended for gasless)', value: 'biconomy' },
          { name: 'ZeroDev (Advanced features)', value: 'zerodev' },
          { name: 'Alchemy (Enterprise grade)', value: 'alchemy' }
        ],
        default: 'biconomy'
      });
    }

    if (options.save === undefined) {
      questions.push({
        type: 'confirm',
        name: 'save',
        message: 'Save wallet for future use?',
        default: true
      });
    }

    if (options.fund === undefined && options.testnet) {
      questions.push({
        type: 'input',
        name: 'fund',
        message: 'Amount of ETH to fund on testnet (0 to skip):',
        default: '0.1'
      });
    }

    const answers = await inquirer.prompt(questions);
    return { ...options, ...answers };
  }

  private displayWalletInfo(wallet: any, options: any) {
    console.log(chalk.green('✅ Wallet ready!\n'));
    
    console.log(chalk.bold('Wallet Information:'));
    console.log(chalk.gray(`Name: ${options.name || 'Unnamed'}`));
    console.log(chalk.gray(`Address: ${wallet.address}`));
    console.log(chalk.gray(`Type: ${wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`));
    
    if (wallet.isSmartAccount) {
      console.log(chalk.gray(`Smart Account Features:`));
      wallet.features.gasless && console.log(chalk.gray(`  ⚡ Gasless transactions`));
      wallet.features.batchTransactions && console.log(chalk.gray(`  📦 Batch transactions`));
      wallet.features.socialRecovery && console.log(chalk.gray(`  🔒 Social recovery`));
      wallet.features.sessionKeys && console.log(chalk.gray(`  🗝️  Session keys`));
    }

    if (wallet.privateKey && !options.quiet) {
      console.log(chalk.yellow('\n🔑 Private Key (keep secure):'));
      console.log(chalk.red(wallet.privateKey));
    }
    
    console.log('');
  }

  private showNextSteps(wallet: any) {
    console.log(chalk.bold('🚀 Next Steps:\n'));
    
    console.log(chalk.gray('1. Test with mock mode (no payment needed):'));
    console.log(chalk.cyan('   agentpay mock weather-api \'{"city":"NYC"}\'\n'));
    
    console.log(chalk.gray('2. Top up balance for seamless usage:'));
    console.log(chalk.cyan('   agentpay balance deposit 10.0\n'));
    
    console.log(chalk.gray('3. Register your own API:'));
    console.log(chalk.cyan('   agentpay register-api my-api 0.05\n'));
    
    console.log(chalk.gray('4. Check your financial overview:'));
    console.log(chalk.cyan('   agentpay financials\n'));
  }

  private async saveWallet(wallet: any, name?: string) {
    try {
      const wallets = await this.loadSavedWallets();
      
      const walletData: WalletStorage = {
        name: name || `wallet-${Date.now()}`,
        address: wallet.address,
        type: wallet.type,
        isSmartAccount: wallet.isSmartAccount,
        features: Object.entries(wallet.features)
          .filter(([_, enabled]) => enabled)
          .map(([feature, _]) => feature),
        encrypted: false // TODO: Implement encryption
      };

      wallets.push(walletData);
      
      // In production, this would be encrypted and stored securely
      const fs = require('fs');
      fs.writeFileSync(this.storageFile, JSON.stringify(wallets, null, 2));
      
      console.log(chalk.green(`💾 Wallet saved as "${walletData.name}"`));
    } catch (error) {
      console.warn(chalk.yellow('⚠️  Failed to save wallet:'), error);
    }
  }

  private async loadSavedWallets(): Promise<WalletStorage[]> {
    try {
      const fs = require('fs');
      if (!fs.existsSync(this.storageFile)) {
        return [];
      }
      
      const data = fs.readFileSync(this.storageFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }
}

// CLI Commands
const walletManager = new WalletManager();

program
  .name('agentpay')
  .description('AgentPayyKit - Wallet Infrastructure for the API Economy')
  .version('1.0.0');

program
  .command('generate-wallet')
  .alias('gen')
  .description('Generate new wallet with smart account capabilities')
  .option('--name <name>', 'Name for the wallet')
  .option('--smart', 'Create smart account (default: true)')
  .option('--no-smart', 'Create standard EOA wallet')
  .option('--provider <provider>', 'Smart account provider (biconomy|zerodev|alchemy)')
  .option('--save', 'Save wallet for future use (default: true)')
  .option('--no-save', 'Don\'t save wallet')
  .option('--fund <amount>', 'Fund with ETH on testnet')
  .option('--testnet', 'Use testnet for funding')
  .option('--quiet', 'Don\'t display private key')
  .action(async (options) => {
    await walletManager.generateWallet(options);
  });

program
  .command('connect-wallet <type>')
  .description('Connect existing wallet (metamask|coinbase|walletconnect)')
  .option('--smart', 'Upgrade to smart account')
  .option('--save', 'Save wallet for future use')
  .option('--name <name>', 'Name for the wallet')
  .action(async (type, options) => {
    await walletManager.connectWallet(type, options);
  });

program
  .command('import-wallet <privateKey>')
  .description('Import wallet from private key')
  .option('--smart', 'Create smart account')
  .option('--save', 'Save wallet for future use')
  .option('--name <name>', 'Name for the wallet')
  .action(async (privateKey, options) => {
    await walletManager.importWallet(privateKey, options);
  });

program
  .command('wallets')
  .alias('list')
  .description('List saved wallets')
  .action(async () => {
    await walletManager.listWallets();
  });

program
  .command('use-wallet <nameOrAddress>')
  .description('Use saved wallet')
  .action(async (nameOrAddress) => {
    await walletManager.useWallet(nameOrAddress);
  });

program
  .command('wallet-info')
  .description('Show current wallet information')
  .action(async () => {
    const wallet = walletManager.agentpay.getWalletInfo();
    if (!wallet) {
      console.log(chalk.yellow('No wallet connected.'));
      console.log(chalk.gray('Use "agentpay generate-wallet" or "agentpay connect-wallet" first.'));
    } else {
      console.log(chalk.blue('Current Wallet:\n'));
      console.log(`Address: ${wallet.address}`);
      console.log(`Type: ${wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`);
      console.log(`Features: ${Object.entries(wallet.features).filter(([_, enabled]) => enabled).map(([feature, _]) => feature).join(', ')}`);
    }
  });

if (require.main === module) {
  program.parse();
}

export { WalletManager }; 