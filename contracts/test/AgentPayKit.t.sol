// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentPayKit} from "../src/AgentPayKit.sol";

contract AgentPayKitTest is Test {
    AgentPayKit public agentPayKit;
    address public treasury;
    address public user;
    
    function setUp() public {
        treasury = makeAddr("treasury");
        user = makeAddr("user");
        
        // Deploy AgentPayKit
        agentPayKit = new AgentPayKit(treasury);
    }
    
    function test_Deployment() public {
        // Check that contract deployed correctly
        assertEq(agentPayKit.treasury(), treasury);
        console.log("AgentPayKit deployed successfully");
        console.log("Treasury address:", treasury);
        console.log("Contract address:", address(agentPayKit));
    }
    
    function test_TreasuryAddress() public {
        assertEq(agentPayKit.treasury(), treasury);
    }
    
    function testFuzz_TreasuryAddress(address _treasury) public {
        vm.assume(_treasury != address(0));
        
        AgentPayKit testContract = new AgentPayKit(_treasury);
        assertEq(testContract.treasury(), _treasury);
    }
} 