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

    /// @notice Payment data for standard payments
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
    function depositBalance(address token, uint256 amount) external;
    function withdraw(address token) external;
    function withdrawBalance(address token, uint256 amount) external;
    
    /// @notice View functions
    function getModel(string calldata modelId) external view returns (Model memory);
    function getBalance(address user, address token) external view returns (uint256);
    function getUserBalance(address user, address token) external view returns (uint256);
} 