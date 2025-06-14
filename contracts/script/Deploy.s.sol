// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {AgentPayCore} from "../src/AgentPayCore.sol";
import {AttributionEngine} from "../src/AttributionEngine.sol";
import {ReceiptManager} from "../src/ReceiptManager.sol";

contract DeployScript is Script {
    AgentPayCore public agentPayCore;
    AttributionEngine public attributionEngine;
    ReceiptManager public receiptManager;
    
    // USDC addresses by chain
    mapping(uint256 => address) public usdcAddresses;
    
    function setUp() public {
        // Initialize USDC addresses (official Circle addresses, properly checksummed)
        usdcAddresses[1] = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // Ethereum
        usdcAddresses[8453] = 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913; // Base
        usdcAddresses[42161] = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831; // Arbitrum
        usdcAddresses[10] = 0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85; // Optimism
        usdcAddresses[59144] = 0x176211869cA2b568f2A7D4EE941E073a821EE1ff; // Linea
        // Note: Some chains may not have official USDC yet
        usdcAddresses[81457] = address(0); // Blast - check official deployment
        usdcAddresses[534352] = address(0); // Scroll - check official deployment  
        usdcAddresses[1101] = address(0); // Polygon zkEVM - check official deployment
        usdcAddresses[5000] = address(0); // Mantle - check official deployment
    }
    
    function run() public {
        // Get deployment parameters
        address treasuryAddress = vm.envOr("TREASURY_ADDRESS", msg.sender);
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        uint256 chainId = block.chainid;
        
        console.log("=== AgentPay Modular Deployment ===");
        console.log("Chain ID:", chainId);
        console.log("Network:", getNetworkName(chainId));
        console.log("Treasury:", treasuryAddress);
        console.log("Deployer:", vm.addr(deployerPrivateKey));
        console.log("Balance:", vm.addr(deployerPrivateKey).balance);
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy core contracts
        console.log("\n=== Deploying Core Contracts ===");
        
        console.log("1. Deploying AgentPayCore...");
        agentPayCore = new AgentPayCore(treasuryAddress);
        console.log("   [OK] AgentPayCore deployed:", address(agentPayCore));
        
        console.log("2. Deploying AttributionEngine...");
        attributionEngine = new AttributionEngine(address(agentPayCore), treasuryAddress);
        console.log("   [OK] AttributionEngine deployed:", address(attributionEngine));
        
        console.log("3. Deploying ReceiptManager...");
        receiptManager = new ReceiptManager(vm.addr(deployerPrivateKey));
        console.log("   [OK] ReceiptManager deployed:", address(receiptManager));
        
        // Link contracts
        console.log("\n=== Linking Contracts ===");
        
        console.log("4. Setting AttributionEngine in AgentPayCore...");
        agentPayCore.setAttributionEngine(address(attributionEngine));
        console.log("   [OK] AttributionEngine linked");
        
        console.log("5. Setting ReceiptManager in AgentPayCore...");
        agentPayCore.setReceiptManager(address(receiptManager));
        console.log("   [OK] ReceiptManager linked");
        
        vm.stopBroadcast();
        
        console.log("\n=== Deployment Summary ===");
        console.log("AgentPayCore:      ", address(agentPayCore));
        console.log("AttributionEngine: ", address(attributionEngine));
        console.log("ReceiptManager:    ", address(receiptManager));
        console.log("Treasury:          ", treasuryAddress);
        
        // Network-specific setup
        handleNetworkSpecificSetup(chainId);
        
        // Generate environment variables
        string memory networkName = getNetworkName(chainId);
        string memory upperNetworkName = toUpper(networkName);
        
        console.log("\n=== Environment Variables ===");
        console.log("Add these to your .env file:");
        console.log(string.concat("AGENTPAY_", upperNetworkName, "_CORE=", vm.toString(address(agentPayCore))));
        console.log(string.concat("AGENTPAY_", upperNetworkName, "_ATTRIBUTION=", vm.toString(address(attributionEngine))));
        console.log(string.concat("AGENTPAY_", upperNetworkName, "_RECEIPTS=", vm.toString(address(receiptManager))));
        
        // Generate deployment JSON for gateway
        console.log("\n=== Gateway Configuration ===");
        console.log("Add this to your gateway config:");
        console.log("{");
        console.log(string.concat('  "', networkName, '": {'));
        console.log(string.concat('    "agentPayCore": "', vm.toString(address(agentPayCore)), '",'));
        console.log(string.concat('    "attributionEngine": "', vm.toString(address(attributionEngine)), '",'));
        console.log(string.concat('    "receiptManager": "', vm.toString(address(receiptManager)), '"'));
        console.log("  }");
        console.log("}");
        
        console.log("\n=== Deployment Complete ===");
        console.log("SUCCESS: All contracts deployed and linked successfully!");
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
    
    function handleNetworkSpecificSetup(uint256 chainId) internal view {
        string memory networkName = getNetworkName(chainId);
        console.log(string.concat("\n=== ", networkName, " Setup ==="));
        
        if (chainId == 1) {
            console.log("Ethereum mainnet - Higher gas costs expected");
            console.log("Consider setting platform fee to 5% for mainnet");
            console.log("Recommended: Enable premium features for mainnet users");
        } else if (chainId == 8453) {
            console.log("Base - Coinbase's L2, great for consumer apps");
            console.log("Consider reaching out to Base team for ecosystem support");
            console.log("Recommended: Integrate with Coinbase Smart Wallet");
        } else if (chainId == 42161) {
            console.log("Arbitrum - Leading L2 by TVL");
            console.log("Consider integrating with major Arbitrum DeFi protocols");
            console.log("Recommended: Leverage Arbitrum's fast finality");
        } else if (chainId == 10) {
            console.log("Optimism - Part of Superchain ecosystem");
            console.log("Consider applying for Optimism grants");
            console.log("Recommended: Integrate with OP Stack features");
        } else if (chainId == 1301) {
            console.log("Unichain - Uniswap's dedicated L2");
            console.log("Perfect for DeFi integrations and DEX functionality");
            console.log("Recommended: Integrate with Uniswap V4 hooks");
        } else if (chainId == 480) {
            console.log("World Chain - World ID integration available");
            console.log("Consider human verification features");
            console.log("Recommended: Implement World ID for reputation");
        } else if (chainId == 59144) {
            console.log("Linea - ConsenSys zkEVM");
            console.log("Strong developer tooling ecosystem");
            console.log("Recommended: Leverage zkEVM privacy features");
        } else if (chainId == 81457) {
            console.log("Blast - Native yield for ETH and stablecoins");
            console.log("Leverage native yield features for enhanced UX");
            console.log("Recommended: Auto-compound user balances");
        } else if (chainId == 534352) {
            console.log("Scroll - Security-focused zkEVM");
            console.log("Emphasize security in marketing");
            console.log("Recommended: Highlight zero-knowledge proofs");
        } else if (chainId == 1101) {
            console.log("Polygon zkEVM - Ethereum equivalent");
            console.log("Tap into large Polygon ecosystem");
            console.log("Recommended: Cross-chain with Polygon PoS");
        } else if (chainId == 5000) {
            console.log("Mantle - Modular architecture");
            console.log("Focus on high-throughput applications");
            console.log("Recommended: Utilize modular DA layer");
        }
        
        // Show USDC address if available
        address usdcAddress = usdcAddresses[chainId];
        if (usdcAddress != address(0)) {
            console.log("USDC available at:", usdcAddress);
            console.log("Recommended: Pre-register USDC models");
        } else {
            console.log("WARNING: USDC address not configured for this network");
            console.log("Action required: Update USDC address when available");
        }
        
        // Gas optimization recommendations
        if (chainId == 1) {
            console.log("Gas optimization: Consider batch operations");
        } else {
            console.log("Low gas costs: Can afford more complex operations");
        }
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