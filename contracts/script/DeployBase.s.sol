// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPayyFactory} from "../src/AgentPayyFactory.sol";

/**
 * @title DeployBase
 * @notice Simplified deployment script for Base network only
 * @dev Deploys AgentPayy ecosystem on Base with Gnosis Safe governance
 */
contract DeployBase is Script {
    AgentPayyFactory public factory;
    
    // Base USDC address
    address constant BASE_USDC = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913;
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gnosisSafe = vm.envAddress("GNOSIS_SAFE_ADDRESS");
        
        console.log("=== AgentPayy Base Deployment ===");
        console.log("Network: Base (Chain ID: 8453)");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Gnosis Safe:", gnosisSafe);
        console.log("Treasury: Same as Gnosis Safe");
        console.log("Deployer Balance:", vm.addr(deployerPrivateKey).balance / 1e18, "ETH");
        
        require(gnosisSafe != address(0), "GNOSIS_SAFE_ADDRESS must be set");
        require(vm.addr(deployerPrivateKey).balance > 0.01 ether, "Need at least 0.01 ETH for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy factory
        console.log("\n=== Deploying Factory ===");
        factory = new AgentPayyFactory();
        console.log("✅ Factory deployed:", address(factory));
        
        // Prepare simple deployment config
        AgentPayyFactory.DeploymentConfig memory config = AgentPayyFactory.DeploymentConfig({
            treasury: gnosisSafe,        // Treasury = Gnosis Safe
            gnosisSafe: gnosisSafe,      // Same address
            timelockDelay: 24 hours,     // 24h delay for Base
            salt: "agentpayy-base-v1"    // Simple salt
        });
        
        console.log("\n=== Deployment Configuration ===");
        console.log("Treasury & Gnosis Safe:", config.gnosisSafe);
        console.log("Timelock Delay:", config.timelockDelay / 3600, "hours");
        
        // Deploy ecosystem
        console.log("\n=== Deploying AgentPayy Ecosystem ===");
        AgentPayyFactory.DeployedContracts memory deployed = factory.deployEcosystem(config);
        
        vm.stopBroadcast();
        
        console.log("\n🎉 === DEPLOYMENT SUCCESSFUL ===");
        console.log("Factory:              ", address(factory));
        console.log("AgentPayyCore:        ", deployed.agentPayyCore);
        console.log("AttributionEngine:    ", deployed.attributionEngine);
        console.log("ReceiptManager:       ", deployed.receiptManager);
        console.log("APIRegistry:          ", deployed.apiRegistry);
        console.log("GovernanceTimelock:   ", deployed.governanceTimelock);
        console.log("Treasury/Gnosis Safe: ", gnosisSafe);
        
        // Generate .env updates
        console.log("\n=== Add to your .env file ===");
        console.log("AGENTPAYY_BASE_FACTORY=", vm.toString(address(factory)));
        console.log("AGENTPAYY_BASE_CORE=", vm.toString(deployed.agentPayyCore));
        console.log("AGENTPAYY_BASE_ATTRIBUTION=", vm.toString(deployed.attributionEngine));
        console.log("AGENTPAYY_BASE_RECEIPTS=", vm.toString(deployed.receiptManager));
        console.log("AGENTPAYY_BASE_REGISTRY=", vm.toString(deployed.apiRegistry));
        console.log("AGENTPAYY_BASE_TIMELOCK=", vm.toString(deployed.governanceTimelock));
        
        // Generate SDK config
        console.log("\n=== SDK Configuration ===");
        console.log("Add this to your SDK contracts file:");
        console.log("{");
        console.log('  "base": {');
        console.log('    "agentPayyCore": "', vm.toString(deployed.agentPayyCore), '",');
        console.log('    "attributionEngine": "', vm.toString(deployed.attributionEngine), '",');
        console.log('    "receiptManager": "', vm.toString(deployed.receiptManager), '",');
        console.log('    "apiRegistry": "', vm.toString(deployed.apiRegistry), '"');
        console.log("  }");
        console.log("}");
        
        // Next steps
        console.log("\n=== Next Steps ===");
        console.log("1. ✅ Contracts deployed successfully");
        console.log("2. 🔍 Verify contracts (see commands below)");
        console.log("3. 📝 Update SDK with contract addresses above");
        console.log("4. 🧪 Test with small transactions");
        console.log("5. 📦 Publish updated SDKs to npm/PyPI");
        console.log("6. 🏛️  Use Gnosis Safe for governance changes");
        
        console.log("\n=== Verification Commands ===");
        console.log("Run these to verify your contracts:");
        console.log("forge verify-contract", vm.toString(address(factory)), "src/AgentPayyFactory.sol:AgentPayyFactory --chain-id 8453");
        console.log("forge verify-contract", vm.toString(deployed.agentPayyCore), "src/AgentPayyCore.sol:AgentPayyCore --chain-id 8453");
        console.log("forge verify-contract", vm.toString(deployed.attributionEngine), "src/AttributionEngine.sol:AttributionEngine --chain-id 8453");
        console.log("forge verify-contract", vm.toString(deployed.receiptManager), "src/ReceiptManager.sol:ReceiptManager --chain-id 8453");
        console.log("forge verify-contract", vm.toString(deployed.apiRegistry), "src/APIRegistry.sol:APIRegistry --chain-id 8453");
        
        console.log("\n=== Governance Info ===");
        console.log("Your Gnosis Safe controls all contracts through the timelock.");
        console.log("To make changes:");
        console.log("- Go to app.safe.global");
        console.log("- Create transaction to timelock contract");
        console.log("- Use scheduleRoutine() for 24h delayed changes");
        console.log("- Execute after delay period");
        
        console.log("\n=== Base Network Benefits ===");
        console.log("- Low gas costs (~$0.001 per transaction)");
        console.log("- Fast finality (~2 seconds)");
        console.log("- USDC available:", BASE_USDC);
        console.log("- Great for consumer applications");
        console.log("- Coinbase ecosystem support");
        
        console.log("\n🚀 AgentPayy is live on Base! 🚀");
    }
} 