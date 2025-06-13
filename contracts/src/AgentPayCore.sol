// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IAgentPayCore.sol";

/**
 * @title AgentPayCore
 * @author AgentPay Team
 * @notice Core payment processing contract for AgentPay
 * @dev Handles basic API payments, model registration, and balance management
 * @custom:version 2.0.0
 * @custom:security-contact security@agentpay.org
 */
contract AgentPayCore is IAgentPayCore, ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Model storage
    mapping(string => Model) public models;
    
    /// @notice Balance storage
    mapping(address => mapping(address => uint256)) public balances; // user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances; // prepaid balances
    mapping(bytes32 => bool) public processedPayments;
    
    /// @notice Platform configuration
    uint256 public platformFee = 1000; // 10%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public treasury;

    /// @notice External contract references
    address public attributionEngine;
    address public receiptManager;

    /**
     * @notice Initialize the core payment contract
     * @param _treasury Treasury address for platform fees
     */
    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Register a new API model/endpoint
     * @param modelId Unique identifier for the API model
     * @param endpoint API endpoint URL
     * @param price Price per API call in token units
     * @param token Token contract address for payments
     */
    function registerModel(
        string calldata modelId,
        string calldata endpoint,
        uint256 price,
        address token
    ) external override {
        require(bytes(modelId).length > 0 && bytes(modelId).length <= 64, "Invalid model ID");
        require(bytes(endpoint).length > 0, "Invalid endpoint");
        require(price > 0, "Price must be > 0");
        require(token != address(0), "Invalid token");
        require(models[modelId].owner == address(0), "Model exists");

        models[modelId] = Model({
            owner: msg.sender,
            endpoint: endpoint,
            price: price,
            token: token,
            active: true,
            totalCalls: 0,
            totalRevenue: 0
        });

        emit ModelRegistered(modelId, msg.sender, price);
    }

    /**
     * @notice Update an existing API model
     * @param modelId Model identifier to update
     * @param endpoint New endpoint URL
     * @param price New price per API call
     * @param active Whether the model is active
     */
    function updateModel(
        string calldata modelId,
        string calldata endpoint,
        uint256 price,
        bool active
    ) external {
        Model storage model = models[modelId];
        require(model.owner == msg.sender, "Not owner");
        require(bytes(endpoint).length > 0, "Invalid endpoint");
        require(price > 0, "Invalid price");
        
        model.endpoint = endpoint;
        model.price = price;
        model.active = active;
    }

    /**
     * @notice Deposit funds to prepaid balance
     * @param token Token contract address
     * @param amount Amount to deposit
     */
    function depositBalance(address token, uint256 amount) external override nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender][token] += amount;
        
        emit BalanceDeposited(msg.sender, token, amount);
    }

    /**
     * @notice Process payment for API call
     * @param payment Payment data structure
     */
    function payAndCall(PaymentData calldata payment) external override nonReentrant {
        Model storage model = models[payment.modelId];
        require(model.owner != address(0), "Model not found");
        require(model.active, "Model inactive");
        require(payment.amount >= model.price, "Insufficient payment");
        require(block.timestamp <= payment.deadline, "Payment expired");

        bytes32 paymentId = keccak256(abi.encodePacked(
            payment.modelId,
            payment.inputHash,
            msg.sender,
            payment.deadline
        ));
        require(!processedPayments[paymentId], "Payment processed");
        processedPayments[paymentId] = true;

        // Dual payment model: Check balance first, fallback to permit
        uint256 userBalance = userBalances[msg.sender][model.token];
        
        if (userBalance >= payment.amount) {
            // Use prepaid balance
            userBalances[msg.sender][model.token] -= payment.amount;
            _distributeFunds(model, payment.amount);
            
            emit BalanceUsed(msg.sender, model.token, payment.amount, payment.modelId);
        } else {
            // Fallback to permit/smart wallet payment
            if (payment.smartWalletSig.length > 0) {
                _processSmartWalletPayment(model, payment);
            } else {
                _processPermitPayment(model, payment);
            }
        }

        // Update model stats
        model.totalCalls++;
        model.totalRevenue += payment.amount;

        emit PaymentProcessed(
            payment.modelId,
            msg.sender,
            payment.amount,
            payment.inputHash,
            block.timestamp
        );
    }

    /**
     * @notice Process smart wallet signature payment
     * @param model API model being paid for
     * @param payment Payment data
     */
    function _processSmartWalletPayment(
        Model storage model,
        PaymentData calldata payment
    ) internal {
        bytes32 messageHash = keccak256(abi.encodePacked(
            payment.modelId,
            payment.inputHash,
            payment.amount,
            payment.deadline
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(payment.smartWalletSig);
        require(signer == msg.sender, "Invalid signature");

        IERC20(model.token).transferFrom(msg.sender, address(this), payment.amount);
        _distributeFunds(model, payment.amount);
    }

    /**
     * @notice Process EIP-2612 permit payment
     * @param model API model being paid for
     * @param payment Payment data
     */
    function _processPermitPayment(
        Model storage model,
        PaymentData calldata payment
    ) internal {
        IERC20Permit(model.token).permit(
            msg.sender,
            address(this),
            payment.amount,
            payment.deadline,
            payment.v,
            payment.r,
            payment.s
        );

        IERC20(model.token).transferFrom(msg.sender, address(this), payment.amount);
        _distributeFunds(model, payment.amount);
    }

    /**
     * @notice Distribute payment funds between owner and platform
     * @param model API model receiving payment
     * @param amount Total payment amount
     */
    function _distributeFunds(Model storage model, uint256 amount) internal {
        uint256 fee = (amount * platformFee) / FEE_DENOMINATOR;
        uint256 ownerAmount = amount - fee;

        balances[model.owner][model.token] += ownerAmount;
        balances[treasury][model.token] += fee;
    }

    /**
     * @notice Withdraw earnings from API sales
     * @param token Token contract address
     */
    function withdraw(address token) external override nonReentrant {
        uint256 amount = balances[msg.sender][token];
        require(amount > 0, "No balance");
        
        balances[msg.sender][token] = 0;
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit PaymentWithdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Withdraw from prepaid balance
     * @param token Token contract address
     * @param amount Amount to withdraw
     */
    function withdrawBalance(address token, uint256 amount) external override nonReentrant {
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");
        
        userBalances[msg.sender][token] -= amount;
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit PaymentWithdrawn(msg.sender, token, amount);
    }

    // === VIEW FUNCTIONS ===

    /**
     * @notice Get earnings balance for user
     * @param user User address
     * @param token Token contract address
     * @return Balance amount
     */
    function getBalance(address user, address token) external view override returns (uint256) {
        return balances[user][token];
    }

    /**
     * @notice Get prepaid balance for user
     * @param user User address
     * @param token Token contract address
     * @return Balance amount
     */
    function getUserBalance(address user, address token) external view override returns (uint256) {
        return userBalances[user][token];
    }

    /**
     * @notice Get API model information
     * @param modelId Model identifier
     * @return model Model struct
     */
    function getModel(string calldata modelId) external view override returns (Model memory model) {
        return models[modelId];
    }

    /**
     * @notice Get model statistics
     * @param modelId Model identifier
     * @return totalCalls Total number of API calls
     * @return totalRevenue Total revenue generated
     * @return successfulCalls Successful calls (simplified)
     * @return failedCalls Failed calls (simplified)
     * @return avgResponseSize Average response size (placeholder)
     */
    function getModelStats(string calldata modelId) external view returns (
        uint256 totalCalls,
        uint256 totalRevenue,
        uint256 successfulCalls,
        uint256 failedCalls,
        uint256 avgResponseSize
    ) {
        Model memory model = models[modelId];
        totalCalls = model.totalCalls;
        totalRevenue = model.totalRevenue;
        
        // Simplified stats - in production would track more granularly
        successfulCalls = totalCalls;
        failedCalls = 0;
        avgResponseSize = 0;
    }

    // === ADMIN FUNCTIONS ===

    /**
     * @notice Set platform fee percentage
     * @param _platformFee New platform fee in basis points
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 2000, "Fee too high"); // Max 20%
        platformFee = _platformFee;
    }

    /**
     * @notice Set treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @notice Set attribution engine contract address
     * @param _attributionEngine Attribution engine contract address
     */
    function setAttributionEngine(address _attributionEngine) external onlyOwner {
        attributionEngine = _attributionEngine;
    }

    /**
     * @notice Set receipt manager contract address
     * @param _receiptManager Receipt manager contract address
     */
    function setReceiptManager(address _receiptManager) external onlyOwner {
        receiptManager = _receiptManager;
    }

    /**
     * @notice Emergency pause for model registration
     * @param modelId Model to pause
     */
    function pauseModel(string calldata modelId) external onlyOwner {
        models[modelId].active = false;
    }

    /**
     * @notice Emergency unpause for model registration
     * @param modelId Model to unpause
     */
    function unpauseModel(string calldata modelId) external onlyOwner {
        models[modelId].active = true;
    }
} 