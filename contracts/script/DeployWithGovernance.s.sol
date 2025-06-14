// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPayyFactory} from "../src/AgentPayyFactory.sol";

/**
 * @title DeployWithGovernance
 * @notice Production-ready deployment script with governance and Gnosis Safe integration
 * @dev Deploys AgentPayy ecosystem using factory pattern with proper governance setup
 */
contract DeployWithGovernance is Script {
    AgentPayyFactory public factory;
    
    // Network-specific Gnosis Safe addresses (you'll need to create these)
    mapping(uint256 => address) public gnosisSafeAddresses;
    
    // USDC addresses by chain
    mapping(uint256 => address) public usdcAddresses;
    
    function setUp() public {
        // Initialize USDC addresses (official Circle addresses)
        usdcAddresses[1] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Ethereum
        usdcAddresses[8453] = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base
        usdcAddresses[42161] = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831; // Arbitrum
        usdcAddresses[10] = 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85; // Optimism
        usdcAddresses[59144] = 0x176211869cA2b568f2A7D4EE941E073a821EE1ff; // Linea
        
        // Initialize Gnosis Safe addresses (you'll need to create these first)
        // These are placeholder addresses - replace with your actual Gnosis Safes
        gnosisSafeAddresses[1] = 0x0000000000000000000000000000000000000000; // Ethereum - CREATE THIS
        gnosisSafeAddresses[8453] = 0x0000000000000000000000000000000000000000; // Base - CREATE THIS
        gnosisSafeAddresses[42161] = 0x0000000000000000000000000000000000000000; // Arbitrum - CREATE THIS
        gnosisSafeAddresses[10] = 0x0000000000000000000000000000000000000000; // Optimism - CREATE THIS
    }
    
    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;
        
        console.log("=== AgentPayy Governance Deployment ===");
        console.log("Chain ID:", chainId);
        console.log("Network:", getNetworkName(chainId));
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Balance:", vm.addr(deployerPrivateKey).balance);
        
        // Get or create Gnosis Safe address
        address gnosisSafe = getOrCreateGnosisSafe(chainId);
        require(gnosisSafe != address(0), "Gnosis Safe address required");
        
        // Get treasury address (default to Gnosis Safe)
        address treasury = vm.envOr("TREASURY_ADDRESS", gnosisSafe);
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy factory if not exists
        console.log("\n=== Deploying Factory ===");
        factory = new AgentPayyFactory();
        console.log("Factory deployed:", address(factory));
        
        // Prepare deployment config
        AgentPayyFactory.DeploymentConfig memory config = AgentPayyFactory.DeploymentConfig({
            treasury: treasury,
            gnosisSafe: gnosisSafe,
            timelockDelay: getTimelockDelay(chainId),
            salt: generateSalt(chainId)
        });
        
        console.log("\n=== Deployment Configuration ===");
        console.log("Treasury:", config.treasury);
        console.log("Gnosis Safe:", config.gnosisSafe);
        console.log("Timelock Delay:", config.timelockDelay);
        console.log("Salt:", config.salt);
        
        // Predict addresses
        console.log("\n=== Predicting Addresses ===");
        AgentPayyFactory.DeployedContracts memory predicted = factory.predictAddresses(config);
        console.log("Predicted AgentPayyCore:", predicted.agentPayyCore);
        console.log("Predicted AttributionEngine:", predicted.attributionEngine);
        console.log("Predicted ReceiptManager:", predicted.receiptManager);
        console.log("Predicted APIRegistry:", predicted.apiRegistry);
        console.log("Predicted GovernanceTimelock:", predicted.governanceTimelock);
        
        // Deploy ecosystem
        console.log("\n=== Deploying Ecosystem ===");
        AgentPayyFactory.DeployedContracts memory deployed = factory.deployEcosystem(config);
        
        vm.stopBroadcast();
        
        // Verify addresses match predictions
        require(deployed.agentPayyCore == predicted.agentPayyCore, "Core address mismatch");
        require(deployed.attributionEngine == predicted.attributionEngine, "Attribution address mismatch");
        require(deployed.receiptManager == predicted.receiptManager, "Receipt address mismatch");
        require(deployed.apiRegistry == predicted.apiRegistry, "Registry address mismatch");
        require(deployed.governanceTimelock == predicted.governanceTimelock, "Timelock address mismatch");
        
        console.log("\n=== Deployment Summary ===");
        console.log("Factory:              ", address(factory));
        console.log("AgentPayyCore:        ", deployed.agentPayyCore);
        console.log("AttributionEngine:    ", deployed.attributionEngine);
        console.log("ReceiptManager:       ", deployed.receiptManager);
        console.log("APIRegistry:          ", deployed.apiRegistry);
        console.log("GovernanceTimelock:   ", deployed.governanceTimelock);
        console.log("Treasury:             ", treasury);
        console.log("Gnosis Safe:          ", gnosisSafe);
        
        // Generate environment variables
        generateEnvVars(chainId, deployed);
        
        // Generate Gnosis Safe setup instructions
        generateGnosisSafeInstructions(chainId, deployed, gnosisSafe);
        
        // Network-specific post-deployment setup
        handleNetworkSpecificSetup(chainId, deployed);
        
        console.log("\n=== Deployment Complete ===");
        console.log("SUCCESS: AgentPayy ecosystem deployed with governance!");
        console.log("All contracts are owned by the timelock, controlled by your Gnosis Safe.");
    }
    
    function getOrCreateGnosisSafe(uint256 chainId) internal view returns (address) {
        address existingSafe = gnosisSafeAddresses[chainId];
        if (existingSafe != address(0)) {
            return existingSafe;
        }
        
        // Try to get from environment
        address envSafe = vm.envOr("GNOSIS_SAFE_ADDRESS", address(0));
        if (envSafe != address(0)) {
            return envSafe;
        }
        
        console.log("\\n WARNING: No Gnosis Safe configured for this network!");
        console.log("Please create a Gnosis Safe first:");
        console.log("1. Go to https://app.safe.global/");
        console.log("2. Create a new Safe on", getNetworkName(chainId));
        console.log("3. Add your team members as signers");
        console.log("4. Set threshold (recommended: 2/3 or 3/5)");
        console.log("5. Set GNOSIS_SAFE_ADDRESS in your .env file");
        console.log("6. Re-run this deployment script");
        
        return address(0);
    }
    
    function getTimelockDelay(uint256 chainId) internal pure returns (uint256) {
        if (chainId == 1) {
            return 48 hours; // Ethereum mainnet - longer delay
        } else {
            return 24 hours; // L2s - shorter delay
        }
    }
    
    function generateSalt(uint256 chainId) internal view returns (string memory) {
        return string.concat("agentpayy-v1-", getNetworkName(chainId));
    }
    
    function getNetworkName(uint256 chainId) public pure returns (string memory) {
        if (chainId == 1) return "ethereum";
        if (chainId == 8453) return "base";
        if (chainId == 42161) return "arbitrum";
        if (chainId == 10) return "optimism";
        if (chainId == 1301) return "unichain";
        if (chainId == 480) return "worldchain";
        if (chainId == 59144) return "linea";
        if (chainId == 81457) return "blast";
        if (chainId == 534352) return "scroll";
        if (chainId == 1101) return "polygon_zkevm";
        if (chainId == 5000) return "mantle";
        return string.concat("unknown_", vm.toString(chainId));
    }
    
    function generateEnvVars(uint256 chainId, AgentPayyFactory.DeployedContracts memory deployed) internal view {
        string memory networkName = getNetworkName(chainId);
        string memory upperNetworkName = toUpper(networkName);
        
        console.log("\n=== Environment Variables ===");
        console.log("Add these to your .env file:");
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_FACTORY=", vm.toString(address(factory))));
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_CORE=", vm.toString(deployed.agentPayyCore)));
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_ATTRIBUTION=", vm.toString(deployed.attributionEngine)));
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_RECEIPTS=", vm.toString(deployed.receiptManager)));
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_REGISTRY=", vm.toString(deployed.apiRegistry)));
        console.log(string.concat("AGENTPAYY_", upperNetworkName, "_TIMELOCK=", vm.toString(deployed.governanceTimelock)));
    }
    
    function generateGnosisSafeInstructions(
        uint256 chainId, 
        AgentPayyFactory.DeployedContracts memory deployed,
        address gnosisSafe
    ) internal view {
        console.log("\n=== Gnosis Safe Setup Instructions ===");
        console.log("Your Gnosis Safe now controls all AgentPayy contracts through the timelock.");
        console.log("");
        console.log("To make changes to the contracts:");
        console.log("1. Go to your Gnosis Safe:", gnosisSafe);
        console.log("2. Create a new transaction to the timelock:", deployed.governanceTimelock);
        console.log("3. Use the timelock's schedule functions:");
        console.log("   - scheduleRoutine() for normal changes (24h delay)");
        console.log("   - scheduleEmergency() for urgent changes (1h delay)");
        console.log("4. Wait for the timelock delay");
        console.log("5. Execute the transaction");
        console.log("");
        console.log("Example: Change platform fee to 5%");
        console.log("Target:", deployed.agentPayyCore);
        console.log("Function: setPlatformFee(500)");
        console.log("Use scheduleRoutine() first, then execute after delay");
    }
    
    function handleNetworkSpecificSetup(uint256 chainId, AgentPayyFactory.DeployedContracts memory deployed) internal view {
        string memory networkName = getNetworkName(chainId);
        console.log(string.concat("\n=== ", networkName, " Specific Setup ==="));
        
        if (chainId == 1) {
            console.log("Ethereum Mainnet Deployment");
            console.log("- Higher gas costs expected");
            console.log("- 48-hour timelock delay for security");
            console.log("- Consider setting platform fee to 5% for mainnet");
            console.log("- Recommended: Enable premium features");
        } else if (chainId == 8453) {
            console.log("Base Deployment");
            console.log("- Low gas costs, fast transactions");
            console.log("- Perfect for consumer applications");
            console.log("- Consider Coinbase Smart Wallet integration");
            console.log("- Reach out to Base team for ecosystem support");
        } else if (chainId == 42161) {
            console.log("Arbitrum Deployment");
            console.log("- Leading L2 by TVL");
            console.log("- Great for DeFi integrations");
            console.log("- Fast finality and low costs");
            console.log("- Consider Arbitrum grant programs");
        } else if (chainId == 10) {
            console.log("Optimism Deployment");
            console.log("- Part of Superchain ecosystem");
            console.log("- Apply for Optimism grants");
            console.log("- Leverage OP Stack features");
            console.log("- Great for public goods funding");
        }
        
        // Show USDC address if available
        address usdcAddress = usdcAddresses[chainId];
        if (usdcAddress != address(0)) {
            console.log("USDC available at:", usdcAddress);
            console.log("Recommended: Pre-register USDC payment models");
        } else {
            console.log("WARNING: USDC address not configured for this network");
            console.log("Action required: Update USDC address when available");
        }
        
        console.log("\\nNext Steps:");
        console.log("1. Verify contracts on block explorer");
        console.log("2. Test with small transactions");
        console.log("3. Register your first API models");
        console.log("4. Update SDK with new contract addresses");
        console.log("5. Monitor timelock for any governance actions");
    }
    
    function toUpper(string memory str) internal pure returns (string memory) {
        bytes memory bStr = bytes(str);
        bytes memory bUpper = new bytes(bStr.length);
        for (uint i = 0; i < bStr.length; i++) {
            if ((uint8(bStr[i]) >= 97) && (uint8(bStr[i]) <= 122)) {
                bUpper[i] = bytes1(uint8(bStr[i]) - 32);
            } else {
                bUpper[i] = bStr[i];
            }
        }
        return string(bUpper);
    }
} 