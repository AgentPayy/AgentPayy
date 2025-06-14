#!/usr/bin/env node

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { ethers } from 'ethers';
import { apiRegistry } from '@agentpay/registry';
import { getContractAddress } from '@agentpay/core';

interface APIRegistrationData {
  modelId: string;
  name: string;
  description: string;
  category: string;
  endpoint: string;
  price: string;
  tags: string[];
  examples: Array<{
    input: any;
    output: any;
    description: string;
  }>;
}

const categories = [
  'Weather & Environment',
  'Financial Data',
  'Crypto Data',
  'Artificial Intelligence',
  'Translation',
  'Image Processing',
  'Text Processing',
  'General'
];

export const registerCommand = new Command('register')
  .description('Register your API in the AgentPayyKit marketplace')
  .option('-i, --interactive', 'Interactive registration mode')
  .option('-f, --file <path>', 'Load configuration from JSON file')
  .option('--private-key <key>', 'Private key for transaction signing')
  .option('--rpc-url <url>', 'Custom RPC URL')
  .option('--chain <chain>', 'Target chain (base, arbitrum, optimism)', 'base')
  .action(async (options) => {
    console.log(chalk.blue.bold('\n🚀 AgentPayyKit API Registration\n'));

    try {
      let registrationData: APIRegistrationData;

      if (options.file) {
        registrationData = await loadFromFile(options.file);
      } else {
        registrationData = await interactiveRegistration();
      }

      // Validate the data
      const validation = validateRegistrationData(registrationData);
      if (!validation.valid) {
        console.log(chalk.red('❌ Validation failed:'));
        validation.errors.forEach(error => console.log(chalk.red(`  • ${error}`)));
        return;
      }

      // Get wallet for signing
      const wallet = await getWallet(options);
      if (!wallet) {
        console.log(chalk.red('❌ Failed to initialize wallet'));
        return;
      }

      // Test API endpoint
      const spinner = ora('Testing API endpoint...').start();
      const endpointTest = await testEndpoint(registrationData.endpoint);
      if (!endpointTest.success) {
        spinner.fail('API endpoint test failed');
        console.log(chalk.yellow(`⚠️  Warning: ${endpointTest.error}`));
        
        const { proceed } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'proceed',
            message: 'Do you want to proceed anyway?',
            default: false
          }
        ]);
        
        if (!proceed) return;
      } else {
        spinner.succeed('API endpoint is accessible');
      }

      // Register the API
      await registerAPI(registrationData, wallet, options.chain);

    } catch (error) {
      console.log(chalk.red(`❌ Registration failed: ${error instanceof Error ? error.message : error}`));
    }
  });

async function interactiveRegistration(): Promise<APIRegistrationData> {
  console.log(chalk.cyan('Please provide the following information about your API:\n'));

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'modelId',
      message: 'API Model ID (unique identifier):',
      validate: (input) => {
        if (!input || input.length < 3) return 'Model ID must be at least 3 characters';
        if (!/^[a-zA-Z0-9-_]+$/.test(input)) return 'Model ID can only contain letters, numbers, hyphens, and underscores';
        return true;
      }
    },
    {
      type: 'input',
      name: 'name',
      message: 'API Display Name:',
      validate: (input) => input ? true : 'Name is required'
    },
    {
      type: 'input',
      name: 'description',
      message: 'API Description:',
      validate: (input) => input ? true : 'Description is required'
    },
    {
      type: 'list',
      name: 'category',
      message: 'Select API Category:',
      choices: categories
    },
    {
      type: 'input',
      name: 'endpoint',
      message: 'API Endpoint URL:',
      validate: (input) => {
        try {
          new URL(input);
          return true;
        } catch {
          return 'Please enter a valid URL';
        }
      }
    },
    {
      type: 'input',
      name: 'price',
      message: 'Price per API call (in USDC):',
      validate: (input) => {
        const price = parseFloat(input);
        if (isNaN(price) || price <= 0) return 'Price must be a positive number';
        if (price > 100) return 'Price cannot exceed $100 per call';
        return true;
      }
    },
    {
      type: 'input',
      name: 'tags',
      message: 'Tags (comma-separated):',
      filter: (input) => input.split(',').map((tag: string) => tag.trim()).filter(Boolean)
    }
  ]);

  // Collect examples
  const examples = [];
  let addMoreExamples = true;

  while (addMoreExamples && examples.length < 3) {
    console.log(chalk.cyan(`\nExample ${examples.length + 1}:`));
    
    const exampleAnswers = await inquirer.prompt([
      {
        type: 'input',
        name: 'description',
        message: 'Example description:',
        validate: (input) => input ? true : 'Description is required'
      },
      {
        type: 'input',
        name: 'input',
        message: 'Example input (JSON):',
        validate: (input) => {
          try {
            JSON.parse(input);
            return true;
          } catch {
            return 'Please enter valid JSON';
          }
        }
      },
      {
        type: 'input',
        name: 'output',
        message: 'Example output (JSON):',
        validate: (input) => {
          try {
            JSON.parse(input);
            return true;
          } catch {
            return 'Please enter valid JSON';
          }
        }
      }
    ]);

    examples.push({
      description: exampleAnswers.description,
      input: JSON.parse(exampleAnswers.input),
      output: JSON.parse(exampleAnswers.output)
    });

    if (examples.length < 3) {
      const { addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Add another example?',
          default: false
        }
      ]);
      addMoreExamples = addMore;
    }
  }

  return {
    ...answers,
    examples
  };
}

async function loadFromFile(filePath: string): Promise<APIRegistrationData> {
  const fs = await import('fs/promises');
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

function validateRegistrationData(data: APIRegistrationData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.modelId || data.modelId.length < 3) {
    errors.push('Model ID must be at least 3 characters');
  }

  if (!data.name) {
    errors.push('Name is required');
  }

  if (!data.description) {
    errors.push('Description is required');
  }

  if (!categories.includes(data.category)) {
    errors.push(`Category must be one of: ${categories.join(', ')}`);
  }

  try {
    new URL(data.endpoint);
  } catch {
    errors.push('Endpoint must be a valid URL');
  }

  const price = parseFloat(data.price);
  if (isNaN(price) || price <= 0) {
    errors.push('Price must be a positive number');
  }

  if (!Array.isArray(data.tags)) {
    errors.push('Tags must be an array');
  }

  if (!Array.isArray(data.examples)) {
    errors.push('Examples must be an array');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

async function getWallet(options: any): Promise<ethers.Wallet | null> {
  let privateKey = options.privateKey;

  if (!privateKey) {
    const { key } = await inquirer.prompt([
      {
        type: 'password',
        name: 'key',
        message: 'Enter your private key:',
        mask: '*'
      }
    ]);
    privateKey = key;
  }

  try {
    const rpcUrl = options.rpcUrl || getRPCUrl(options.chain);
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Verify wallet has funds
    const balance = await wallet.provider.getBalance(wallet.address);
    if (balance === 0n) {
      console.log(chalk.yellow('⚠️  Warning: Wallet has no ETH for gas fees'));
    }

    return wallet;
  } catch (error) {
    console.log(chalk.red('❌ Invalid private key'));
    return null;
  }
}

async function testEndpoint(endpoint: string): Promise<{ success: boolean; error?: string }> {
  try {
    const healthUrl = `${endpoint}/health`;
    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'AgentPayyKit-CLI/1.0' }
    });

    if (response.ok) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: `Health check failed with status ${response.status}` 
      };
    }
  } catch (error) {
    return { 
      success: false, 
      error: `Unable to reach endpoint: ${error instanceof Error ? error.message : error}` 
    };
  }
}

async function registerAPI(data: APIRegistrationData, wallet: ethers.Wallet, chain: string): Promise<void> {
  const spinner = ora('Registering API on blockchain...').start();

  try {
    // Check if API already exists
    const existingAPI = await apiRegistry.getAPI(data.modelId);
    if (existingAPI) {
      spinner.fail('API with this model ID already exists');
      return;
    }

    // Register the API
    const txHash = await apiRegistry.registerAPI(
      data.modelId,
      {
        name: data.name,
        description: data.description,
        category: data.category,
        endpoint: data.endpoint,
        price: data.price,
        tags: data.tags,
        examples: data.examples
      },
      wallet
    );

    spinner.succeed('API registered successfully!');

    // Display registration details
    console.log(chalk.green('\n✅ Registration Complete!\n'));
    console.log(chalk.cyan('📋 Registration Details:'));
    console.log(`   Model ID: ${chalk.white(data.modelId)}`);
    console.log(`   Name: ${chalk.white(data.name)}`);
    console.log(`   Category: ${chalk.white(data.category)}`);
    console.log(`   Price: ${chalk.white('$' + data.price)} USDC per call`);
    console.log(`   Endpoint: ${chalk.white(data.endpoint)}`);
    console.log(`   Transaction: ${chalk.blue(txHash)}`);

    // Show next steps
    console.log(chalk.cyan('\n🎯 Next Steps:'));
    console.log('1. Add the paywall SDK to your API:');
    console.log(chalk.gray('   npm install @agentpaykit/paywall-sdk'));
    console.log('2. Protect your routes:');
    console.log(chalk.gray('   app.use(\'/api\', paywall.protect())'));
    console.log('3. Your API is now live in the marketplace!');
    console.log(`4. View your API: ${chalk.blue(`https://marketplace.agentpaykit.com/api/${data.modelId}`)}`);

    // Show integration code
    console.log(chalk.cyan('\n📝 Integration Code:'));
    console.log(chalk.gray(`
import { AgentPayyWall } from '@agentpaykit/paywall-sdk';

const paywall = new AgentPayyWall({
  apiKey: '${data.modelId}',
  pricePerQuery: '${data.price}'
});

app.use('/api', paywall.protect());
    `));

  } catch (error) {
    spinner.fail('Registration failed');
    console.log(chalk.red(`Error: ${error instanceof Error ? error.message : error}`));
  }
}

function getRPCUrl(chain: string): string {
  const urls: Record<string, string> = {
    base: 'https://mainnet.base.org',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    optimism: 'https://mainnet.optimism.io'
  };
  
  return urls[chain] || urls.base;
}

// Export for use in main CLI
export { registerCommand }; 