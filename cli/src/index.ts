#!/usr/bin/env node

import { Command } from 'commander';
import { ethers } from 'ethers';
import inquirer from 'inquirer';
import chalk from 'chalk';

const CONTRACT_ABI = [
  "function registerModel(string modelId, string endpoint, uint256 price, address token)",
  "function getModel(string modelId) view returns (tuple(address owner, string endpoint, uint256 price, address token, bool active, uint256 totalCalls, uint256 totalRevenue))"
];

const NETWORKS = {
  base: { rpc: 'https://mainnet.base.org', contract: process.env.AGENTPAY_BASE_CONTRACT || '' },
  arbitrum: { rpc: 'https://arb1.arbitrum.io/rpc', contract: process.env.AGENTPAY_ARBITRUM_CONTRACT || '' }
};

const USDC_ADDRESSES = {
  base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  arbitrum: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
};

const program = new Command();

// Welcome message for new users
function showWelcome() {
  console.log(chalk.blue('🚀 Welcome to AgentPayKit - Wallet Infrastructure for the API Economy\n'));
  console.log(chalk.gray('The complete solution for monetizing and consuming APIs with smart wallets.\n'));
  
  console.log(chalk.bold('🔑 Universal Wallet Features:'));
  console.log(chalk.gray('  • Generate wallets instantly'));
  console.log(chalk.gray('  • Connect existing wallets (MetaMask, Coinbase, WalletConnect)'));
  console.log(chalk.gray('  • Smart accounts with gasless transactions'));
  console.log(chalk.gray('  • Multi-chain support (Base, Arbitrum, Optimism)'));
  
  console.log(chalk.bold('\n💰 Dual Payment Model:'));
  console.log(chalk.gray('  • Netflix-style prepaid balance for seamless usage'));
  console.log(chalk.gray('  • Pay-per-query fallback for flexibility'));
  console.log(chalk.gray('  • Smart routing based on wallet capabilities'));
  
  console.log(chalk.bold('\n🎯 Perfect for:'));
  console.log(chalk.gray('  • AI Agents that need to pay for APIs'));
  console.log(chalk.gray('  • Developers monetizing their APIs'));
  console.log(chalk.gray('  • Applications requiring micro-payments'));
  
  console.log(chalk.bold('\n🚀 Quick Start:'));
  console.log(chalk.cyan('  agentpay generate-wallet    # Create your first wallet'));
  console.log(chalk.cyan('  agentpay setup             # Setup complete agent'));
  console.log(chalk.cyan('  agentpay mock weather \'{}\'  # Test without payment'));
  console.log(chalk.cyan('  agentpay help              # See all commands\n'));
}

// Demo scenarios
function showDemo() {
  console.log(chalk.blue('🎬 AgentPayKit Demo Scenarios\n'));
  
  console.log(chalk.bold('Scenario 1: New Developer (Earn Mode)'));
  console.log(chalk.gray('You want to monetize your API and earn money:'));
  console.log(chalk.cyan('  1. agentpay generate-wallet --name "dev-wallet"'));
  console.log(chalk.cyan('  2. agentpay register-api my-api 0.05'));
  console.log(chalk.cyan('  3. agentpay earnings withdraw  # When you have sales'));
  
  console.log(chalk.bold('\nScenario 2: AI Agent (Spend Mode)'));
  console.log(chalk.gray('Your AI agent needs to consume APIs:'));
  console.log(chalk.cyan('  1. agentpay generate-wallet --smart'));
  console.log(chalk.cyan('  2. agentpay balance deposit 10.0'));
  console.log(chalk.cyan('  3. agentpay call weather-api \'{"city":"NYC"}\''));
  
  console.log(chalk.bold('\nScenario 3: Enterprise (Both Modes)'));
  console.log(chalk.gray('You both provide and consume APIs:'));
  console.log(chalk.cyan('  1. agentpay setup --name "enterprise-agent"'));
  console.log(chalk.cyan('  2. agentpay register-api internal-api 0.02'));
  console.log(chalk.cyan('  3. agentpay balance deposit 50.0'));
  console.log(chalk.cyan('  4. agentpay financials  # Monitor everything'));
  
  console.log(chalk.bold('\nScenario 4: Testing & Development'));
  console.log(chalk.gray('Test everything without spending money:'));
  console.log(chalk.cyan('  1. agentpay mock any-api \'{"test": "data"}\''));
  console.log(chalk.cyan('  2. agentpay batch "api1:{}" "api2:{}" --mock'));
  console.log(chalk.cyan('  3. agentpay wallets list  # Manage test wallets\n'));
}

// Network effects explanation
function showNetworkEffects() {
  console.log(chalk.blue('🌐 Network Effects in the API Economy\n'));
  
  console.log(chalk.bold('The Same Wallet Can Both Earn AND Spend:'));
  console.log(chalk.green('  💰 EARN: Register your APIs → Get paid in USDC'));
  console.log(chalk.yellow('  💸 SPEND: Use others\' APIs → Pay with balance'));
  console.log(chalk.blue('  🔄 REINVEST: Earnings fund more API usage'));
  
  console.log(chalk.bold('\nSmart Account Benefits:'));
  console.log(chalk.gray('  ⚡ Gasless transactions (sponsored by providers)'));
  console.log(chalk.gray('  📦 Batch multiple API calls efficiently'));
  console.log(chalk.gray('  🔒 Enhanced security with social recovery'));
  console.log(chalk.gray('  🗝️  Session keys for automated agents'));
  
  console.log(chalk.bold('\nScaling Features:'));
  console.log(chalk.gray('  🌍 Multi-chain deployment'));
  console.log(chalk.gray('  🏦 Enterprise-grade wallet management'));
  console.log(chalk.gray('  📊 Real-time financial analytics'));
  console.log(chalk.gray('  🔄 Automatic balance management\n'));
}

// Show real-world examples
function showExamples() {
  console.log(chalk.blue('💡 Real-World Examples\n'));
  
  console.log(chalk.bold('AI Agent Workflows:'));
  console.log(chalk.gray('  • Research agent pays for Google search API'));
  console.log(chalk.gray('  • Trading bot pays for market data APIs'));
  console.log(chalk.gray('  • Content agent pays for image generation'));
  console.log(chalk.gray('  • Assistant pays for weather, maps, news APIs'));
  
  console.log(chalk.bold('\nAPI Provider Examples:'));
  console.log(chalk.gray('  • Weather service: $0.01 per query'));
  console.log(chalk.gray('  • AI model: $0.05 per generation'));
  console.log(chalk.gray('  • Data analytics: $0.10 per report'));
  console.log(chalk.gray('  • Custom algorithms: $0.25 per compute'));
  
  console.log(chalk.bold('\nNetwork Effects Examples:'));
  console.log(chalk.gray('  • Weather API earns $100 → Funds $90 in other APIs'));
  console.log(chalk.gray('  • AI model earns $500 → Funds $400 in training data'));
  console.log(chalk.gray('  • Analytics earns $200 → Funds $150 in market APIs'));
  console.log(chalk.gray('  • Compound growth: earn more → use more → earn more\n'));
}

program
  .name('agentpay')
  .description('AgentPayKit - Complete wallet infrastructure for the API economy')
  .version('1.0.0')
  .action(() => {
    showWelcome();
  });

program
  .command('demo')
  .description('Show demo scenarios for different use cases')
  .action(() => {
    showDemo();
  });

program
  .command('network-effects')
  .alias('network')
  .description('Explain network effects in the API economy')
  .action(() => {
    showNetworkEffects();
  });

program
  .command('examples')
  .description('Show real-world usage examples')
  .action(() => {
    showExamples();
  });

// === WALLET COMMANDS ===
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
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    await walletManager.generateWallet(options);
  });

program
  .command('connect-wallet <type>')
  .description('Connect existing wallet (metamask|coinbase|walletconnect)')
  .option('--smart', 'Upgrade to smart account')
  .option('--save', 'Save wallet for future use')
  .option('--name <name>', 'Name for the wallet')
  .action(async (type, options) => {
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    await walletManager.connectWallet(type, options);
  });

program
  .command('import-wallet <privateKey>')
  .description('Import wallet from private key')
  .option('--smart', 'Create smart account')
  .option('--save', 'Save wallet for future use')
  .option('--name <name>', 'Name for the wallet')
  .action(async (privateKey, options) => {
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    await walletManager.importWallet(privateKey, options);
  });

program
  .command('wallets')
  .alias('list')
  .description('List saved wallets')
  .action(async () => {
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    await walletManager.listWallets();
  });

program
  .command('use-wallet <nameOrAddress>')
  .description('Use saved wallet')
  .action(async (nameOrAddress) => {
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    await walletManager.useWallet(nameOrAddress);
  });

program
  .command('wallet-info')
  .description('Show current wallet information')
  .action(async () => {
    const { WalletManager } = await import('./commands/wallet');
    const walletManager = new WalletManager();
    const { EnhancedAgentPayKit } = await import('../../sdk/typescript/src/EnhancedAgentPayKit');
    const agentpay = new EnhancedAgentPayKit();
    const wallet = agentpay.getWalletInfo();
    
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

// === AGENT COMMANDS ===
program
  .command('setup')
  .description('Setup AI agent with wallet and APIs')
  .option('--name <name>', 'Agent name')
  .option('--apis <apis...>', 'APIs to register')
  .option('--balance <amount>', 'Initial balance to deposit')
  .option('--no-interactive', 'Skip interactive setup')
  .action(async (options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.setupAgent(options);
  });

program
  .command('mock <modelId> <input>')
  .description('Test API with mock mode (no payment)')
  .action(async (modelId, input) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.mockCall(modelId, input);
  });

// Balance commands
const balanceCommand = program
  .command('balance')
  .description('Balance management commands');

balanceCommand
  .command('deposit <amount>')
  .description('Deposit USDC to balance')
  .option('--token <address>', 'Token contract address')
  .action(async (amount, options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.depositBalance(amount, options);
  });

balanceCommand
  .command('withdraw <amount>')
  .description('Withdraw USDC from balance')
  .option('--token <address>', 'Token contract address')
  .action(async (amount, options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.withdrawBalance(amount, options);
  });

balanceCommand
  .command('check')
  .description('Check current balance')
  .option('--address <address>', 'Check balance for specific address')
  .option('--token <address>', 'Token contract address')
  .action(async (options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.checkBalance(options);
  });

program
  .command('register-api <modelId> <price>')
  .description('Register new API endpoint')
  .option('--endpoint <url>', 'API endpoint URL')
  .option('--token <address>', 'Payment token address')
  .option('--description <desc>', 'API description')
  .action(async (modelId, price, options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.registerAPI(modelId, price, options);
  });

program
  .command('financials')
  .alias('money')
  .description('Show financial overview')
  .action(async () => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.getFinancials();
  });

// Earnings commands
const earningsCommand = program
  .command('earnings')
  .description('Earnings management commands');

earningsCommand
  .command('withdraw')
  .description('Withdraw all earnings')
  .option('--token <address>', 'Token contract address')
  .action(async (options) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.withdrawEarnings(options);
  });

program
  .command('batch <calls...>')
  .description('Batch multiple API calls (smart accounts only)')
  .action(async (calls) => {
    const { AgentManager } = await import('./commands/agent');
    const agentManager = new AgentManager();
    await agentManager.batchCall(calls);
  });

// Parse command line arguments
if (process.argv.length === 2) {
  // No arguments provided, show welcome
  showWelcome();
} else {
  program.parse();
} 