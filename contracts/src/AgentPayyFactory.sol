// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./AgentPayyCore.sol";
import "./AttributionEngine.sol";
import "./ReceiptManager.sol";
import "./APIRegistry.sol";
import "./GovernanceTimelock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Create2.sol";

/**
 * @title AgentPayyFactory
 * @author AgentPayy Team
 * @notice Factory contract for deploying complete AgentPayy ecosystem with governance
 * @dev Deploys all contracts and sets up proper ownership structure with timelock
 */
contract AgentPayyFactory is Ownable {
    /// @notice Deployment configuration
    struct DeploymentConfig {
        address treasury;
        address gnosisSafe;
        uint256 timelockDelay;
        string salt;
    }
    
    /// @notice Deployed contract addresses
    struct DeployedContracts {
        address agentPayyCore;
        address attributionEngine;
        address receiptManager;
        address apiRegistry;
        address governanceTimelock;
    }
    
    /// @notice Events
    event EcosystemDeployed(
        address indexed deployer,
        address indexed gnosisSafe,
        DeployedContracts contracts,
        string salt
    );
    
    event ContractUpgraded(
        address indexed oldContract,
        address indexed newContract,
        string contractType
    );
    
    /// @notice Mapping of deployment salt to deployed contracts
    mapping(string => DeployedContracts) public deployments;
    
    /// @notice Array of all deployment salts for enumeration
    string[] public deploymentSalts;
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Deploy complete AgentPayy ecosystem with governance
     * @param config Deployment configuration
     * @return contracts Deployed contract addresses
     */
    function deployEcosystem(DeploymentConfig calldata config) 
        external 
        onlyOwner 
        returns (DeployedContracts memory contracts) 
    {
        require(config.treasury != address(0), "Invalid treasury");
        require(config.gnosisSafe != address(0), "Invalid Gnosis Safe");
        require(config.timelockDelay >= 1 hours, "Timelock delay too short");
        require(bytes(config.salt).length > 0, "Salt required");
        require(deployments[config.salt].agentPayyCore == address(0), "Salt already used");
        
        bytes32 salt = keccak256(abi.encodePacked(config.salt));
        
        // 1. Deploy governance timelock first
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = config.gnosisSafe;
        executors[0] = config.gnosisSafe;
        
        contracts.governanceTimelock = Create2.deploy(
            0,
            salt,
            abi.encodePacked(
                type(GovernanceTimelock).creationCode,
                abi.encode(
                    config.timelockDelay,
                    proposers,
                    executors,
                    config.gnosisSafe, // admin
                    config.gnosisSafe  // gnosis safe
                )
            )
        );
        
        // 2. Deploy core contracts with timelock as owner
        contracts.agentPayyCore = Create2.deploy(
            0,
            keccak256(abi.encodePacked(salt, "core")),
            abi.encodePacked(
                type(AgentPayyCore).creationCode,
                abi.encode(config.treasury)
            )
        );
        
        contracts.attributionEngine = Create2.deploy(
            0,
            keccak256(abi.encodePacked(salt, "attribution")),
            abi.encodePacked(
                type(AttributionEngine).creationCode,
                abi.encode(contracts.agentPayyCore, config.treasury)
            )
        );
        
        contracts.receiptManager = Create2.deploy(
            0,
            keccak256(abi.encodePacked(salt, "receipts")),
            abi.encodePacked(
                type(ReceiptManager).creationCode,
                abi.encode(contracts.governanceTimelock)
            )
        );
        
        contracts.apiRegistry = Create2.deploy(
            0,
            keccak256(abi.encodePacked(salt, "registry")),
            abi.encodePacked(
                type(APIRegistry).creationCode
            )
        );
        
        // 3. Link contracts
        AgentPayyCore(contracts.agentPayyCore).setAttributionEngine(contracts.attributionEngine);
        AgentPayyCore(contracts.agentPayyCore).setReceiptManager(contracts.receiptManager);
        
        // 4. Transfer ownership to timelock
        AgentPayyCore(contracts.agentPayyCore).transferOwnership(contracts.governanceTimelock);
        AttributionEngine(contracts.attributionEngine).transferOwnership(contracts.governanceTimelock);
        APIRegistry(contracts.apiRegistry).transferOwnership(contracts.governanceTimelock);
        
        // 5. Store deployment
        deployments[config.salt] = contracts;
        deploymentSalts.push(config.salt);
        
        emit EcosystemDeployed(msg.sender, config.gnosisSafe, contracts, config.salt);
        
        return contracts;
    }
    
    /**
     * @notice Predict contract addresses before deployment
     * @param config Deployment configuration
     * @return contracts Predicted contract addresses
     */
    function predictAddresses(DeploymentConfig calldata config) 
        external 
        view 
        returns (DeployedContracts memory contracts) 
    {
        bytes32 salt = keccak256(abi.encodePacked(config.salt));
        
        address[] memory proposers = new address[](1);
        address[] memory executors = new address[](1);
        proposers[0] = config.gnosisSafe;
        executors[0] = config.gnosisSafe;
        
        contracts.governanceTimelock = Create2.computeAddress(
            salt,
            keccak256(abi.encodePacked(
                type(GovernanceTimelock).creationCode,
                abi.encode(
                    config.timelockDelay,
                    proposers,
                    executors,
                    config.gnosisSafe,
                    config.gnosisSafe
                )
            ))
        );
        
        contracts.agentPayyCore = Create2.computeAddress(
            keccak256(abi.encodePacked(salt, "core")),
            keccak256(abi.encodePacked(
                type(AgentPayyCore).creationCode,
                abi.encode(config.treasury)
            ))
        );
        
        contracts.attributionEngine = Create2.computeAddress(
            keccak256(abi.encodePacked(salt, "attribution")),
            keccak256(abi.encodePacked(
                type(AttributionEngine).creationCode,
                abi.encode(contracts.agentPayyCore, config.treasury)
            ))
        );
        
        contracts.receiptManager = Create2.computeAddress(
            keccak256(abi.encodePacked(salt, "receipts")),
            keccak256(abi.encodePacked(
                type(ReceiptManager).creationCode,
                abi.encode(contracts.governanceTimelock)
            ))
        );
        
        contracts.apiRegistry = Create2.computeAddress(
            keccak256(abi.encodePacked(salt, "registry")),
            keccak256(abi.encodePacked(
                type(APIRegistry).creationCode
            ))
        );
        
        return contracts;
    }
    
    /**
     * @notice Get deployment by salt
     * @param salt Deployment salt
     * @return contracts Deployed contract addresses
     */
    function getDeployment(string calldata salt) 
        external 
        view 
        returns (DeployedContracts memory contracts) 
    {
        return deployments[salt];
    }
    
    /**
     * @notice Get all deployment salts
     * @return Array of deployment salts
     */
    function getAllDeploymentSalts() external view returns (string[] memory) {
        return deploymentSalts;
    }
    
    /**
     * @notice Get number of deployments
     * @return Number of deployments
     */
    function getDeploymentCount() external view returns (uint256) {
        return deploymentSalts.length;
    }
    
    /**
     * @notice Emergency function to upgrade a contract (only owner)
     * @param salt Deployment salt
     * @param contractType Type of contract to upgrade
     * @param newImplementation New contract implementation
     */
    function emergencyUpgrade(
        string calldata salt,
        string calldata contractType,
        address newImplementation
    ) external onlyOwner {
        require(newImplementation != address(0), "Invalid implementation");
        require(deployments[salt].agentPayyCore != address(0), "Deployment not found");
        
        DeployedContracts storage deployment = deployments[salt];
        address oldContract;
        
        if (keccak256(bytes(contractType)) == keccak256(bytes("core"))) {
            oldContract = deployment.agentPayyCore;
            deployment.agentPayyCore = newImplementation;
        } else if (keccak256(bytes(contractType)) == keccak256(bytes("attribution"))) {
            oldContract = deployment.attributionEngine;
            deployment.attributionEngine = newImplementation;
        } else if (keccak256(bytes(contractType)) == keccak256(bytes("receipts"))) {
            oldContract = deployment.receiptManager;
            deployment.receiptManager = newImplementation;
        } else if (keccak256(bytes(contractType)) == keccak256(bytes("registry"))) {
            oldContract = deployment.apiRegistry;
            deployment.apiRegistry = newImplementation;
        } else {
            revert("Invalid contract type");
        }
        
        emit ContractUpgraded(oldContract, newImplementation, contractType);
    }
} 