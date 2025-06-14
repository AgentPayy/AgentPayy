// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPayyCore} from "../src/AgentPayyCore.sol";
import {AttributionEngine} from "../src/AttributionEngine.sol";
import {ReceiptManager} from "../src/ReceiptManager.sol";
import {APIRegistry} from "../src/APIRegistry.sol";
import {GovernanceTimelock} from "../src/GovernanceTimelock.sol";

/**
 * @title DeploySimple
 * @notice Simple deployment script for Base network - no Factory
 * @dev Deploys core AgentPayy contracts directly
 */
contract DeploySimple is Script {
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address gnosisSafe = vm.envAddress("GNOSIS_SAFE_ADDRESS");
        
        console.log("=== AgentPayy Simple Deployment ===");
        console.log("Network: Base (Chain ID: 8453)");
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Gnosis Safe:", gnosisSafe);
        console.log("Treasury: Same as Gnosis Safe");
        
        require(gnosisSafe != address(0), "GNOSIS_SAFE_ADDRESS must be set");
        require(vm.addr(deployerPrivateKey).balance > 0.005 ether, "Need at least 0.005 ETH for deployment");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy governance timelock first
        console.log("\n=== Deploying Governance Timelock ===");
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = gnosisSafe;
        executors[0] = gnosisSafe;
        
        GovernanceTimelock timelock = new GovernanceTimelock(
            24 hours,     // 24h delay
            proposers,
            executors,
            gnosisSafe,   // admin
            gnosisSafe    // gnosis safe
        );
        console.log("GovernanceTimelock deployed:", address(timelock));
        
        // 2. Deploy core contracts
        console.log("\n=== Deploying Core Contracts ===");
        
        AgentPayyCore core = new AgentPayyCore(gnosisSafe); // treasury = gnosis safe
        console.log("AgentPayyCore deployed:", address(core));
        
        AttributionEngine attribution = new AttributionEngine(address(core), gnosisSafe);
        console.log("AttributionEngine deployed:", address(attribution));
        
        ReceiptManager receipts = new ReceiptManager(address(timelock));
        console.log("ReceiptManager deployed:", address(receipts));
        
        APIRegistry registry = new APIRegistry();
        console.log("APIRegistry deployed:", address(registry));
        
        // 3. Link contracts
        console.log("\n=== Linking Contracts ===");
        core.setAttributionEngine(address(attribution));
        core.setReceiptManager(address(receipts));
        
        // 4. Transfer ownership to timelock
        console.log("\n=== Setting Up Governance ===");
        core.transferOwnership(address(timelock));
        attribution.transferOwnership(address(timelock));
        registry.transferOwnership(address(timelock));
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("AgentPayyCore:        ", address(core));
        console.log("AttributionEngine:    ", address(attribution));
        console.log("ReceiptManager:       ", address(receipts));
        console.log("APIRegistry:          ", address(registry));
        console.log("GovernanceTimelock:   ", address(timelock));
        console.log("Treasury/Gnosis Safe: ", gnosisSafe);
        
        // Generate .env updates
        console.log("\n=== Add to your .env file ===");
        console.log("AGENTPAYY_BASE_CORE=", vm.toString(address(core)));
        console.log("AGENTPAYY_BASE_ATTRIBUTION=", vm.toString(address(attribution)));
        console.log("AGENTPAYY_BASE_RECEIPTS=", vm.toString(address(receipts)));
        console.log("AGENTPAYY_BASE_REGISTRY=", vm.toString(address(registry)));
        console.log("AGENTPAYY_BASE_TIMELOCK=", vm.toString(address(timelock)));
        
        // Generate SDK config
        console.log("\n=== SDK Configuration ===");
        console.log("Add this to your SDK contracts file:");
        console.log("{");
        console.log('  "base": {');
        console.log('    "agentPayyCore": "', vm.toString(address(core)), '",');
        console.log('    "attributionEngine": "', vm.toString(address(attribution)), '",');
        console.log('    "receiptManager": "', vm.toString(address(receipts)), '",');
        console.log('    "apiRegistry": "', vm.toString(address(registry)), '"');
        console.log("  }");
        console.log("}");
        
        // Verification commands
        console.log("\n=== Verification Commands ===");
        console.log("forge verify-contract", vm.toString(address(core)), "src/AgentPayyCore.sol:AgentPayyCore --chain-id 8453");
        console.log("forge verify-contract", vm.toString(address(attribution)), "src/AttributionEngine.sol:AttributionEngine --chain-id 8453");
        console.log("forge verify-contract", vm.toString(address(receipts)), "src/ReceiptManager.sol:ReceiptManager --chain-id 8453");
        console.log("forge verify-contract", vm.toString(address(registry)), "src/APIRegistry.sol:APIRegistry --chain-id 8453");
        console.log("forge verify-contract", vm.toString(address(timelock)), "src/GovernanceTimelock.sol:GovernanceTimelock --chain-id 8453");
        
        console.log("\nAgentPayy is live on Base!");
    }
} 