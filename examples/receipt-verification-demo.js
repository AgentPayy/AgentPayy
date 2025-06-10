/**
 * AgentPayKit Cryptographic Receipt System Demo
 * 
 * This demo shows how to:
 * 1. Make API calls with automatic receipt generation
 * 2. Verify receipts cryptographically 
 * 3. Prove API execution for compliance/legal purposes
 * 4. Handle disputes with on-chain evidence
 */

const { EnhancedAgentPayKit } = require('@agentpay/sdk');

async function demonstrateReceiptSystem() {
    console.log('🔒 AgentPayKit Cryptographic Receipt Demo');
    console.log('=========================================\n');

    // Initialize SDK
    const agentpay = new EnhancedAgentPayKit();
    
    // Generate smart wallet for demo
    const wallet = await agentpay.generateWallet({ smart: true });
    console.log(`💼 Wallet: ${wallet.address}\n`);

    // === STEP 1: Make API call with receipt generation ===
    console.log('📞 STEP 1: Making API call with receipt generation');
    console.log('--------------------------------------------------');
    
    const input = { city: 'New York', units: 'metric' };
    console.log(`📤 Input: ${JSON.stringify(input)}`);
    
    const result = await agentpay.callWithProof('weather-api', input, {
        price: '0.01',
        mock: false // Use real API for demo
    });

    console.log(`📦 Response: ${JSON.stringify(result.result.data).slice(0, 100)}...`);
    console.log(`💳 Transaction: ${result.result.txHash}`);
    console.log(`🧾 Receipt Status: ${result.verification.valid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (result.result.receipt) {
        console.log('\n🔍 Receipt Details:');
        console.log(`   Input Hash:    ${result.result.receipt.inputHash}`);
        console.log(`   Output Hash:   ${result.result.receipt.outputHash}`);
        console.log(`   Execution Proof: ${result.result.receipt.executionProof.slice(0, 20)}...`);
        console.log(`   Executed At:   ${new Date(result.result.receipt.executedAt * 1000).toISOString()}`);
        console.log(`   Response Size: ${result.result.receipt.responseSize} bytes`);
        console.log(`   HTTP Status:   ${result.result.receipt.httpStatus}`);
        console.log(`   Gateway:       ${result.result.receipt.gateway}`);
        console.log(`   Success:       ${result.result.receipt.success ? '✅' : '❌'}`);
    }

    // === STEP 2: Manual receipt verification ===
    console.log('\n🔍 STEP 2: Manual receipt verification');
    console.log('-------------------------------------');
    
    if (result.result.txHash) {
        const verification = await agentpay.verifyReceipt(
            result.result.txHash,
            input,
            result.result.data
        );
        
        console.log(`Verification Result: ${verification.valid ? '✅ VALID' : '❌ INVALID'}`);
        console.log(`Reason: ${verification.reason}`);
        
        if (verification.receipt) {
            console.log('📋 On-chain receipt confirmed');
        }
    }

    // === STEP 3: Tamper detection demo ===
    console.log('\n🚨 STEP 3: Tamper detection demo');
    console.log('--------------------------------');
    
    // Try to verify with tampered data
    const tamperedInput = { city: 'Los Angeles', units: 'metric' }; // Changed city
    const tamperedOutput = { ...result.result.data, temperature: 999 }; // Changed temp
    
    if (result.result.txHash) {
        console.log('Testing with tampered input...');
        const tamperedVerification1 = await agentpay.verifyReceipt(
            result.result.txHash,
            tamperedInput, // Tampered!
            result.result.data
        );
        console.log(`Result: ${tamperedVerification1.valid ? '✅ Valid' : '❌ Invalid'} - ${tamperedVerification1.reason}`);
        
        console.log('Testing with tampered output...');
        const tamperedVerification2 = await agentpay.verifyReceipt(
            result.result.txHash,
            input,
            tamperedOutput // Tampered!
        );
        console.log(`Result: ${tamperedVerification2.valid ? '✅ Valid' : '❌ Invalid'} - ${tamperedVerification2.reason}`);
    }

    // === STEP 4: Generate legal/compliance proof ===
    console.log('\n📜 STEP 4: Generate execution proof for compliance');
    console.log('------------------------------------------------');
    
    if (result.result.txHash) {
        const executionProof = await agentpay.getExecutionProof(result.result.txHash);
        
        if (executionProof) {
            console.log('📋 Legal Execution Proof Generated:');
            console.log(`   Transaction Hash: ${executionProof.transaction.hash}`);
            console.log(`   Execution Time:   ${executionProof.timestamp.toISOString()}`);
            console.log(`   Gateway Address:  ${executionProof.receipt.gateway}`);
            console.log(`   Verification:     ${executionProof.verification.valid ? '✅ Valid' : '❌ Invalid'}`);
            console.log(`   Status:          ${executionProof.receipt.success ? 'SUCCESS' : 'FAILED'}`);
            console.log('   📝 This proof can be used for legal/audit purposes');
        }
    }

    // === STEP 5: API provider perspective ===
    console.log('\n🏢 STEP 5: API provider audit trail');
    console.log('-----------------------------------');
    
    // Get call history for API owner
    const history = await agentpay.getAPICallHistory('weather-api', 10);
    console.log(`📊 Recent calls to weather-api: ${history.length} found`);
    
    // In production, this would show:
    console.log('📈 Example API provider dashboard:');
    console.log('   Total Calls:     1,234');
    console.log('   Successful:      1,201 (97.3%)');
    console.log('   Failed:          33 (2.7%)');
    console.log('   Verified:        1,234 (100%)');
    console.log('   Revenue:         $12.34 USDC');
    console.log('   Avg Response:    2.3 seconds');

    // === STEP 6: Different receipt storage options ===
    console.log('\n💾 STEP 6: Receipt storage options');
    console.log('----------------------------------');
    
    if (result.result.txHash) {
        console.log('Testing different receipt sources...');
        
        // Gateway receipt (fast, temporary)
        const gatewayReceipt = await agentpay.getGatewayReceipt(result.result.txHash);
        console.log(`Gateway Receipt: ${gatewayReceipt ? '✅ Found' : '❌ Not found'} (Redis, 24hr TTL)`);
        
        // On-chain receipt (slow, permanent)
        const onChainReceipt = await agentpay.getOnChainReceipt(result.result.txHash);
        console.log(`On-chain Receipt: ${onChainReceipt ? '✅ Found' : '❌ Not found'} (Blockchain, permanent)`);
        
        console.log('\n💡 Receipt Strategy:');
        console.log('   - Gateway: Fast access for recent calls (24 hours)');
        console.log('   - Blockchain: Permanent storage for disputes/audits');
        console.log('   - SDK automatically tries both sources');
    }

    // === STEP 7: Mock mode with receipts ===
    console.log('\n🧪 STEP 7: Mock mode with receipt generation');
    console.log('-------------------------------------------');
    
    const mockResult = await agentpay.payAndCall('ai-analysis', 
        { text: 'Analyze this text' },
        { price: '0.05', mock: true }
    );
    
    console.log('🎭 Mock API call completed:');
    console.log(`   Data: ${JSON.stringify(mockResult.data).slice(0, 50)}...`);
    console.log(`   Receipt: ${mockResult.receipt ? '✅ Generated' : '❌ Missing'}`);
    
    if (mockResult.receipt) {
        console.log(`   Input Hash: ${mockResult.receipt.inputHash}`);
        console.log(`   Output Hash: ${mockResult.receipt.outputHash}`);
        console.log(`   HTTP Status: ${mockResult.receipt.httpStatus}`);
        console.log('   💡 Mock receipts help with development & testing');
    }

    // === SUMMARY ===
    console.log('\n🎯 SUMMARY: Cryptographic Receipt Benefits');
    console.log('==========================================');
    console.log('✅ Tamper-proof execution evidence');
    console.log('✅ Automatic dispute resolution');
    console.log('✅ Compliance & audit trail');
    console.log('✅ API provider accountability');  
    console.log('✅ Payment-to-execution linkage');
    console.log('✅ Multi-layer verification (gateway + blockchain)');
    console.log('✅ Legal-grade proof of API execution');
    
    console.log('\n🚀 The receipt system transforms AgentPayKit from');
    console.log('   a payment processor into a TRUST PROTOCOL');
    console.log('   for the AI agent economy! 🤖💎');
}

// === DISPUTE RESOLUTION EXAMPLE ===
async function disputeResolutionExample() {
    console.log('\n⚖️  BONUS: Dispute Resolution Example');
    console.log('====================================');
    
    console.log('Scenario: User claims API returned wrong data');
    console.log('Resolution process:');
    console.log('1. User provides transaction hash');
    console.log('2. System retrieves on-chain receipt');
    console.log('3. Input/output hashes are verified');
    console.log('4. Gateway signature is validated');
    console.log('5. HTTP status and execution time confirmed');
    console.log('6. Dispute resolved with cryptographic proof');
    
    console.log('\n💡 Traditional APIs: "He said, she said"');
    console.log('🔒 AgentPayKit: Mathematical proof of execution');
}

// === INTEGRATION EXAMPLES ===
function integrationExamples() {
    console.log('\n🔧 INTEGRATION EXAMPLES');
    console.log('=======================');
    
    console.log(`
// CrewAI with receipt verification
const agent = new Agent({
    tools: [new AgentPayTool('weather-api', '0.01', { 
        verifyReceipts: true,
        requireProof: true 
    })]
});

// FastAPI with automatic receipts
@app.post("/premium")
@require_payment("analysis-api", "0.25", verify_receipt=True)
async def premium_analysis(data: dict):
    return {"analysis": "results...", "receipt_verified": True}

// LangChain with proof generation
const weatherTool = new AgentPayLangChainTool("weather-api", {
    price: "0.01",
    generateProof: true,
    storeReceipts: true
});
`);
}

// Run the demo
if (require.main === module) {
    demonstrateReceiptSystem()
        .then(() => disputeResolutionExample())
        .then(() => integrationExamples())
        .catch(console.error);
}

module.exports = {
    demonstrateReceiptSystem,
    disputeResolutionExample,
    integrationExamples
}; 