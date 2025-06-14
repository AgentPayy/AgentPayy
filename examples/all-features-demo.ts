import { 
  AgentPayKit, 
  ReputationModule, 
  AttributionModule,
  AgentPayWall,
  APIRegistry 
} from '@agentpay/sdk';
import { ethers } from 'ethers';

async function demoAllFeatures() {
  console.log('🚀 AgentPay Demo - All Features from Single Package');
  
  // Initialize AgentPay with wallet
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!);
  const agentpay = new AgentPayKit({
    wallet,
    network: 'base',
    gatewayUrl: 'http://localhost:3000'
  });
  
  // Initialize specialized modules (all from same package)
  const reputation = new ReputationModule('http://localhost:3000');
  const attribution = new AttributionModule('http://localhost:3000');
  const registry = new APIRegistry('http://localhost:3000');
  
  // 1. Basic API Call
  console.log('\n1. Basic API Call');
  try {
    const result = await agentpay.callAPI(
      'https://api.weather.com/v1/current',
      { city: 'New York' },
      'weather-api'
    );
    console.log('✅ API call successful:', result.response);
    console.log('💰 Cost:', result.cost);
  } catch (error) {
    console.log('❌ API call failed:', error);
  }

  // 2. Attribution Payments (Revenue Sharing)
  console.log('\n2. Attribution Payments');
  try {
    const attributions = [
      { recipient: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1', basisPoints: 6000 }, // 60%
      { recipient: '0x8ba1f109551bD432803012645Hac136c', basisPoints: 4000 }  // 40%
    ];

    const result = await attribution.payWithAttribution(
      'complex-analysis',
      { data: 'market analysis request' },
      attributions,
      { price: '0.10' }
    );
    console.log('✅ Attribution payment successful:', result.txHash);
  } catch (error) {
    console.log('❌ Attribution payment failed:', error);
  }

  // 3. Balance Management
  console.log('\n3. Balance Management');
  try {
    // Deposit to prepaid balance
    await agentpay.depositBalance('10.0');
    console.log('✅ Deposited $10 to balance');

    // Check balance
    const balance = await agentpay.getUserBalance();
    console.log('💰 Current balance:', balance, 'USDC');

    // Use balance for API call (no wallet popup)
    const result = await agentpay.callAPI(
      'https://api.example.com/sentiment',
      { text: 'AgentPay is amazing!' },
      'sentiment-api',
      { useBalance: true }
    );
    console.log('✅ Balance payment successful');
  } catch (error) {
    console.log('❌ Balance management failed:', error);
  }

  // 4. Reputation System
  console.log('\n4. Reputation System');
  try {
    const agentAddress = '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b1';
    const agentRep = await reputation.getReputation(agentAddress);
    console.log('📊 Agent reputation:', {
      rating: agentRep.rating,
      successRate: agentRep.successRate,
      totalCalls: agentRep.totalCalls
    });

    // Find specialists
    const specialists = await reputation.findAgentsBySpecialty('weather-data', 4.0);
    console.log('🎯 Weather specialists found:', specialists.length);

    // Get leaderboard
    const leaderboard = await reputation.getLeaderboard(5);
    console.log('🏆 Top 5 agents:', leaderboard.map(a => a.address));
  } catch (error) {
    console.log('❌ Reputation system failed:', error);
  }

  // 5. API Registry & Marketplace
  console.log('\n5. API Registry & Marketplace');
  try {
    // Register an API
    await registry.registerModel({
      modelId: 'demo-weather-api',
      endpoint: 'https://api.myservice.com/weather',
      price: '0.02',
      category: 'Weather & Environment',
      tags: ['weather', 'forecast', 'temperature'],
      description: 'Real-time weather data API'
    });
    console.log('✅ API registered successfully');

    // Discover APIs by category
    const weatherAPIs = await registry.getAPIsByCategory('Weather & Environment');
    console.log('🔍 Weather APIs found:', weatherAPIs.length);

    // Search by tags
    const forecastAPIs = await registry.searchAPIsByTag('forecast');
    console.log('🏷️ Forecast APIs found:', forecastAPIs.length);

    // Get marketplace stats
    const stats = await registry.getMarketplaceStats();
    console.log('📈 Marketplace stats:', {
      totalAPIs: stats.totalAPIs,
      totalDevelopers: stats.totalDevelopers,
      totalRevenue: stats.totalRevenue
    });
  } catch (error) {
    console.log('❌ API registry failed:', error);
  }

  // 6. Paywall Middleware (Express.js)
  console.log('\n6. Paywall Middleware Demo');
  try {
    const paywall = new AgentPayWall({
      apiKey: 'demo-api-key',
      pricePerQuery: '0.01',
      chain: 'base'
    });

    console.log('✅ Paywall initialized');
    console.log('🔧 Use paywall.protect() middleware in Express routes');
    console.log('📊 Analytics available via paywall.getAnalytics()');
  } catch (error) {
    console.log('❌ Paywall setup failed:', error);
  }

  console.log('\n🎉 Demo completed! All features from single @agentpay/sdk package');
}

// Run demo
if (require.main === module) {
  demoAllFeatures().catch(console.error);
}

export { demoAllFeatures }; 