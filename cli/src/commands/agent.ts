#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { EnhancedAgentPayyKit } from '../../../sdk/typescript/src/EnhancedAgentPayyKit';

const program = new Command();

class AgentManager {
  private agentpay: EnhancedAgentPayyKit;

  constructor() {
    this.agentpay = new EnhancedAgentPayyKit();
  }

  async setupAgent(options: {
    name?: string;
    apis?: string[];
    balance?: string;
    interactive?: boolean;
  }) {
    console.log(chalk.blue('🤖 Setting up AI Agent...\n'));

    // Get agent configuration
    const config = await this.getAgentConfig(options);

    try {
      // Setup the agent
      const result = await this.agentpay.setupAgent(config);
      
      this.displayAgentInfo(result, config);
      
      // Show usage examples
      this.showUsageExamples(result.wallet);
      
      return result;
    } catch (error) {
      console.error(chalk.red('❌ Failed to setup agent:'), error);
      process.exit(1);
    }
  }

  async mockCall(modelId: string, input: string) {
    console.log(chalk.blue(`🎭 Mock API call to ${modelId}...\n`));

    try {
      let parsedInput;
      try {
        parsedInput = JSON.parse(input);
      } catch (error) {
        // If not JSON, treat as string
        parsedInput = input;
      }

      const result = await this.agentpay.payAndCall(modelId, parsedInput, {
        price: '0.01',
        mock: true
      });

      console.log(chalk.green('✅ Mock API Response:'));
      console.log(JSON.stringify(result, null, 2));
      
    } catch (error) {
      console.error(chalk.red('❌ Mock call failed:'), error);
    }
  }

  async depositBalance(amount: string, options: { token?: string }) {
    console.log(chalk.blue(`💰 Depositing $${amount} USDC to balance...\n`));

    try {
      const txHash = await this.agentpay.depositBalance(amount, options.token);
      
      console.log(chalk.green('✅ Deposit initiated!'));
      console.log(chalk.gray(`Transaction: ${txHash}`));
      console.log(chalk.gray('Waiting for confirmation...'));
      
      // In production, would wait for transaction confirmation
      
      const newBalance = await this.agentpay.getUserBalance();
      console.log(chalk.green(`💰 New balance: $${newBalance} USDC`));
      
    } catch (error) {
      console.error(chalk.red('❌ Deposit failed:'), error);
    }
  }

  async withdrawBalance(amount: string, options: { token?: string }) {
    console.log(chalk.blue(`💸 Withdrawing $${amount} USDC from balance...\n`));

    try {
      const txHash = await this.agentpay.withdrawBalance(amount, options.token);
      
      console.log(chalk.green('✅ Withdrawal initiated!'));
      console.log(chalk.gray(`Transaction: ${txHash}`));
      
      const newBalance = await this.agentpay.getUserBalance();
      console.log(chalk.green(`💰 New balance: $${newBalance} USDC`));
      
    } catch (error) {
      console.error(chalk.red('❌ Withdrawal failed:'), error);
    }
  }

  async checkBalance(options: { address?: string; token?: string }) {
    console.log(chalk.blue('💰 Checking balance...\n'));

    try {
      const balance = await this.agentpay.getUserBalance(options.address, options.token);
      
      console.log(chalk.green(`Current Balance: $${balance} USDC`));
      
      // Also check if wallet has earnings
      const earnings = await this.agentpay.getEarnings(options.token);
      if (parseFloat(earnings) > 0) {
        console.log(chalk.yellow(`💼 Earnings: $${earnings} USDC (withdrawable)`));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to check balance:'), error);
    }
  }

  async registerAPI(modelId: string, price: string, options: { 
    endpoint?: string; 
    token?: string; 
    description?: string;
  }) {
    console.log(chalk.blue(`📝 Registering API: ${modelId}...\n`));

    try {
      const config = {
        modelId,
        endpoint: options.endpoint || `https://api.example.com/${modelId}`,
        price,
        token: options.token
      };

      const txHash = await this.agentpay.registerModel(config);
      
      console.log(chalk.green('✅ API registered successfully!'));
      console.log(chalk.gray(`Transaction: ${txHash}`));
      console.log(chalk.gray(`API ID: ${modelId}`));
      console.log(chalk.gray(`Price: $${price} USDC per call`));
      console.log(chalk.gray(`Endpoint: ${config.endpoint}`));
      
      // Show how to test the API
      console.log(chalk.yellow('\n🧪 Test your API:'));
      console.log(chalk.cyan(`agentpay mock ${modelId} '{"test": "data"}'`));
      
    } catch (error) {
      console.error(chalk.red('❌ API registration failed:'), error);
    }
  }

  async getFinancials() {
    console.log(chalk.blue('📊 Financial Overview...\n'));

    try {
      const overview = await this.agentpay.getFinancialOverview();
      
      console.log(chalk.bold('💰 Financial Summary:'));
      console.log(`  Balance:     $${overview.balance} USDC`);
      console.log(`  Earnings:    $${overview.earnings} USDC`);
      console.log(`  Total Spent: $${overview.totalSpent} USDC`);
      console.log(`  Net Position: ${parseFloat(overview.netPosition) >= 0 ? '📈' : '📉'} $${overview.netPosition} USDC`);
      
      // Show actionable insights
      const balance = parseFloat(overview.balance);
      const earnings = parseFloat(overview.earnings);
      
      console.log(chalk.gray('\n💡 Insights:'));
      
      if (balance < 1) {
        console.log(chalk.yellow('  • Consider topping up your balance for seamless API usage'));
        console.log(chalk.cyan('    agentpay balance deposit 10.0'));
      }
      
      if (earnings > 5) {
        console.log(chalk.green('  • You have earnings ready to withdraw!'));
        console.log(chalk.cyan('    agentpay earnings withdraw'));
      }
      
      if (balance === 0 && earnings === 0) {
        console.log(chalk.blue('  • Get started by registering an API or funding your balance'));
        console.log(chalk.cyan('    agentpay register-api my-api 0.05'));
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get financials:'), error);
    }
  }

  async withdrawEarnings(options: { token?: string }) {
    console.log(chalk.blue('💰 Withdrawing earnings...\n'));

    try {
      const earnings = await this.agentpay.getEarnings(options.token);
      
      if (parseFloat(earnings) === 0) {
        console.log(chalk.yellow('No earnings to withdraw.'));
        return;
      }
      
      console.log(chalk.gray(`Withdrawing $${earnings} USDC...`));
      
      const txHash = await this.agentpay.withdrawEarnings(options.token);
      
      console.log(chalk.green('✅ Earnings withdrawn!'));
      console.log(chalk.gray(`Transaction: ${txHash}`));
      console.log(chalk.green(`💰 Withdrew: $${earnings} USDC`));
      
    } catch (error) {
      console.error(chalk.red('❌ Withdrawal failed:'), error);
    }
  }

  async batchCall(calls: string[]) {
    console.log(chalk.blue(`📦 Batch API calls (${calls.length} calls)...\n`));

    try {
      const wallet = this.agentpay.getWalletInfo();
      if (!wallet?.features.batchTransactions) {
        console.log(chalk.yellow('⚠️  Batch transactions require a smart account.'));
        console.log(chalk.gray('Use "agentpay generate-wallet --smart" to create one.'));
        return;
      }

      // Parse calls from format: "modelId:input"
      const parsedCalls = calls.map(call => {
        const [modelId, input] = call.split(':', 2);
        return {
          modelId,
          input: JSON.parse(input || '{}'),
          options: { price: '0.01' }
        };
      });

      const results = await this.agentpay.batchPayAndCall(parsedCalls);
      
      console.log(chalk.green(`✅ Batch completed! ${results.length} successful calls`));
      results.forEach((result, i) => {
        console.log(chalk.gray(`  ${i + 1}. ${parsedCalls[i].modelId}: ${JSON.stringify(result).slice(0, 100)}...`));
      });
      
    } catch (error) {
      console.error(chalk.red('❌ Batch call failed:'), error);
    }
  }

  private async getAgentConfig(options: any) {
    const questions = [];

    if (!options.name) {
      questions.push({
        type: 'input',
        name: 'name',
        message: 'Enter agent name:',
        default: 'My AI Agent'
      });
    }

    if (options.interactive !== false) {
      questions.push({
        type: 'confirm',
        name: 'setupWallet',
        message: 'Generate new wallet?',
        default: true
      });

      questions.push({
        type: 'input',
        name: 'initialBalance',
        message: 'Initial balance to deposit (USDC):',
        default: '10.0',
        when: (answers) => answers.setupWallet
      });

      questions.push({
        type: 'confirm',
        name: 'registerApis',
        message: 'Register example APIs?',
        default: true
      });
    }

    const answers = await inquirer.prompt(questions);
    
    const config = {
      name: options.name || answers.name,
      description: `AI Agent: ${options.name || answers.name}`,
      endpoints: answers.registerApis ? [
        {
          modelId: 'example-llm',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          price: '0.01'
        },
        {
          modelId: 'example-image',
          endpoint: 'https://api.stability.ai/v1/generation',
          price: '0.05'
        }
      ] : [],
      walletOptions: {
        smart: true,
        provider: 'biconomy' as 'biconomy'
      }
    };

    return config;
  }

  private displayAgentInfo(result: any, config: any) {
    console.log(chalk.green('✅ Agent ready!\n'));
    
    console.log(chalk.bold('🤖 Agent Information:'));
    console.log(chalk.gray(`Name: ${config.name}`));
    console.log(chalk.gray(`Wallet: ${result.wallet.address}`));
    console.log(chalk.gray(`Type: ${result.wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`));
    console.log(chalk.gray(`APIs: ${result.registeredApis.length} registered`));
    console.log(chalk.gray(`Balance: $${result.balance} USDC`));
    
    if (result.registeredApis.length > 0) {
      console.log(chalk.gray('\n📝 Registered APIs:'));
      result.registeredApis.forEach((api: string) => {
        console.log(chalk.gray(`  • ${api}`));
      });
    }
  }

  private showUsageExamples(wallet: any) {
    console.log(chalk.bold('\n🚀 Usage Examples:\n'));
    
    console.log(chalk.gray('1. Test APIs with mock mode:'));
    console.log(chalk.cyan('   agentpay mock example-llm \'{"prompt":"Hello"}\''));
    
    console.log(chalk.gray('\n2. Check balance and earnings:'));
    console.log(chalk.cyan('   agentpay financials'));
    
    console.log(chalk.gray('\n3. Make real API calls:'));
    console.log(chalk.cyan('   agentpay call weather-api \'{"city":"NYC"}\''));
    
    if (wallet.features.batchTransactions) {
      console.log(chalk.gray('\n4. Batch multiple calls (smart accounts):'));
      console.log(chalk.cyan('   agentpay batch "api1:{}" "api2:{}"'));
    }
    
    console.log(chalk.gray('\n5. Register your own API:'));
    console.log(chalk.cyan('   agentpay register-api my-api 0.05'));
  }
}

// CLI Commands
const agentManager = new AgentManager();

program
  .name('agentpay-agent')
  .description('AgentPayyKit - Agent Management Commands')
  .version('1.0.0');

program
  .command('setup')
  .description('Setup AI agent with wallet and APIs')
  .option('--name <name>', 'Agent name')
  .option('--apis <apis...>', 'APIs to register')
  .option('--balance <amount>', 'Initial balance to deposit')
  .option('--no-interactive', 'Skip interactive setup')
  .action(async (options) => {
    await agentManager.setupAgent(options);
  });

program
  .command('mock <modelId> <input>')
  .description('Test API with mock mode (no payment)')
  .action(async (modelId, input) => {
    await agentManager.mockCall(modelId, input);
  });

program
  .command('balance')
  .description('Balance management commands')
  .addCommand(
    new Command('deposit <amount>')
      .description('Deposit USDC to balance')
      .option('--token <address>', 'Token contract address')
      .action(async (amount, options) => {
        await agentManager.depositBalance(amount, options);
      })
  )
  .addCommand(
    new Command('withdraw <amount>')
      .description('Withdraw USDC from balance')
      .option('--token <address>', 'Token contract address')
      .action(async (amount, options) => {
        await agentManager.withdrawBalance(amount, options);
      })
  )
  .addCommand(
    new Command('check')
      .description('Check current balance')
      .option('--address <address>', 'Check balance for specific address')
      .option('--token <address>', 'Token contract address')
      .action(async (options) => {
        await agentManager.checkBalance(options);
      })
  );

program
  .command('register-api <modelId> <price>')
  .description('Register new API endpoint')
  .option('--endpoint <url>', 'API endpoint URL')
  .option('--token <address>', 'Payment token address')
  .option('--description <desc>', 'API description')
  .action(async (modelId, price, options) => {
    await agentManager.registerAPI(modelId, price, options);
  });

program
  .command('financials')
  .alias('money')
  .description('Show financial overview')
  .action(async () => {
    await agentManager.getFinancials();
  });

program
  .command('earnings')
  .description('Earnings management commands')
  .addCommand(
    new Command('withdraw')
      .description('Withdraw all earnings')
      .option('--token <address>', 'Token contract address')
      .action(async (options) => {
        await agentManager.withdrawEarnings(options);
      })
  );

program
  .command('batch <calls...>')
  .description('Batch multiple API calls (smart accounts only)')
  .action(async (calls) => {
    await agentManager.batchCall(calls);
  });

if (require.main === module) {
  program.parse();
}

export { AgentManager }; 