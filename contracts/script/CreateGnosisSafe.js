#!/usr/bin/env node

/**
 * AgentPayy Gnosis Safe Creation Script
 * 
 * This script helps you create Gnosis Safes across multiple networks
 * for use with AgentPayy governance deployment.
 * 
 * Usage:
 *   node script/CreateGnosisSafe.js --network base --owners 0x123,0x456 --threshold 2
 */

const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// Gnosis Safe factory addresses (same across all networks)
const SAFE_FACTORY_ADDRESS = '0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2';
const SAFE_SINGLETON_ADDRESS = '0xd9Db270c1B5E3Bd161E8c8503c55cEABeE709552';

// Network configurations
const NETWORKS = {
  ethereum: {
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/' + process.env.ALCHEMY_API_KEY,
    explorerUrl: 'https://etherscan.io'
  },
  base: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    explorerUrl: 'https://basescan.org'
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    explorerUrl: 'https://arbiscan.io'
  },
  optimism: {
    chainId: 10,
    rpcUrl: 'https://mainnet.optimism.io',
    explorerUrl: 'https://optimistic.etherscan.io'
  },
  unichain: {
    chainId: 1301,
    rpcUrl: 'https://rpc.unichain.org',
    explorerUrl: 'https://unichain-sepolia.blockscout.com' // Update when mainnet explorer is available
  },
  worldchain: {
    chainId: 480,
    rpcUrl: 'https://worldchain-mainnet.g.alchemy.com/public',
    explorerUrl: 'https://worldchain-mainnet.explorer.alchemy.com'
  },
  linea: {
    chainId: 59144,
    rpcUrl: 'https://rpc.linea.build',
    explorerUrl: 'https://lineascan.build'
  }
};

// Gnosis Safe factory ABI (minimal)
const SAFE_FACTORY_ABI = [
  'function createProxyWithNonce(address _singleton, bytes initializer, uint256 saltNonce) returns (address proxy)',
  'function proxyCreationCode() view returns (bytes)',
  'event ProxyCreation(address proxy, address singleton)'
];

// Gnosis Safe singleton ABI (minimal)
const SAFE_SINGLETON_ABI = [
  'function setup(address[] _owners, uint256 _threshold, address to, bytes calldata data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)'
];

async function createGnosisSafe(network, owners, threshold, saltNonce = 0) {
  console.log(`\n🔐 Creating Gnosis Safe on ${network}...`);
  console.log(`Owners: ${owners.join(', ')}`);
  console.log(`Threshold: ${threshold}/${owners.length}`);
  
  const networkConfig = NETWORKS[network];
  if (!networkConfig) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  // Setup provider and wallet
  const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log(`Deployer: ${wallet.address}`);
  console.log(`Balance: ${ethers.formatEther(await provider.getBalance(wallet.address))} ETH`);
  
  // Create factory contract instance
  const factory = new ethers.Contract(SAFE_FACTORY_ADDRESS, SAFE_FACTORY_ABI, wallet);
  const singleton = new ethers.Contract(SAFE_SINGLETON_ADDRESS, SAFE_SINGLETON_ABI, wallet);
  
  // Prepare setup data
  const setupData = singleton.interface.encodeFunctionData('setup', [
    owners,           // _owners
    threshold,        // _threshold
    ethers.ZeroAddress, // to (no module setup)
    '0x',            // data (no module setup)
    ethers.ZeroAddress, // fallbackHandler
    ethers.ZeroAddress, // paymentToken
    0,               // payment
    ethers.ZeroAddress  // paymentReceiver
  ]);
  
  // Calculate expected Safe address
  const proxyCreationCode = await factory.proxyCreationCode();
  const salt = ethers.solidityPackedKeccak256(['uint256'], [saltNonce]);
  const deploymentData = ethers.solidityPacked(
    ['bytes', 'uint256'],
    [proxyCreationCode, SAFE_SINGLETON_ADDRESS]
  );
  const expectedAddress = ethers.getCreate2Address(
    SAFE_FACTORY_ADDRESS,
    salt,
    ethers.keccak256(deploymentData)
  );
  
  console.log(`Expected Safe address: ${expectedAddress}`);
  
  // Check if Safe already exists
  const code = await provider.getCode(expectedAddress);
  if (code !== '0x') {
    console.log('✅ Safe already exists at this address!');
    return expectedAddress;
  }
  
  // Deploy the Safe
  console.log('📤 Deploying Safe...');
  const tx = await factory.createProxyWithNonce(
    SAFE_SINGLETON_ADDRESS,
    setupData,
    saltNonce
  );
  
  console.log(`Transaction hash: ${tx.hash}`);
  console.log(`Explorer: ${networkConfig.explorerUrl}/tx/${tx.hash}`);
  
  const receipt = await tx.wait();
  console.log(`✅ Safe deployed! Gas used: ${receipt.gasUsed.toString()}`);
  
  // Find the actual Safe address from events
  const proxyCreationEvent = receipt.logs.find(log => {
    try {
      const parsed = factory.interface.parseLog(log);
      return parsed.name === 'ProxyCreation';
    } catch {
      return false;
    }
  });
  
  const actualAddress = proxyCreationEvent ? 
    factory.interface.parseLog(proxyCreationEvent).args.proxy : 
    expectedAddress;
  
  console.log(`🎉 Gnosis Safe created: ${actualAddress}`);
  console.log(`Safe URL: https://app.safe.global/${network}:${actualAddress}`);
  
  return actualAddress;
}

async function createMultiNetworkSafes(networks, owners, threshold) {
  console.log('🌐 Creating Gnosis Safes across multiple networks...');
  
  const results = {};
  const saltNonce = Math.floor(Date.now() / 1000); // Use timestamp as salt
  
  for (const network of networks) {
    try {
      const safeAddress = await createGnosisSafe(network, owners, threshold, saltNonce);
      results[network] = safeAddress;
    } catch (error) {
      console.error(`❌ Failed to create Safe on ${network}:`, error.message);
      results[network] = null;
    }
  }
  
  return results;
}

function generateEnvFile(results) {
  console.log('\n📝 Generating environment variables...');
  
  const envLines = [
    '# Gnosis Safe addresses for AgentPayy governance',
    '# Generated by CreateGnosisSafe.js',
    ''
  ];
  
  for (const [network, address] of Object.entries(results)) {
    if (address) {
      envLines.push(`GNOSIS_SAFE_${network.toUpperCase()}=${address}`);
    }
  }
  
  envLines.push('');
  envLines.push('# Use this for deployment scripts:');
  envLines.push('GNOSIS_SAFE_ADDRESS=${GNOSIS_SAFE_BASE}  # or your preferred network');
  
  const envContent = envLines.join('\n');
  
  // Write to .env.safes file
  fs.writeFileSync('.env.safes', envContent);
  console.log('✅ Environment variables written to .env.safes');
  console.log('Add these to your main .env file:');
  console.log(envContent);
}

function generateDeploymentConfig(results, owners, threshold) {
  console.log('\n📋 Generating deployment configuration...');
  
  const config = {
    safes: results,
    owners: owners,
    threshold: threshold,
    createdAt: new Date().toISOString(),
    networks: Object.keys(results).filter(network => results[network])
  };
  
  fs.writeFileSync('gnosis-safes.json', JSON.stringify(config, null, 2));
  console.log('✅ Configuration saved to gnosis-safes.json');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse command line arguments
  let network = null;
  let networks = [];
  let owners = [];
  let threshold = 2;
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--network':
        network = args[++i];
        break;
      case '--networks':
        networks = args[++i].split(',');
        break;
      case '--owners':
        owners = args[++i].split(',').map(addr => addr.trim());
        break;
      case '--threshold':
        threshold = parseInt(args[++i]);
        break;
      case '--help':
        console.log(`
AgentPayy Gnosis Safe Creation Tool

Usage:
  node script/CreateGnosisSafe.js [options]

Options:
  --network <name>        Create Safe on single network (ethereum, base, arbitrum, optimism, unichain, worldchain)
  --networks <list>       Create Safes on multiple networks (comma-separated)
  --owners <addresses>    Comma-separated list of owner addresses
  --threshold <number>    Number of signatures required (default: 2)
  --help                  Show this help message

Examples:
  # Create Safe on Base with 2/3 multisig
  node script/CreateGnosisSafe.js --network base --owners 0x123,0x456,0x789 --threshold 2
  
  # Create Safes on target networks
  node script/CreateGnosisSafe.js --networks base,arbitrum,optimism,ethereum,worldchain,unichain --owners 0x123,0x456 --threshold 2

Environment Variables Required:
  PRIVATE_KEY             Private key for deployment
  ALCHEMY_API_KEY         Alchemy API key (for Ethereum)
        `);
        return;
    }
  }
  
  // Validation
  if (!process.env.PRIVATE_KEY) {
    console.error('❌ PRIVATE_KEY environment variable required');
    return;
  }
  
  if (owners.length === 0) {
    console.error('❌ At least one owner address required (--owners)');
    return;
  }
  
  if (threshold > owners.length) {
    console.error('❌ Threshold cannot be greater than number of owners');
    return;
  }
  
  // Validate owner addresses
  for (const owner of owners) {
    if (!ethers.isAddress(owner)) {
      console.error(`❌ Invalid address: ${owner}`);
      return;
    }
  }
  
  // Determine networks to deploy to
  if (network) {
    networks = [network];
  } else if (networks.length === 0) {
    // Default to target networks
    networks = ['base', 'arbitrum', 'optimism', 'ethereum', 'worldchain', 'unichain'];
  }
  
  console.log('🚀 AgentPayy Gnosis Safe Creation');
  console.log('================================');
  console.log(`Networks: ${networks.join(', ')}`);
  console.log(`Owners: ${owners.length}`);
  console.log(`Threshold: ${threshold}`);
  
  try {
    const results = await createMultiNetworkSafes(networks, owners, threshold);
    
    // Generate configuration files
    generateEnvFile(results);
    generateDeploymentConfig(results, owners, threshold);
    
    console.log('\n🎉 Gnosis Safe creation complete!');
    console.log('\nNext steps:');
    console.log('1. Add the environment variables to your .env file');
    console.log('2. Run the governance deployment script:');
    console.log('   npm run governance:deploy:target');
    console.log('3. Your contracts will be owned by the timelock, controlled by your Gnosis Safes');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createGnosisSafe, createMultiNetworkSafes };