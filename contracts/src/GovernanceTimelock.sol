// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title GovernanceTimelock
 * @author AgentPayy Team
 * @notice Timelock controller for AgentPayy governance with Gnosis Safe integration
 * @dev Extends OpenZeppelin's TimelockController with custom roles and safety features
 */
contract GovernanceTimelock is TimelockController {
    /// @notice Role for emergency actions (shorter timelock)
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    /// @notice Role for routine operations (standard timelock)
    bytes32 public constant ROUTINE_ROLE = keccak256("ROUTINE_ROLE");
    
    /// @notice Minimum delay for emergency actions (1 hour)
    uint256 public constant EMERGENCY_DELAY = 1 hours;
    
    /// @notice Minimum delay for routine actions (24 hours)
    uint256 public constant ROUTINE_DELAY = 24 hours;
    
    /// @notice Events for governance actions
    event EmergencyActionScheduled(bytes32 indexed id, address indexed target, bytes data);
    event RoutineActionScheduled(bytes32 indexed id, address indexed target, bytes data);
    event GnosisSafeUpdated(address indexed oldSafe, address indexed newSafe);
    
    /// @notice Gnosis Safe address for multi-sig operations
    address public gnosisSafe;
    
    /**
     * @notice Initialize the timelock with Gnosis Safe integration
     * @param minDelay Minimum delay for standard operations
     * @param proposers Array of addresses that can propose operations
     * @param executors Array of addresses that can execute operations
     * @param admin Admin address (should be Gnosis Safe)
     * @param _gnosisSafe Gnosis Safe address for multi-sig operations
     */
    constructor(
        uint256 minDelay,
        address[] memory proposers,
        address[] memory executors,
        address admin,
        address _gnosisSafe
    ) TimelockController(minDelay, proposers, executors, admin) {
        require(_gnosisSafe != address(0), "Invalid Gnosis Safe address");
        gnosisSafe = _gnosisSafe;
        
        // Grant emergency role to Gnosis Safe
        _grantRole(EMERGENCY_ROLE, _gnosisSafe);
        _grantRole(ROUTINE_ROLE, _gnosisSafe);
        
        // Set role admins
        _setRoleAdmin(EMERGENCY_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(ROUTINE_ROLE, DEFAULT_ADMIN_ROLE);
    }
    
    /**
     * @notice Schedule an emergency action with reduced timelock
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Encoded function call data
     * @param predecessor Predecessor operation hash
     * @param salt Salt for operation uniqueness
     * @return Operation hash
     */
    function scheduleEmergency(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(EMERGENCY_ROLE) returns (bytes32) {
        schedule(target, value, data, predecessor, salt, EMERGENCY_DELAY);
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        
        emit EmergencyActionScheduled(id, target, data);
        return id;
    }
    
    /**
     * @notice Schedule a routine action with standard timelock
     * @param target Target contract address
     * @param value ETH value to send
     * @param data Encoded function call data
     * @param predecessor Predecessor operation hash
     * @param salt Salt for operation uniqueness
     * @return Operation hash
     */
    function scheduleRoutine(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external onlyRole(ROUTINE_ROLE) returns (bytes32) {
        schedule(target, value, data, predecessor, salt, ROUTINE_DELAY);
        bytes32 id = hashOperation(target, value, data, predecessor, salt);
        
        emit RoutineActionScheduled(id, target, data);
        return id;
    }
    
    /**
     * @notice Update Gnosis Safe address (only admin)
     * @param newGnosisSafe New Gnosis Safe address
     */
    function updateGnosisSafe(address newGnosisSafe) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newGnosisSafe != address(0), "Invalid Gnosis Safe address");
        
        address oldSafe = gnosisSafe;
        
        // Revoke roles from old safe
        _revokeRole(EMERGENCY_ROLE, oldSafe);
        _revokeRole(ROUTINE_ROLE, oldSafe);
        
        // Grant roles to new safe
        _grantRole(EMERGENCY_ROLE, newGnosisSafe);
        _grantRole(ROUTINE_ROLE, newGnosisSafe);
        
        gnosisSafe = newGnosisSafe;
        
        emit GnosisSafeUpdated(oldSafe, newGnosisSafe);
    }
    
    /**
     * @notice Get operation details with enhanced information
     * @param id Operation hash
     * @return timestamp When the operation can be executed
     * @return ready Whether the operation is ready for execution
     * @return done Whether the operation has been executed
     */
    function getEnhancedOperationState(bytes32 id) external view returns (
        uint256 timestamp,
        bool ready,
        bool done
    ) {
        timestamp = getTimestamp(id);
        ready = super.isOperationReady(id);
        done = isOperationDone(id);
    }
} 