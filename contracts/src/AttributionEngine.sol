// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/IERC20Permit.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "./IAgentPayyCore.sol";

/**
 * @title AttributionEngine
 * @author AgentPayy Team
 * @notice Handles multi-party revenue attribution for complex agent workflows
 * @dev Enables automatic distribution of payments across multiple agents
 */
contract AttributionEngine is ReentrancyGuard, Ownable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    /// @notice Attribution split definition
    struct Attribution {
        address recipient;
        uint256 basisPoints; // out of 10000 (100%)
    }

    /// @notice Enhanced payment data with attribution
    struct AttributedPaymentData {
        string modelId;
        bytes32 inputHash;
        uint256 amount;
        uint256 deadline;
        Attribution[] attributions;
        bytes smartWalletSig;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    /// @notice Core contract reference
    IAgentPayyCore public immutable coreContract;
    
    /// @notice Platform fee (10%)
    uint256 public platformFee = 1000;
    uint256 public constant FEE_DENOMINATOR = 10000;
    address public treasury;

    /// @notice Balances for multi-party recipients
    mapping(address => mapping(address => uint256)) public balances;
    mapping(bytes32 => bool) public processedAttributions;

    /// @notice Events
    event AttributedPayment(
        string indexed modelId,
        address indexed payer,
        uint256 amount,
        Attribution[] attributions
    );
    event AttributionDistributed(
        address indexed recipient,
        address indexed token,
        uint256 amount,
        string modelId
    );
    event PaymentWithdrawn(address indexed recipient, address indexed token, uint256 amount);

    /**
     * @notice Initialize the attribution engine
     * @param _coreContract Address of the core AgentPayy contract
     * @param _treasury Treasury address for platform fees
     */
    constructor(address _coreContract, address _treasury) Ownable(msg.sender) {
        require(_coreContract != address(0), "Invalid core contract");
        require(_treasury != address(0), "Invalid treasury");
        coreContract = IAgentPayyCore(_coreContract);
        treasury = _treasury;
    }

    /**
     * @notice Process payment with attribution splits
     * @param payment Payment data including attribution splits
     */
    function payAndCallWithAttribution(AttributedPaymentData calldata payment) external nonReentrant {
        IAgentPayyCore.Model memory model = coreContract.getModel(payment.modelId);
        require(model.owner != address(0), "Model not found");
        require(model.active, "Model inactive");
        require(payment.amount >= model.price, "Insufficient payment");
        require(block.timestamp <= payment.deadline, "Payment expired");
        
        // Validate attribution splits
        _validateAttributions(payment.attributions);

        bytes32 paymentId = keccak256(abi.encodePacked(
            payment.modelId,
            payment.inputHash,
            msg.sender,
            payment.deadline,
            _hashAttributions(payment.attributions)
        ));
        require(!processedAttributions[paymentId], "Payment processed");
        processedAttributions[paymentId] = true;

        // Process payment through core contract first
        IERC20(model.token).transferFrom(msg.sender, address(this), payment.amount);
        
        // Distribute funds according to attribution
        _distributeFundsWithAttribution(model, payment.amount, payment.attributions);

        emit AttributedPayment(
            payment.modelId,
            msg.sender,
            payment.amount,
            payment.attributions
        );
    }

    /**
     * @notice Distribute funds according to attribution rules
     * @param model The API model receiving payment
     * @param amount Total payment amount
     * @param attributions Array of attribution splits
     */
    function _distributeFundsWithAttribution(
        IAgentPayyCore.Model memory model, 
        uint256 amount, 
        Attribution[] calldata attributions
    ) internal {
        uint256 fee = (amount * platformFee) / FEE_DENOMINATOR;
        uint256 distributionAmount = amount - fee;
        
        // Add platform fee
        balances[treasury][model.token] += fee;
        
        if (attributions.length == 0) {
            // Default: All to model owner
            balances[model.owner][model.token] += distributionAmount;
            emit AttributionDistributed(model.owner, model.token, distributionAmount, model.endpoint);
        } else {
            // Distribute according to attribution
            for (uint i = 0; i < attributions.length; i++) {
                uint256 recipientAmount = (distributionAmount * attributions[i].basisPoints) / 10000;
                balances[attributions[i].recipient][model.token] += recipientAmount;
                
                emit AttributionDistributed(
                    attributions[i].recipient, 
                    model.token, 
                    recipientAmount, 
                    model.endpoint
                );
            }
        }
    }

    /**
     * @notice Validate attribution splits sum to 100%
     * @param attributions Array of attribution splits to validate
     */
    function _validateAttributions(Attribution[] calldata attributions) internal pure {
        require(attributions.length <= 10, "Too many attributions");
        
        uint256 totalBasisPoints = 0;
        for (uint i = 0; i < attributions.length; i++) {
            require(attributions[i].recipient != address(0), "Invalid recipient");
            require(attributions[i].basisPoints > 0, "Invalid basis points");
            totalBasisPoints += attributions[i].basisPoints;
        }
        
        require(totalBasisPoints == 10000, "Attribution must sum to 100%");
    }

    /**
     * @notice Generate hash for attribution array
     * @param attributions Attribution splits to hash
     * @return Hash of the attribution data
     */
    function _hashAttributions(Attribution[] calldata attributions) internal pure returns (bytes32) {
        return keccak256(abi.encode(attributions));
    }

    /**
     * @notice Withdraw attributed earnings
     * @param token Token address to withdraw
     */
    function withdraw(address token) external nonReentrant {
        uint256 amount = balances[msg.sender][token];
        require(amount > 0, "No balance");
        
        balances[msg.sender][token] = 0;
        
        bool success = IERC20(token).transfer(msg.sender, amount);
        require(success, "Transfer failed");
        
        emit PaymentWithdrawn(msg.sender, token, amount);
    }

    /**
     * @notice Get attributed balance for user
     * @param user User address
     * @param token Token address
     * @return Balance amount
     */
    function getAttributedBalance(address user, address token) external view returns (uint256) {
        return balances[user][token];
    }

    /**
     * @notice Set platform fee (only owner)
     * @param _platformFee New platform fee in basis points
     */
    function setPlatformFee(uint256 _platformFee) external onlyOwner {
        require(_platformFee <= 2000, "Fee too high"); // Max 20%
        platformFee = _platformFee;
    }

    /**
     * @notice Set treasury address (only owner)
     * @param _treasury New treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }
} 