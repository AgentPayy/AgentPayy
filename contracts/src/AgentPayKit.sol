// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AgentPayKit is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    struct Model {
        address owner;
        string endpoint;
        uint256 price;
        address token;
        bool active;
        uint256 totalCalls;
        uint256 totalRevenue;
    }

    struct PaymentData {
        string modelId;
        bytes32 inputHash;
        uint256 amount;
        uint256 deadline;
        bytes smartWalletSig;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // NEW: Comprehensive Receipt System
    struct APIReceipt {
        bytes32 inputHash;           // Hash of request data
        bytes32 outputHash;          // Hash of response data  
        bytes32 executionProof;      // Gateway signature proving execution
        uint256 executedAt;          // When API was actually called
        uint256 responseSize;        // Size of response (for billing/limits)
        bool success;                // Whether API call succeeded
        uint256 httpStatus;          // HTTP status code
        address gateway;             // Which gateway processed this
    }

    mapping(string => Model) public models;
    mapping(address => mapping(address => uint256)) public balances; // user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances; // NEW: Prepaid balances
    mapping(bytes32 => bool) public processedPayments;
    
    // NEW: Receipt storage and verification
    mapping(bytes32 => APIReceipt) public receipts;           // txHash => receipt
    mapping(address => bool) public authorizedGateways;       // Authorized gateway addresses
    mapping(bytes32 => bool) public usedExecutionProofs;      // Prevent replay attacks
    
    uint256 public platformFee = 1000; // 10%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public treasury;

    event ModelRegistered(string indexed modelId, address indexed owner, uint256 price);
    event PaymentProcessed(
        string indexed modelId,
        address indexed payer,
        uint256 amount,
        bytes32 indexed inputHash,
        uint256 timestamp
    );
    
    // NEW: Receipt events for full transparency
    event APIExecutionReceipt(
        bytes32 indexed txHash,
        string indexed modelId,
        address indexed payer,
        bytes32 inputHash,
        bytes32 outputHash,
        bytes32 executionProof,
        uint256 executedAt,
        uint256 responseSize,
        bool success,
        uint256 httpStatus,
        address gateway
    );
    
    event PaymentWithdrawn(address indexed recipient, address indexed token, uint256 amount);
    event BalanceDeposited(address indexed user, address indexed token, uint256 amount); // NEW
    event BalanceUsed(address indexed user, address indexed token, uint256 amount, string modelId); // NEW
    event GatewayAuthorized(address indexed gateway, bool authorized);

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    function registerModel(
        string calldata modelId,
        string calldata endpoint,
        uint256 price,
        address token
    ) external {
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

    // NEW: Deposit funds to prepaid balance
    function depositBalance(address token, uint256 amount) external nonReentrant {
        require(token != address(0), "Invalid token");
        require(amount > 0, "Invalid amount");
        
        IERC20(token).transferFrom(msg.sender, address(this), amount);
        userBalances[msg.sender][token] += amount;
        
        emit BalanceDeposited(msg.sender, token, amount);
    }

    // ENHANCED: Dual payment model - balance first, fallback to permit
    function payAndCall(PaymentData calldata payment) external nonReentrant {
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

        // DUAL PAYMENT MODEL: Check balance first, fallback to permit
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

    function _distributeFunds(Model storage model, uint256 amount) internal {
        uint256 fee = (amount * platformFee) / FEE_DENOMINATOR;
        uint256 ownerAmount = amount - fee;

        balances[model.owner][model.token] += ownerAmount;
        balances[treasury][model.token] += fee;
    }

    function withdraw(address token) external nonReentrant {
        uint256 amount = balances[msg.sender][token];
        require(amount > 0, "No balance");
        
        balances[msg.sender][token] = 0;
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit PaymentWithdrawn(msg.sender, token, amount);
    }

    // NEW: Withdraw prepaid balance
    function withdrawBalance(address token, uint256 amount) external nonReentrant {
        require(userBalances[msg.sender][token] >= amount, "Insufficient balance");
        
        userBalances[msg.sender][token] -= amount;
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit PaymentWithdrawn(msg.sender, token, amount);
    }

    function getBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }

    // NEW: Get prepaid balance
    function getUserBalance(address user, address token) external view returns (uint256) {
        return userBalances[user][token];
    }

    function getModel(string calldata modelId) external view returns (Model memory) {
        return models[modelId];
    }

    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 2000, "Fee too high"); // Max 20%
        platformFee = _platformFee;
    }

    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    // NEW: Submit execution receipt (called by authorized gateways)
    function submitExecutionReceipt(
        bytes32 txHash,
        string calldata modelId,
        address payer,
        bytes32 inputHash,
        bytes32 outputHash,
        bytes32 executionProof,
        uint256 executedAt,
        uint256 responseSize,
        bool success,
        uint256 httpStatus
    ) external {
        require(authorizedGateways[msg.sender], "Unauthorized gateway");
        require(receipts[txHash].executedAt == 0, "Receipt already exists");
        require(!usedExecutionProofs[executionProof], "Execution proof already used");
        require(executedAt <= block.timestamp, "Invalid execution time");
        
        // Verify execution proof signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            txHash,
            modelId,
            payer,
            inputHash,
            outputHash,
            executedAt,
            responseSize,
            success,
            httpStatus
        ));
        
        bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
        address signer = ethSignedMessageHash.recover(abi.encodePacked(executionProof));
        require(signer == msg.sender, "Invalid execution proof");
        
        // Store receipt
        receipts[txHash] = APIReceipt({
            inputHash: inputHash,
            outputHash: outputHash,
            executionProof: executionProof,
            executedAt: executedAt,
            responseSize: responseSize,
            success: success,
            httpStatus: httpStatus,
            gateway: msg.sender
        });
        
        usedExecutionProofs[executionProof] = true;
        
        emit APIExecutionReceipt(
            txHash,
            modelId,
            payer,
            inputHash,
            outputHash,
            executionProof,
            executedAt,
            responseSize,
            success,
            httpStatus,
            msg.sender
        );
    }
    
    // NEW: Verify receipt authenticity
    function verifyReceipt(
        bytes32 txHash,
        bytes calldata inputData,
        bytes calldata outputData
    ) external view returns (bool valid, string memory reason) {
        APIReceipt memory receipt = receipts[txHash];
        
        if (receipt.executedAt == 0) {
            return (false, "Receipt not found");
        }
        
        // Verify input hash
        if (keccak256(inputData) != receipt.inputHash) {
            return (false, "Input data doesn't match hash");
        }
        
        // Verify output hash  
        if (keccak256(outputData) != receipt.outputHash) {
            return (false, "Output data doesn't match hash");
        }
        
        // Verify gateway authorization
        if (!authorizedGateways[receipt.gateway]) {
            return (false, "Gateway not authorized");
        }
        
        return (true, "Receipt verified");
    }
    
    // NEW: Get receipt for dispute resolution
    function getReceipt(bytes32 txHash) external view returns (APIReceipt memory) {
        return receipts[txHash];
    }
    
    // NEW: Admin functions for gateway management
    function authorizeGateway(address gateway, bool authorized) external onlyOwner {
        authorizedGateways[gateway] = authorized;
        emit GatewayAuthorized(gateway, authorized);
    }
    
    // NEW: Get execution statistics for API model
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
        
        // Note: In production, these would be tracked more efficiently
        // For now, returning basic stats
        successfulCalls = totalCalls; // Simplified
        failedCalls = 0;
        avgResponseSize = 0;
    }
} 