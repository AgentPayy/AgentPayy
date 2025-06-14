import { AgentPayKit, ReputationModule, AttributionModule } from '../sdk/typescript/src/index';
import { ethers } from 'ethers';

async function demoAllFeatures() {
  // Initialize AgentPay with wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
  const agentpay = new AgentPayKit(wallet, 'base', 'http://localhost:3000');
  
  // Initialize modules
  const reputation = new ReputationModule('http://localhost:3000');
  const attribution = new AttributionModule('http://localhost:3000');
  
  console.log('🚀 AgentPay Demo - All Features');
  
  // 1. Basic API Call
  console.log('\n1. Basic API Call');
  try {
    const result = await agentpay.callAPI(
      'https://api.weather.com/v1/current',
      { city: 'New York' },
      'weather-api'
    );
    console.log('✅ API call successful:', result);
  } catch (error) {
    console.log('ℹ️ API call demo (would work with real API)');
  }
  
  // 2. Balance Management
  console.log('\n2. Balance Management');
  try {
    const balance = await agentpay.getUserBalance();
    console.log(`💰 Current balance: $${balance} USDC`);
    
    // Deposit example (commented out to avoid real transactions)
    // await agentpay.depositBalance('10.0');
    console.log('ℹ️ Deposit: await agentpay.depositBalance("10.0")');
  } catch (error) {
    console.log('ℹ️ Balance check demo');
  }
  
  // 3. Attribution Payments
  console.log('\n3. Attribution Payments');
  try {
    const attributions = [
      { recipient: '0x1234...', basisPoints: 6000 }, // 60%
      { recipient: '0x5678...', basisPoints: 4000 }  // 40%
    ];
    
    console.log('ℹ️ Attribution setup:', attributions);
    // const result = await attribution.payWithAttribution('analysis-api', input, attributions, options);
  } catch (error) {
    console.log('ℹ️ Attribution demo');
  }
  
  // 4. Reputation System
  console.log('\n4. Reputation System');
  try {
    const leaderboard = await reputation.getLeaderboard(5);
    console.log('🏆 Top agents:', leaderboard);
    
    const specialists = await reputation.findAgentsBySpecialty('weather-data', 4.0);
    console.log('🎯 Weather specialists:', specialists);
  } catch (error) {
    console.log('ℹ️ Reputation demo (requires gateway)');
  }
  
  // 5. API Discovery
  console.log('\n5. API Discovery');
  try {
    const weatherAPIs = await agentpay.getAPIsByCategory('Weather & Environment');
    console.log('🌤️ Weather APIs:', weatherAPIs);
    
    const stats = await agentpay.getMarketplaceStats();
    console.log('📊 Marketplace stats:', stats);
  } catch (error) {
    console.log('ℹ️ API discovery demo (requires gateway)');
  }
  
  console.log('\n✨ Demo complete! All features showcased.');
}

// Run demo if called directly
if (require.main === module) {
  demoAllFeatures().catch(console.error);
}

export { demoAllFeatures }; 