// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract AgentPayKit is ReentrancyGuard, Ownable {

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

    mapping(string => Model) public models;
    mapping(address => mapping(address => uint256)) public balances; // user => token => amount
    mapping(address => mapping(address => uint256)) public userBalances; // NEW: Prepaid balances
    mapping(bytes32 => bool) public processedPayments;
    
    uint256 public platformFee = 1000; // 10%
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public treasury;

    event ModelRegistered(string indexed modelId, address indexed owner, uint256 price);
    event PaymentProcessed(
        string indexed modelId,
        address indexed payer,
        uint256 amount,
        bytes32 inputHash,
        uint256 timestamp
    );
    event PaymentWithdrawn(address indexed recipient, address indexed token, uint256 amount);
    event BalanceDeposited(address indexed user, address indexed token, uint256 amount); // NEW
    event BalanceUsed(address indexed user, address indexed token, uint256 amount, string modelId); // NEW

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
        
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);
        address signer = ECDSA.recover(ethSignedMessageHash, payment.smartWalletSig);
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
} 