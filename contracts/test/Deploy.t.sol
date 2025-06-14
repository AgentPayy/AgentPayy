// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {DeployScript} from "../script/Deploy.s.sol";
import {AgentPayyCore} from "../src/AgentPayyCore.sol";
import {AttributionEngine} from "../src/AttributionEngine.sol";
import {ReceiptManager} from "../src/ReceiptManager.sol";

contract DeployTest is Test {
    DeployScript public deployScript;
    
    function setUp() public {
        deployScript = new DeployScript();
    }
    
    function test_DeploymentScript() public {
        // Set environment variables for the test
        vm.setEnv("TREASURY_ADDRESS", vm.toString(address(this)));
        vm.setEnv("PRIVATE_KEY", "0x0000000000000000000000000000000000000000000000000000000000000001");
        
        // Run the deployment script
        deployScript.run();
        
        // Get deployed contracts
        AgentPayyCore agentPayCore = deployScript.agentPayCore();
        AttributionEngine attributionEngine = deployScript.attributionEngine();
        ReceiptManager receiptManager = deployScript.receiptManager();
        
        // Verify contracts are deployed
        assertTrue(address(agentPayCore) != address(0), "AgentPayyCore not deployed");
        assertTrue(address(attributionEngine) != address(0), "AttributionEngine not deployed");
        assertTrue(address(receiptManager) != address(0), "ReceiptManager not deployed");
        
        // Verify contracts are properly linked
        assertEq(agentPayCore.attributionEngine(), address(attributionEngine), "AttributionEngine not linked");
        assertEq(agentPayCore.receiptManager(), address(receiptManager), "ReceiptManager not linked");
        
        // Verify treasury is set correctly
        assertEq(agentPayCore.treasury(), address(this), "Treasury not set correctly");
        
        console.log("[OK] Deployment script test passed");
        console.log("AgentPayyCore deployed at:", address(agentPayCore));
        console.log("AttributionEngine deployed at:", address(attributionEngine));
        console.log("ReceiptManager deployed at:", address(receiptManager));
    }
    
    function test_NetworkNameFunction() public {
        // Test network name function
        assertEq(deployScript.getNetworkName(1), "ethereum");
        assertEq(deployScript.getNetworkName(8453), "base");
        assertEq(deployScript.getNetworkName(42161), "arbitrum");
        assertEq(deployScript.getNetworkName(10), "optimism");
        assertEq(deployScript.getNetworkName(999999), "unknown_999999");
        
        console.log("[OK] Network name function test passed");
    }
} 