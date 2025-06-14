// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title IAgentPayCore
 * @author AgentPay Team
 * @notice Interface for core AgentPay payment functionality
 * @dev This interface defines the core payment processing functions
 */
interface IAgentPayCore {
    /// @notice Represents an API model/endpoint
    struct Model {
        address owner;
        string endpoint;
        uint256 price;
        address token;
        bool active;
        uint256 totalCalls;
        uint256 totalRevenue;
    }

    /// @notice Privacy-preserving payment receipt
    struct PaymentReceipt {
        bytes32 inputHash;        // Hash of input data (privacy preserved)
        uint256 amount;           // Payment amount
        string modelId;           // API identifier
        address payer;            // Who paid
        uint256 timestamp;        // When payment was made
        bool validated;           // Whether API provider validated the payment
    }

    /// @notice Payment data for privacy-first payments
    struct PaymentData {
        string modelId;           // API identifier
        bytes32 inputHash;        // Hash of input (privacy preserved)
        uint256 amount;           // Payment amount
        uint256 deadline;         // Payment deadline
        bytes signature;          // Unified signature (permit or smart wallet)
    }

    /// @notice Events
    event ModelRegistered(string indexed modelId, address indexed owner, uint256 price);
    event PaymentProcessed(
        string indexed modelId,
        address indexed payer,
        uint256 amount,
        bytes32 indexed inputHash,
        uint256 timestamp
    );
    event PaymentWithdrawn(address indexed recipient, address indexed token, uint256 amount);
    event BalanceDeposited(address indexed user, address indexed token, uint256 amount);
    event BalanceUsed(address indexed user, address indexed token, uint256 amount, string modelId);

    /// @notice Core functions
    function registerModel(string calldata modelId, string calldata endpoint, uint256 price, address token) external;
    function payAndCall(PaymentData calldata payment) external;
    function validatePayment(bytes32 txHash, bytes32 inputHash) external view returns (bool valid);
    function markPaymentValidated(bytes32 txHash) external;
    function depositBalance(address token, uint256 amount) external;
    function withdraw(address token) external;
    function withdrawBalance(address token, uint256 amount) external;
    
    /// @notice View functions
    function getModel(string calldata modelId) external view returns (Model memory);
    function getPaymentReceipt(bytes32 txHash) external view returns (PaymentReceipt memory);
    function getBalance(address user, address token) external view returns (uint256);
    function getUserBalance(address user, address token) external view returns (uint256);
} 