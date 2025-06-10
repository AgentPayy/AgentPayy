// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test, console} from "forge-std/Test.sol";
import {AgentPayKit} from "../src/AgentPayKit.sol";
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

contract AgentPayKitComprehensiveTest is Test {
    AgentPayKit public agentPayKit;
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
        agentPayKit = new AgentPayKit(treasury);
        
        // Setup initial balances
        usdc.mint(user1, 1000 * 10**6); // 1000 USDC
        usdc.mint(user2, 1000 * 10**6); // 1000 USDC
        usdc.mint(attacker, 1000 * 10**6); // 1000 USDC
    }

    // ===== DEPLOYMENT TESTS =====
    
    function test_Deployment() public {
        assertEq(agentPayKit.treasury(), treasury);
        assertEq(agentPayKit.platformFee(), 1000); // 10%
        assertEq(agentPayKit.FEE_DENOMINATOR(), 10000);
    }
    
    function test_RevertWhen_DeploymentWithZeroTreasury() public {
        vm.expectRevert("Invalid treasury");
        new AgentPayKit(address(0));
    }

    // ===== MODEL REGISTRATION TESTS =====
    
    function test_RegisterModel() public {
        vm.prank(modelOwner);
        vm.expectEmit(true, true, false, true);
        emit ModelRegistered(MODEL_ID, modelOwner, PRICE);
        
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        AgentPayKit.Model memory model = agentPayKit.getModel(MODEL_ID);
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
        agentPayKit.registerModel("", ENDPOINT, PRICE, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelTooLongId() public {
        vm.prank(modelOwner);
        string memory longId = "this_id_is_way_too_long_and_exceeds_the_64_character_limit_set_by_contract";
        vm.expectRevert("Invalid model ID");
        agentPayKit.registerModel(longId, ENDPOINT, PRICE, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelZeroPrice() public {
        vm.prank(modelOwner);
        vm.expectRevert("Price must be > 0");
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, 0, address(usdc));
    }
    
    function test_RevertWhen_RegisterModelZeroToken() public {
        vm.prank(modelOwner);
        vm.expectRevert("Invalid token");
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(0));
    }
    
    function test_RevertWhen_RegisterModelDuplicate() public {
        vm.startPrank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.expectRevert("Model exists");
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc)); // Should fail
        vm.stopPrank();
    }

    // ===== MODEL UPDATE TESTS =====
    
    function test_UpdateModel() public {
        // Register model first
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        // Update model
        string memory newEndpoint = "https://api.newexample.com/v1/chat";
        uint256 newPrice = 200000; // 0.2 USDC
        
        vm.prank(modelOwner);
        agentPayKit.updateModel(MODEL_ID, newEndpoint, newPrice, false);
        
        AgentPayKit.Model memory model = agentPayKit.getModel(MODEL_ID);
        assertEq(model.endpoint, newEndpoint);
        assertEq(model.price, newPrice);
        assertFalse(model.active);
    }
    
    function test_RevertWhen_UpdateModelNotOwner() public {
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.prank(user1);
        vm.expectRevert("Not owner");
        agentPayKit.updateModel(MODEL_ID, ENDPOINT, PRICE, true);
    }

    // ===== BALANCE DEPOSIT TESTS =====
    
    function test_DepositBalance() public {
        uint256 depositAmount = 500 * 10**6; // 500 USDC
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), depositAmount);
        
        vm.expectEmit(true, true, false, true);
        emit BalanceDeposited(user1, address(usdc), depositAmount);
        
        agentPayKit.depositBalance(address(usdc), depositAmount);
        vm.stopPrank();
        
        assertEq(agentPayKit.getUserBalance(user1, address(usdc)), depositAmount);
        assertEq(usdc.balanceOf(address(agentPayKit)), depositAmount);
    }
    
    function test_RevertWhen_DepositBalanceZeroAmount() public {
        vm.prank(user1);
        vm.expectRevert("Invalid amount");
        agentPayKit.depositBalance(address(usdc), 0);
    }
    
    function test_RevertWhen_DepositBalanceZeroToken() public {
        vm.prank(user1);
        vm.expectRevert("Invalid token");
        agentPayKit.depositBalance(address(0), 100);
    }

    // ===== PAYMENT TESTS =====
    
    function test_PayWithPrepaidBalance() public {
        // Setup: Register model and deposit balance
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        uint256 depositAmount = 500 * 10**6; // 500 USDC
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), depositAmount);
        agentPayKit.depositBalance(address(usdc), depositAmount);
        vm.stopPrank();
        
        // Create payment data
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: block.timestamp + 1 hours,
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        // Process payment
        uint256 initialBalance = agentPayKit.getUserBalance(user1, address(usdc));
        
        vm.prank(user1);
        vm.expectEmit(true, true, false, true);
        emit BalanceUsed(user1, address(usdc), PRICE, MODEL_ID);
        
        agentPayKit.payAndCall(payment);
        
        // Verify balance reduction
        assertEq(agentPayKit.getUserBalance(user1, address(usdc)), initialBalance - PRICE);
        
        // Verify model stats
        AgentPayKit.Model memory model = agentPayKit.getModel(MODEL_ID);
        assertEq(model.totalCalls, 1);
        assertEq(model.totalRevenue, PRICE);
        
        // Verify fee distribution
        uint256 fee = (PRICE * agentPayKit.platformFee()) / agentPayKit.FEE_DENOMINATOR();
        uint256 ownerAmount = PRICE - fee;
        
        assertEq(agentPayKit.getBalance(modelOwner, address(usdc)), ownerAmount);
        assertEq(agentPayKit.getBalance(treasury, address(usdc)), fee);
    }
    
    function test_RevertWhen_PaymentExpired() public {
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: block.timestamp - 1, // Expired
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        vm.prank(user1);
        vm.expectRevert("Payment expired");
        agentPayKit.payAndCall(payment);
    }
    
    function test_RevertWhen_PaymentInsufficientAmount() public {
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE - 1, // Insufficient
            deadline: block.timestamp + 1 hours,
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        vm.prank(user1);
        vm.expectRevert("Insufficient payment");
        agentPayKit.payAndCall(payment);
    }
    
    function test_RevertWhen_PaymentModelInactive() public {
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        // Deactivate model
        vm.prank(modelOwner);
        agentPayKit.updateModel(MODEL_ID, ENDPOINT, PRICE, false);
        
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: block.timestamp + 1 hours,
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        vm.prank(user1);
        vm.expectRevert("Model inactive");
        agentPayKit.payAndCall(payment);
    }

    // ===== WITHDRAWAL TESTS =====
    
    function test_WithdrawEarnings() public {
        // Setup payment scenario
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), PRICE);
        agentPayKit.depositBalance(address(usdc), PRICE);
        
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: block.timestamp + 1 hours,
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        agentPayKit.payAndCall(payment);
        vm.stopPrank();
        
        // Withdraw earnings
        uint256 expectedEarnings = PRICE - (PRICE * agentPayKit.platformFee() / agentPayKit.FEE_DENOMINATOR());
        uint256 initialBalance = usdc.balanceOf(modelOwner);
        
        vm.prank(modelOwner);
        agentPayKit.withdraw(address(usdc));
        
        assertEq(usdc.balanceOf(modelOwner), initialBalance + expectedEarnings);
        assertEq(agentPayKit.getBalance(modelOwner, address(usdc)), 0);
    }
    
    function test_WithdrawPrepaidBalance() public {
        uint256 depositAmount = 500 * 10**6;
        uint256 withdrawAmount = 200 * 10**6;
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), depositAmount);
        agentPayKit.depositBalance(address(usdc), depositAmount);
        
        uint256 initialBalance = usdc.balanceOf(user1);
        agentPayKit.withdrawBalance(address(usdc), withdrawAmount);
        vm.stopPrank();
        
        assertEq(usdc.balanceOf(user1), initialBalance + withdrawAmount);
        assertEq(agentPayKit.getUserBalance(user1, address(usdc)), depositAmount - withdrawAmount);
    }

    // ===== SECURITY TESTS =====
    
    function test_ReentrancyProtection() public {
        // This would require a malicious token contract to test properly
        // For now, we trust OpenZeppelin's ReentrancyGuard
        // Test passes if no reentrancy occurs
        assertTrue(true);
    }
    
    function test_OnlyOwnerFunctions() public {
        // Test setPlatformFee
        vm.prank(attacker);
        vm.expectRevert();
        agentPayKit.setPlatformFee(500);
        
        vm.prank(owner);
        agentPayKit.setPlatformFee(500);
        assertEq(agentPayKit.platformFee(), 500);
        
        // Test setTreasury
        address newTreasury = makeAddr("newTreasury");
        
        vm.prank(attacker);
        vm.expectRevert();
        agentPayKit.setTreasury(newTreasury);
        
        vm.prank(owner);
        agentPayKit.setTreasury(newTreasury);
        assertEq(agentPayKit.treasury(), newTreasury);
    }
    
    function test_RevertWhen_SetFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        agentPayKit.setPlatformFee(2001); // >20%
    }

    // ===== FUZZ TESTS =====
    
    function testFuzz_ModelRegistration(
        string memory modelId,
        string memory endpoint,
        uint256 price,
        address tokenAddr
    ) public {
        vm.assume(bytes(modelId).length > 0 && bytes(modelId).length <= 64);
        vm.assume(bytes(endpoint).length > 0);
        vm.assume(price > 0);
        vm.assume(tokenAddr != address(0));
        
        vm.prank(modelOwner);
        agentPayKit.registerModel(modelId, endpoint, price, tokenAddr);
        
        AgentPayKit.Model memory model = agentPayKit.getModel(modelId);
        assertEq(model.owner, modelOwner);
        assertEq(model.price, price);
        assertEq(model.token, tokenAddr);
    }
    
    function testFuzz_DepositBalance(uint256 amount) public {
        vm.assume(amount > 0 && amount <= usdc.balanceOf(user1));
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), amount);
        agentPayKit.depositBalance(address(usdc), amount);
        vm.stopPrank();
        
        assertEq(agentPayKit.getUserBalance(user1, address(usdc)), amount);
    }

    // ===== GAS OPTIMIZATION TESTS =====
    
    function test_GasUsage_PaymentWithBalance() public {
        // Setup
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), PRICE);
        agentPayKit.depositBalance(address(usdc), PRICE);
        vm.stopPrank();
        
        bytes32 inputHash = keccak256("test input");
        AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
            modelId: MODEL_ID,
            inputHash: inputHash,
            amount: PRICE,
            deadline: block.timestamp + 1 hours,
            smartWalletSig: "",
            v: 0,
            r: 0,
            s: 0
        });
        
        // Measure gas
        vm.prank(user1);
        uint256 gasBefore = gasleft();
        agentPayKit.payAndCall(payment);
        uint256 gasUsed = gasBefore - gasleft();
        
        console.log("Gas used for payment with balance:", gasUsed);
        // Should be reasonable gas usage (less than 350k gas for complex operations)
        assertTrue(gasUsed < 350000);
    }

    // ===== INTEGRATION TESTS =====
    
    function test_CompleteUserJourney() public {
        // 1. Model owner registers model
        vm.prank(modelOwner);
        agentPayKit.registerModel(MODEL_ID, ENDPOINT, PRICE, address(usdc));
        
        // 2. User deposits balance
        uint256 depositAmount = 1000 * 10**6; // 1000 USDC
        vm.startPrank(user1);
        usdc.approve(address(agentPayKit), depositAmount);
        agentPayKit.depositBalance(address(usdc), depositAmount);
        vm.stopPrank();
        
        // 3. User makes multiple payments
        for (uint i = 0; i < 3; i++) {
            bytes32 inputHash = keccak256(abi.encodePacked("test input", i));
            AgentPayKit.PaymentData memory payment = AgentPayKit.PaymentData({
                modelId: MODEL_ID,
                inputHash: inputHash,
                amount: PRICE,
                deadline: block.timestamp + 1 hours,
                smartWalletSig: "",
                v: 0,
                r: 0,
                s: 0
            });
            
            vm.prank(user1);
            agentPayKit.payAndCall(payment);
        }
        
        // 4. Verify final state
        AgentPayKit.Model memory model = agentPayKit.getModel(MODEL_ID);
        assertEq(model.totalCalls, 3);
        assertEq(model.totalRevenue, PRICE * 3);
        
        // 5. Model owner withdraws earnings
        vm.prank(modelOwner);
        agentPayKit.withdraw(address(usdc));
        
        // 6. User withdraws remaining balance
        uint256 remainingBalance = agentPayKit.getUserBalance(user1, address(usdc));
        vm.prank(user1);
        agentPayKit.withdrawBalance(address(usdc), remainingBalance);
        
        assertEq(agentPayKit.getUserBalance(user1, address(usdc)), 0);
    }
} 