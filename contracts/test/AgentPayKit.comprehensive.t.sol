// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentPayyCore} from "../src/AgentPayyCore.sol";
import {AttributionEngine} from "../src/AttributionEngine.sol";
import {ReceiptManager} from "../src/ReceiptManager.sol";
import {IAgentPayyCore} from "../src/IAgentPayyCore.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockUSDC is ERC20 {
    constructor() ERC20("Mock USDC", "mUSDC") {
        _mint(msg.sender, 1000000 * 10**6); // 1M USDC
    }
    
    function decimals() public pure override returns (uint8) {
        return 6;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract AgentPayyCoreComprehensiveTest is Test {
    AgentPayyCore public agentPayCore;
    AttributionEngine public attributionEngine;
    ReceiptManager public receiptManager;
    MockUSDC public usdc;
    
    address public owner;
    address public treasury;
    address public modelOwner;
    address public user1;
    address public user2;
    address public attacker;
    
    string constant MODEL_ID = "gpt-4o";
    string constant ENDPOINT = "https://api.example.com/v1/chat";
    uint256 constant PRICE = 100000; // 0.1 USDC
    
    event ModelRegistered(string indexed modelId, address indexed owner, uint256 price);
    event PaymentProcessed(
        string indexed modelId,
        address indexed payer,
        uint256 amount,
        bytes32 inputHash,
        uint256 timestamp
    );
    event BalanceDeposited(address indexed user, address indexed token, uint256 amount);
    event BalanceUsed(address indexed user, address indexed token, uint256 amount, string modelId);
    
    function setUp() public {
        owner = address(this);
        treasury = makeAddr("treasury");
        modelOwner = makeAddr("modelOwner");
        user1 = makeAddr("user1");
        user2 = makeAddr("user2");
        attacker = makeAddr("attacker");
        
        // Deploy contracts
        usdc = new MockUSDC();
        agentPayCore = new AgentPayyCore(treasury);
        attributionEngine = new AttributionEngine(address(agentPayCore), treasury);
        receiptManager = new ReceiptManager(address(this));
        
        // Link contracts
        agentPayCore.setAttributionEngine(address(attributionEngine));
        agentPayCore.setReceiptManager(address(receiptManager));
        
        // Setup initial balances
        usdc.mint(user1, 1000 * 10**6); // 1000 USDC
        usdc.mint(user2, 1000 * 10**6); // 1000 USDC
        usdc.mint(attacker, 1000 * 10**6); // 1000 USDC
        
        console.log("=== Test Setup Complete ===");
        console.log("AgentPayyCore:", address(agentPayCore));
        console.log("AttributionEngine:", address(attributionEngine));
        console.log("ReceiptManager:", address(receiptManager));
    }

    // ===== DEPLOYMENT TESTS =====
    
    function test_Deployment() public {
        assertEq(agentPayCore.treasury(), treasury);
        assertEq(agentPayCore.platformFee(), 1000); // 10%
        assertEq(agentPayCore.FEE_DENOMINATOR(), 10000);
        assertEq(agentPayCore.attributionEngine(), address(attributionEngine));
        assertEq(agentPayCore.receiptManager(), address(receiptManager));
    }
    
    function test_RevertWhen_DeploymentWithZeroTreasury() public {
        vm.expectRevert("Invalid treasury");
        new AgentPayyCore(address(0));
    }

    // ===== MODEL REGISTRATION TESTS =====
    
    function test_RegisterModel() public {
        vm.prank(modelOwner);
        vm.expectEmit(true, true, false, true);
        emit ModelRegistered(MODEL_ID, modelOwner, PRICE);
        
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        IAgentPayyCore.Model memory model = agentPayCore.getModel(MODEL_ID);
        assertEq(model.owner, modelOwner);
        assertEq(model.endpoint, ENDPOINT);
        assertEq(model.price, PRICE);
        assertEq(model.token, address(usdc));
        assertTrue(model.active);
        assertEq(model.totalCalls, 0);
        assertEq(model.totalRevenue, 0);
    }
    
    function test_RevertWhen_RegisterModelEmptyId() public {
        vm.prank(modelOwner);
        vm.expectRevert("Invalid model ID");
        agentPayCore.registerModel("", ENDPOINT, PRICE, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelTooLongId() public {
        vm.prank(modelOwner);
        string memory longId = "this_id_is_way_too_long_and_exceeds_the_64_character_limit_set_by_contract";
        vm.expectRevert("Invalid model ID");
        agentPayCore.registerModel(longId, ENDPOINT, PRICE, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelZeroPrice() public {
        vm.prank(modelOwner);
        vm.expectRevert("Price must be > 0");
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, 0, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelZeroToken() public {
        vm.prank(modelOwner);
        vm.expectRevert("Invalid token");
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(0));
    }
    
    function test_RevertWhen_RegisterModelDuplicate() public {
        vm.startPrank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.expectRevert("Model exists");
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc)); // Should fail
        vm.stopPrank();
    }

    // ===== MODEL UPDATE TESTS =====
    
    function test_UpdateModel() public {
        // Register model first
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        // Update model
        string memory newEndpoint = "https://api.newexample.com/v1/chat";
        uint256 newPrice = 200000; // 0.2 USDC
        
        vm.prank(modelOwner);
        agentPayCore.updateModel(MODEL_ID, newEndpoint, newPrice, false);
        
        IAgentPayyCore.Model memory model = agentPayCore.getModel(MODEL_ID);
        assertEq(model.endpoint, newEndpoint);
        assertEq(model.price, newPrice);
        assertFalse(model.active);
    }
    
    function test_RevertWhen_UpdateModelNotOwner() public {
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.prank(user1);
        vm.expectRevert("Not owner");
        agentPayCore.updateModel(MODEL_ID, ENDPOINT, PRICE, true);
    }

    // ===== BALANCE DEPOSIT TESTS =====
    
    function test_DepositBalance() public {
        uint256 depositAmount = 500 * 10**6; // 500 USDC
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), depositAmount);
        
        vm.expectEmit(true, true, false, true);
        emit BalanceDeposited(user1, address(usdc), depositAmount);
        
        agentPayCore.depositBalance(address(usdc), depositAmount);
        vm.stopPrank();
        
        assertEq(agentPayCore.getUserBalance(user1, address(usdc)), depositAmount);
        assertEq(usdc.balanceOf(address(agentPayCore)), depositAmount);
    }
    
    function test_RevertWhen_DepositBalanceZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Invalid amount");
        agentPayCore.depositBalance(address(usdc), 0);
    }
    
    function test_RevertWhen_DepositBalanceZeroToken() public {
        vm.prank(user1);
        vm.expectRevert("Invalid token");
        agentPayCore.depositBalance(address(0), 100);
    }

    // ===== PAYMENT TESTS =====
    
    function test_PayWithPrepaidBalance() public {
        // Setup: Register model and deposit balance
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        uint256 depositAmount = 500 * 10**6; // 500 USDC
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), depositAmount);
        agentPayCore.depositBalance(address(usdc), depositAmount);
        vm.stopPrank();
        
        // Create payment data
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        // Execute payment
        vm.prank(user1);
        agentPayCore.payAndCall(payment);
        
        // Verify balances
        assertEq(agentPayCore.getUserBalance(user1, address(usdc)), depositAmount - PRICE);
        
        // Verify model stats
        IAgentPayyCore.Model memory model = agentPayCore.getModel(MODEL_ID);
        assertEq(model.totalCalls, 1);
        assertEq(model.totalRevenue, PRICE);
        
        // Verify earnings distribution
        uint256 expectedFee = (PRICE * agentPayCore.platformFee()) / agentPayCore.FEE_DENOMINATOR();
        uint256 expectedOwnerAmount = PRICE - expectedFee;
        
        assertEq(agentPayCore.getBalance(modelOwner, address(usdc)), expectedOwnerAmount);
        assertEq(agentPayCore.getBalance(treasury, address(usdc)), expectedFee);
    }
    
    function test_RevertWhen_PaymentModelNotFound() public {
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: "nonexistent-model",
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        vm.prank(user1);
        vm.expectRevert("Model not found");
        agentPayCore.payAndCall(payment);
    }
    
    function test_RevertWhen_PaymentModelInactive() public {
        // Register and deactivate model
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.prank(modelOwner);
        agentPayCore.updateModel(MODEL_ID, ENDPOINT, PRICE, false); // Deactivate
        
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        vm.prank(user1);
        vm.expectRevert("Model inactive");
        agentPayCore.payAndCall(payment);
    }
    
    function test_RevertWhen_PaymentExpired() public {
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp - 1; // Expired
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        vm.prank(user1);
        vm.expectRevert("Payment expired");
        agentPayCore.payAndCall(payment);
    }

    // ===== WITHDRAWAL TESTS =====
    
    function test_WithdrawEarnings() public {
        // Setup payment to generate earnings
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), PRICE);
        agentPayCore.depositBalance(address(usdc), PRICE);
        
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        agentPayCore.payAndCall(payment);
        vm.stopPrank();
        
        // Withdraw earnings
        uint256 expectedEarnings = PRICE - (PRICE * agentPayCore.platformFee()) / agentPayCore.FEE_DENOMINATOR();
        uint256 initialBalance = usdc.balanceOf(modelOwner);
        
        vm.prank(modelOwner);
        agentPayCore.withdraw(address(usdc));
        
        assertEq(usdc.balanceOf(modelOwner), initialBalance + expectedEarnings);
        assertEq(agentPayCore.getBalance(modelOwner, address(usdc)), 0);
    }
    
    function test_WithdrawPrepaidBalance() public {
        uint256 depositAmount = 500 * 10**6;
        uint256 withdrawAmount = 200 * 10**6;
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), depositAmount);
        agentPayCore.depositBalance(address(usdc), depositAmount);
        
        uint256 initialBalance = usdc.balanceOf(user1);
        agentPayCore.withdrawBalance(address(usdc), withdrawAmount);
        
        assertEq(usdc.balanceOf(user1), initialBalance + withdrawAmount);
        assertEq(agentPayCore.getUserBalance(user1, address(usdc)), depositAmount - withdrawAmount);
        vm.stopPrank();
    }

    // ===== ADMIN TESTS =====
    
    function test_SetPlatformFee() public {
        uint256 newFee = 500; // 5%
        agentPayCore.setPlatformFee(newFee);
        assertEq(agentPayCore.platformFee(), newFee);
    }
    
    function test_RevertWhen_SetPlatformFeeTooHigh() public {
        vm.expectRevert("Fee too high");
        agentPayCore.setPlatformFee(2001); // > 20%
    }
    
    function test_SetTreasury() public {
        address newTreasury = makeAddr("newTreasury");
        agentPayCore.setTreasury(newTreasury);
        assertEq(agentPayCore.treasury(), newTreasury);
    }
    
    function test_RevertWhen_SetTreasuryZeroAddress() public {
        vm.expectRevert("Invalid treasury");
        agentPayCore.setTreasury(address(0));
    }
    
    function test_PauseUnpauseModel() public {
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        // Pause model
        agentPayCore.pauseModel(MODEL_ID);
        IAgentPayyCore.Model memory model = agentPayCore.getModel(MODEL_ID);
        assertFalse(model.active);
        
        // Unpause model
        agentPayCore.unpauseModel(MODEL_ID);
        model = agentPayCore.getModel(MODEL_ID);
        assertTrue(model.active);
    }

    // ===== SECURITY TESTS =====
    
    function test_RevertWhen_ReplayAttack() public {
        // Setup
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), PRICE * 2);
        agentPayCore.depositBalance(address(usdc), PRICE * 2);
        
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        // First payment should succeed
        agentPayCore.payAndCall(payment);
        
        // Second payment with same data should fail
        vm.expectRevert("Payment processed");
        agentPayCore.payAndCall(payment);
        vm.stopPrank();
    }
    
    function test_RevertWhen_InsufficientPayment() public {
        vm.prank(modelOwner);
        agentPayCore.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        bytes32 inputHash = keccak256("test input");
        uint256 deadline = block.timestamp + 3600;
        
        IAgentPayyCore.PaymentData memory payment = IAgentPayyCore.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE - 1, // Insufficient
            deadline: deadline,
            v: 0,
            r: bytes32(0),
            s: bytes32(0),
            smartWalletSig: ""
        });
        
        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        agentPayCore.payAndCall(payment);
    }

    // ===== INTEGRATION TESTS =====
    
    function test_MultipleUsersMultipleModels() public {
        // Register multiple models
        vm.startPrank(modelOwner);
        agentPayCore.registerModel("model1", "https://api1.com", PRICE, address(usdc));
        agentPayCore.registerModel("model2", "https://api2.com", PRICE * 2, address(usdc));
        vm.stopPrank();
        
        // Setup user balances
        vm.startPrank(user1);
        usdc.approve(address(agentPayCore), 1000 * 10**6);
        agentPayCore.depositBalance(address(usdc), 1000 * 10**6);
        vm.stopPrank();
        
        vm.startPrank(user2);
        usdc.approve(address(agentPayCore), 1000 * 10**6);
        agentPayCore.depositBalance(address(usdc), 1000 * 10**6);
        vm.stopPrank();
        
        // Execute payments
        bytes32 inputHash1 = keccak256("input1");
        bytes32 inputHash2 = keccak256("input2");
        uint256 deadline = block.timestamp + 3600;
        
        // User1 pays for model1
        vm.prank(user1);
        agentPayCore.payAndCall(IAgentPayyCore.PaymentData({
            modelId: "model1",
            inputHash: inputHash1,
            amount: PRICE,
            deadline: deadline,
            v: 0, r: bytes32(0), s: bytes32(0),
            smartWalletSig: ""
        }));
        
        // User2 pays for model2
        vm.prank(user2);
        agentPayCore.payAndCall(IAgentPayyCore.PaymentData({
            modelId: "model2",
            inputHash: inputHash2,
            amount: PRICE * 2,
            deadline: deadline,
            v: 0, r: bytes32(0), s: bytes32(0),
            smartWalletSig: ""
        }));
        
        // Verify model stats
        IAgentPayyCore.Model memory model1 = agentPayCore.getModel("model1");
        IAgentPayyCore.Model memory model2 = agentPayCore.getModel("model2");
        
        assertEq(model1.totalCalls, 1);
        assertEq(model1.totalRevenue, PRICE);
        assertEq(model2.totalCalls, 1);
        assertEq(model2.totalRevenue, PRICE * 2);
        
        console.log("[OK] Multi-user, multi-model integration test passed");
    }
} 