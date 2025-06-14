// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IAgentPayyCore.sol";

/**
 * @title AgentPayyCore
 * @author AgentPayy Team
 * @notice Core payment processing contract for AgentPayy
 * @dev Handles basic API payments, model registration, and balance management
 * @custom:version 2.0.0
 * @custom:security-contact security@agentpay.org
 */
contract AgentPayyCore is IAgentPayyCore, ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;
    using SafeERC20 for IERC20;

    /// @notice Model storage
    mapping(string => Model) public models;
    
    /// @notice Balance storage
    mapping(address => mapping(address => uint256)) public balances; // user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances; // prepaid balances
    mapping(bytes32 => bool) public processedPayments;
    mapping(bytes32 => PaymentReceipt) public paymentReceipts; // txHash => receipt
    
    /// @notice Platform configuration
    uint256 public platformFee = 1000; // 10%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public treasury;

    /// @notice External contract references
    address public attributionEngine;
    address public receiptManager;

    /// @notice Additional events for security
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    event AttributionEngineUpdated(address oldEngine, address newEngine);
    event ReceiptManagerUpdated(address oldManager, address newManager);

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
        
        // Use SafeERC20 for secure transfer
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender][token] += amount;
        
        emit BalanceDeposited(msg.sender, token, amount);
    }

    /**
     * @notice Process payment for API call (Privacy-First)
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

        // Create transaction hash for receipt
        bytes32 txHash = keccak256(abi.encodePacked(
            block.number,
            block.timestamp,
            msg.sender,
            payment.inputHash
        ));

        // Update model stats BEFORE external calls (reentrancy protection)
        model.totalCalls++;
        model.totalRevenue += payment.amount;

        // Create privacy-preserving payment receipt
        paymentReceipts[txHash] = PaymentReceipt({
            inputHash: payment.inputHash,
            amount: payment.amount,
            modelId: payment.modelId,
            payer: msg.sender,
            timestamp: block.timestamp,
            validated: false
        });

        // Dual payment model: Check balance first, fallback to signature
        uint256 userBalance = userBalances[msg.sender][model.token];
        
        if (userBalance >= payment.amount) {
            // Use prepaid balance - update state before external interactions
            userBalances[msg.sender][model.token] -= payment.amount;
            _distributeFunds(model, payment.amount);
            
            emit BalanceUsed(msg.sender, model.token, payment.amount, payment.modelId);
        } else {
            // Process signature payment (unified permit/smart wallet handling)
            _processSignaturePayment(model, payment);
        }

        emit PaymentProcessed(
            payment.modelId,
            msg.sender,
            payment.amount,
            payment.inputHash,
            block.timestamp
        );
    }

    /**
     * @notice Process signature payment (unified permit/smart wallet handling)
     * @param model API model being paid for
     * @param payment Payment data
     */
    function _processSignaturePayment(
        Model storage model,
        PaymentData calldata payment
    ) internal {
        // Check if we have standard signature components (v,r,s)
        if (payment.v != 0 || payment.r != bytes32(0) || payment.s != bytes32(0)) {
            // Standard permit signature (v,r,s format)
            IERC20Permit(model.token).permit(
                msg.sender,
                address(this),
                payment.amount,
                payment.deadline,
                payment.v,
                payment.r,
                payment.s
            );
        } else if (payment.smartWalletSig.length > 0) {
            // Smart wallet signature validation
            bytes32 messageHash = keccak256(abi.encodePacked(
                payment.modelId,
                payment.inputHash,
                payment.amount,
                payment.deadline
            ));
            
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            address signer = ethSignedMessageHash.recover(payment.smartWalletSig);
            require(signer == msg.sender, "Invalid signature");
        } else {
            revert("No valid signature provided");
        }

        // Use SafeERC20 for secure transfer
        IERC20(model.token).safeTransferFrom(msg.sender, address(this), payment.amount);
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
        
        // Use SafeERC20 for secure transfer
        IERC20(token).safeTransfer(msg.sender, amount);
        
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
        
        // Use SafeERC20 for secure transfer
        IERC20(token).safeTransfer(msg.sender, amount);
        
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
        uint256 oldFee = platformFee;
        platformFee = _platformFee;
        emit PlatformFeeUpdated(oldFee, _platformFee);
    }

    /**
     * @notice Set treasury address
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @notice Set attribution engine contract address
     * @param _attributionEngine Attribution engine contract address
     */
    function setAttributionEngine(address _attributionEngine) external onlyOwner {
        require(_attributionEngine != address(0), "Invalid attribution engine");
        address oldEngine = attributionEngine;
        attributionEngine = _attributionEngine;
        emit AttributionEngineUpdated(oldEngine, _attributionEngine);
    }

    /**
     * @notice Set receipt manager contract address
     * @param _receiptManager Receipt manager contract address
     */
    function setReceiptManager(address _receiptManager) external onlyOwner {
        require(_receiptManager != address(0), "Invalid receipt manager");
        address oldManager = receiptManager;
        receiptManager = _receiptManager;
        emit ReceiptManagerUpdated(oldManager, _receiptManager);
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

    /**
     * @notice Validate payment for API providers (Privacy-First)
     * @param txHash Transaction hash from payment
     * @param inputHash Hash of the input data being validated
     * @return valid Whether the payment is valid for this input
     */
    function validatePayment(bytes32 txHash, bytes32 inputHash) external view override returns (bool valid) {
        PaymentReceipt memory receipt = paymentReceipts[txHash];
        // Use != instead of == for safer comparison
        return receipt.inputHash != bytes32(0) && receipt.inputHash == inputHash && receipt.amount > 0;
    }

    /**
     * @notice Mark payment as validated by API provider
     * @param txHash Transaction hash from payment
     */
    function markPaymentValidated(bytes32 txHash) external override {
        PaymentReceipt storage receipt = paymentReceipts[txHash];
        require(receipt.amount > 0, "Payment not found");
        
        // Only model owner can mark as validated
        Model memory model = models[receipt.modelId];
        require(model.owner == msg.sender, "Not authorized");
        
        receipt.validated = true;
    }

    /**
     * @notice Get payment receipt
     * @param txHash Transaction hash
     * @return receipt The payment receipt
     */
    function getPaymentReceipt(bytes32 txHash) external view override returns (PaymentReceipt memory receipt) {
        return paymentReceipts[txHash];
    }
} 