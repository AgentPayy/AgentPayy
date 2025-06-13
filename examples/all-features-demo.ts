import { EnhancedAgentPayKit } from '../sdk/typescript/src/EnhancedAgentPayKit';

async function demoAllFeatures() {
  const agentpay = new EnhancedAgentPayKit('http://localhost:3000');
  
  // Setup agent
  const wallet = await agentpay.generateWallet({ smart: true });
  console.log(`🤖 Agent wallet: ${wallet.address}`);

  // === 1. REVENUE ATTRIBUTION DEMO ===
  console.log('\n💰 REVENUE ATTRIBUTION DEMO');
  
  // Multi-agent research pipeline
  const attributions = [
    { recipient: '0xWeatherBot', basisPoints: 2000 },    // 20% for weather data
    { recipient: '0xNewsBot', basisPoints: 3000 },       // 30% for news analysis  
    { recipient: '0xAnalysisBot', basisPoints: 5000 }    // 50% for final analysis
  ];

  const result = await agentpay.payWithAttribution(
    'market-research-v1',
    { query: 'NVDA stock analysis' },
    attributions,
    { price: '0.05' }
  );

  console.log('✅ Payment split across 3 agents automatically!');
  console.log(`Data: ${JSON.stringify(result.data)}`);

  // === 2. REPUTATION API DEMO ===
  console.log('\n📊 REPUTATION API DEMO');
  
  // Check agent reputation
  const reputation = await agentpay.getReputation(wallet.address);
  console.log(`Agent rating: ${reputation.rating}/5.0`);
  console.log(`Success rate: ${reputation.successRate}%`);
  console.log(`Specialties: ${reputation.specialties.join(', ')}`);

  // Get top performers
  const leaderboard = await agentpay.getLeaderboard(5);
  console.log('\nTop 5 Agents:');
  leaderboard.forEach((agent, i) => {
    console.log(`${i+1}. ${agent.address.slice(0,8)}... - ${agent.rating}/5.0 (${agent.totalCalls} calls)`);
  });

  // === 3. TASK ESCROW DEMO ===
  console.log('\n📋 TASK ESCROW DEMO');
  
  // Create timeout-based task
  const taskId = await agentpay.createTimeoutTask(
    '0xDataProcessor',
    '0.25',
    30 // 30 minutes timeout
  );
  
  console.log(`✅ Escrowed task created: ${taskId}`);
  
  // Worker completes task
  const success = await agentpay.completeTask(taskId, {
    processed: true,
    rows: 1000,
    format: 'json'
  });
  
  console.log(`✅ Task completed: ${success}`);

  // === COMBINED WORKFLOW DEMO ===
  console.log('\n🚀 COMBINED WORKFLOW DEMO');
  
  // Create a complex agent-to-agent task with attribution
  const complexTaskId = await agentpay.createTask({
    worker: '0xComplexAnalysisBot',
    amount: '1.00',
    escrowType: 'mutual',
    rules: {
      attributions: [
        { recipient: '0xDataBot', basisPoints: 3000 },
        { recipient: '0xMLBot', basisPoints: 4000 },
        { recipient: '0xReportBot', basisPoints: 3000 }
      ]
    }
  });
  
  console.log(`🎯 Complex multi-agent task created: ${complexTaskId}`);
  console.log('This showcases the full power of AgentPayy!');
}

// === BUSINESS IMPACT EXAMPLES ===

// Example 1: LangChain Research Pipeline
async function langchainExample() {
  const agentpay = new EnhancedAgentPayKit();
  await agentpay.generateWallet();

  // Instead of each tool having separate payment logic:
  const result = await agentpay.payWithAttribution(
    'research-pipeline',
    { topic: 'AGI developments' },
    [
      { recipient: '0xSearchTool', basisPoints: 1500 },     // 15% - Web search
      { recipient: '0xScraper', basisPoints: 2000 },        // 20% - Content extraction  
      { recipient: '0xAnalyzer', basisPoints: 4000 },       // 40% - AI analysis
      { recipient: '0xSummarizer', basisPoints: 2500 }      // 25% - Report generation
    ],
    { price: '0.20' }
  );

  // One payment, automatic distribution to 4 specialized agents!
}

// Example 2: Agent Marketplace
async function marketplaceExample() {
  const agentpay = new EnhancedAgentPayKit();
  
  // Find best agents for your task
  const leaderboard = await agentpay.getLeaderboard(20);
  const bestDataAgent = leaderboard.find(agent => 
    agent.specialties.includes('data-analysis') && agent.rating > 4.5
  );

  // Create escrowed task for reliability
  const taskId = await agentpay.createMutualTask(
    bestDataAgent!.address,
    '2.50' // Higher value task
  );

  console.log(`📊 Hired top-rated data agent for complex analysis task`);
}

export { demoAllFeatures, langchainExample, marketplaceExample }; 