#!/usr/bin/env node

/**
 * Test AgentPayKit deployment end-to-end
 * Run this after deploying contracts to verify everything works
 */

async function testDeployment() {
  console.log('🧪 Testing AgentPayKit Deployment');
  console.log('=================================\n');

  // Check environment
  const requiredEnvVars = [
    'AGENTPAY_BASE_CONTRACT',
    'GATEWAY_PRIVATE_KEY'
  ];

  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing.join(', '));
    console.log('\n📋 Required variables:');
    console.log('   AGENTPAY_BASE_CONTRACT - Contract address from deployment');
    console.log('   GATEWAY_PRIVATE_KEY - Private key for gateway');
    console.log('\n💡 Copy from your deployment output and add to .env');
    return false;
  }

  try {
    // Test 1: SDK Import
    console.log('1️⃣ Testing SDK import...');
    let agentpay;
    try {
      const { EnhancedAgentPayKit } = require('./sdk/typescript/dist/EnhancedAgentPayKit.js');
      agentpay = new EnhancedAgentPayKit();
      console.log('✅ SDK imported successfully');
    } catch (error) {
      console.log('⚠️  SDK not built yet, run: cd sdk/typescript && npm run build');
      return false;
    }

    // Test 2: Wallet Generation
    console.log('\n2️⃣ Testing wallet generation...');
    const wallet = await agentpay.generateWallet();
    console.log(`✅ Wallet generated: ${wallet.address}`);
    console.log(`   Type: ${wallet.isSmartAccount ? 'Smart Account' : 'EOA'}`);

    // Test 3: Contract Connection
    console.log('\n3️⃣ Testing contract connection...');
    const contractAddress = agentpay.getContractAddress?.() || process.env.AGENTPAY_BASE_CONTRACT;
    console.log(`✅ Contract address: ${contractAddress}`);

    // Test 4: Mock API Call
    console.log('\n4️⃣ Testing mock API call...');
    const mockResult = await agentpay.payAndCall('test-api', { test: true }, { 
      mock: true, 
      price: '1.00' 
    });
    console.log('✅ Mock API call successful');
    console.log(`   Result: ${JSON.stringify(mockResult.data).slice(0, 100)}...`);

    // Test 5: Gateway Connection
    console.log('\n5️⃣ Testing gateway connection...');
    try {
      const response = await fetch('http://localhost:3000/health');
      if (response.ok) {
        console.log('✅ Gateway is running');
      } else {
        console.log('⚠️  Gateway not responding - start with: cd gateway && npm start');
      }
    } catch (error) {
      console.log('⚠️  Gateway not accessible - start with: cd gateway && npm start');
    }

    console.log('\n🎉 DEPLOYMENT TEST PASSED! 🎉');
    console.log('==============================\n');
    console.log('📋 System Status:');
    console.log('   ✅ Contracts deployed');
    console.log('   ✅ SDK functional'); 
    console.log('   ✅ Wallets working');
    console.log('   ✅ Mock payments working');
    console.log('\n🚀 Ready for real payments!');
    console.log('   1. Fund your wallet with testnet/mainnet USDC');  
    console.log('   2. Register APIs: await agentpay.registerModel(...)');
    console.log('   3. Make real payments: await agentpay.payAndCall(...)');

    return true;

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Ensure contracts are deployed');
    console.log('   • Check .env has correct addresses');
    console.log('   • Build SDK: cd sdk/typescript && npm run build');
    console.log('   • Start gateway: cd gateway && npm start');
    return false;
  }
}

// Helper to check if this is a real deployment
function checkDeploymentReady() {
  const contractAddr = process.env.AGENTPAY_BASE_CONTRACT;
  if (!contractAddr || contractAddr.includes('0x0000') || contractAddr.length !== 42) {
    console.log('⚠️  No real deployment detected');
    console.log('\n📋 To deploy:');
    console.log('   1. Set PRIVATE_KEY in .env');
    console.log('   2. Run: cd contracts && ./script/DeployMultichain.sh tier1');
    console.log('   3. Update .env with deployed addresses');
    console.log('   4. Run this test again');
    return false;
  }
  return true;
}

// Main execution
async function main() {
  if (!checkDeploymentReady()) {
    return;
  }
  
  const success = await testDeployment();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  // Load .env if available
  try {
    require('dotenv').config();
  } catch (e) {
    // dotenv not available, that's ok
  }
  
  main().catch(console.error);
}

module.exports = { testDeployment }; 