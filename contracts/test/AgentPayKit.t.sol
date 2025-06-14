// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentPayCore} from "../src/AgentPayCore.sol";
import {AttributionEngine} from "../src/AttributionEngine.sol";
import {ReceiptManager} from "../src/ReceiptManager.sol";
import {IAgentPayCore} from "../src/IAgentPayCore.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AgentPayCoreTest is Test {
    AgentPayCore public agentPayCore;
    AttributionEngine public attributionEngine;
    ReceiptManager public receiptManager;
    
    address public treasury;
    address public user;
    address public modelOwner;
    address public mockToken;
    
    function setUp() public {
        treasury = makeAddr("treasury");
        user = makeAddr("user");
        modelOwner = makeAddr("modelOwner");
        mockToken = makeAddr("mockToken");
        
        // Deploy core contracts
        agentPayCore = new AgentPayCore(treasury);
        attributionEngine = new AttributionEngine(address(agentPayCore), treasury);
        receiptManager = new ReceiptManager(address(this));
        
        // Link contracts
        agentPayCore.setAttributionEngine(address(attributionEngine));
        agentPayCore.setReceiptManager(address(receiptManager));
        
        console.log("=== AgentPay Modular Deployment ===");
        console.log("AgentPayCore:", address(agentPayCore));
        console.log("AttributionEngine:", address(attributionEngine));
        console.log("ReceiptManager:", address(receiptManager));
        console.log("Treasury:", treasury);
    }
    
    function test_Deployment() public {
        // Check that contracts deployed correctly
        assertEq(agentPayCore.treasury(), treasury);
        assertEq(agentPayCore.attributionEngine(), address(attributionEngine));
        assertEq(agentPayCore.receiptManager(), address(receiptManager));
        
        console.log("[OK] All contracts deployed and linked successfully");
    }
    
    function test_TreasuryAddress() public {
        assertEq(agentPayCore.treasury(), treasury);
    }
    
    function test_ModelRegistration() public {
        vm.startPrank(modelOwner);
        
        string memory modelId = "test-model-1";
        string memory endpoint = "https://api.example.com/model";
        uint256 price = 1000000; // 1 USDC (6 decimals)
        
        agentPayCore.registerModel(modelId, endpoint, price, mockToken);
        
        // Verify model was registered
        IAgentPayCore.Model memory model = agentPayCore.getModel(modelId);
        
        assertEq(model.owner, modelOwner);
        assertEq(model.endpoint, endpoint);
        assertEq(model.price, price);
        assertEq(model.token, mockToken);
        assertTrue(model.active);
        assertEq(model.totalCalls, 0);
        assertEq(model.totalRevenue, 0);
        
        vm.stopPrank();
        
        console.log("[OK] Model registration test passed");
    }
    
    function testFuzz_TreasuryAddress(address _treasury) public {
        vm.assume(_treasury != address(0));
        
        AgentPayCore testContract = new AgentPayCore(_treasury);
        assertEq(testContract.treasury(), _treasury);
    }
    
    function test_PlatformFeeConfiguration() public {
        // Test initial platform fee
        assertEq(agentPayCore.platformFee(), 1000); // 10%
        
        // Test setting new platform fee
        uint256 newFee = 500; // 5%
        agentPayCore.setPlatformFee(newFee);
        assertEq(agentPayCore.platformFee(), newFee);
        
        // Test fee limit
        vm.expectRevert("Fee too high");
        agentPayCore.setPlatformFee(2001); // > 20%
        
        console.log("[OK] Platform fee configuration test passed");
    }
} 