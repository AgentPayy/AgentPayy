// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title ReceiptManager
 * @author AgentPayy Team
 * @notice Manages cryptographic receipts for API execution verification
 * @dev Provides enterprise-grade audit trails for all API executions
 */
contract ReceiptManager is Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Comprehensive receipt for API execution
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

    /// @notice Receipt storage and verification
    mapping(bytes32 => APIReceipt) public receipts;           // txHash => receipt
    mapping(address => bool) public authorizedGateways;       // Authorized gateway addresses
    mapping(bytes32 => bool) public usedExecutionProofs;      // Prevent replay attacks

    /// @notice Events
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
    event GatewayAuthorized(address indexed gateway, bool authorized);

    /**
     * @notice Initialize the receipt manager
     * @param _initialGateway Address of the initial authorized gateway
     */
    constructor(address _initialGateway) Ownable(msg.sender) {
        if (_initialGateway != address(0)) {
            authorizedGateways[_initialGateway] = true;
            emit GatewayAuthorized(_initialGateway, true);
        }
    }

    /**
     * @notice Submit execution receipt (called by authorized gateways)
     * @param txHash Transaction hash identifier
     * @param modelId API model identifier
     * @param payer Address that paid for the API call
     * @param inputHash Hash of input data
     * @param outputHash Hash of output data
     * @param executionProof Cryptographic proof of execution
     * @param executedAt Timestamp of execution
     * @param responseSize Size of response data
     * @param success Whether the API call succeeded
     * @param httpStatus HTTP status code returned
     */
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
    
    /**
     * @notice Verify receipt authenticity with provided data
     * @param txHash Transaction hash to verify
     * @param inputData Original input data
     * @param outputData Original output data
     * @return valid Whether the receipt is valid
     * @return reason Reason for validation result
     */
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
    
    /**
     * @notice Get receipt for transaction
     * @param txHash Transaction hash
     * @return receipt The API execution receipt
     */
    function getReceipt(bytes32 txHash) external view returns (APIReceipt memory receipt) {
        return receipts[txHash];
    }
    
    /**
     * @notice Check if receipt exists for transaction
     * @param txHash Transaction hash
     * @return exists Whether a receipt exists
     */
    function receiptExists(bytes32 txHash) external view returns (bool exists) {
        return receipts[txHash].executedAt > 0;
    }
    
    /**
     * @notice Get execution statistics for multiple transactions
     * @param txHashes Array of transaction hashes
     * @return successCount Number of successful executions
     * @return totalCount Total number of executions
     * @return avgResponseSize Average response size
     */
    function getExecutionStats(bytes32[] calldata txHashes) external view returns (
        uint256 successCount,
        uint256 totalCount,
        uint256 avgResponseSize
    ) {
        uint256 totalResponseSize = 0;
        totalCount = txHashes.length;
        
        for (uint i = 0; i < txHashes.length; i++) {
            APIReceipt memory receipt = receipts[txHashes[i]];
            if (receipt.executedAt > 0) {
                if (receipt.success) {
                    successCount++;
                }
                totalResponseSize += receipt.responseSize;
            }
        }
        
        avgResponseSize = totalCount > 0 ? totalResponseSize / totalCount : 0;
    }
    
    /**
     * @notice Authorize or deauthorize a gateway
     * @param gateway Gateway address
     * @param authorized Whether to authorize or deauthorize
     */
    function authorizeGateway(address gateway, bool authorized) external onlyOwner {
        require(gateway != address(0), "Invalid gateway address");
        authorizedGateways[gateway] = authorized;
        emit GatewayAuthorized(gateway, authorized);
    }
    
    /**
     * @notice Check if a gateway is authorized
     * @param gateway Gateway address to check
     * @return Whether the gateway is authorized
     */
    function isGatewayAuthorized(address gateway) external view returns (bool) {
        return authorizedGateways[gateway];
    }
    
    /**
     * @notice Batch authorize multiple gateways
     * @param gateways Array of gateway addresses
     * @param authorized Whether to authorize or deauthorize all
     */
    function batchAuthorizeGateways(address[] calldata gateways, bool authorized) external onlyOwner {
        for (uint i = 0; i < gateways.length; i++) {
            require(gateways[i] != address(0), "Invalid gateway address");
            authorizedGateways[gateways[i]] = authorized;
            emit GatewayAuthorized(gateways[i], authorized);
        }
    }
} 