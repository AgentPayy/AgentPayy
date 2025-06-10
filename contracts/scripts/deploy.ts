import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  
  console.log(`🚀 Deploying AgentPayKit to ${network.name} (Chain ID: ${network.chainId})`);
  console.log(`Deployer address: ${deployer.address}`);
  console.log(`Deployer balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} ETH`);

  // Treasury address (can be changed per network)
  const treasuryAddress = process.env.TREASURY_ADDRESS || deployer.address;
  console.log(`Treasury address: ${treasuryAddress}`);

  // Deploy AgentPayKit contract
  console.log("\n📄 Deploying AgentPayKit contract...");
  const AgentPayKit = await ethers.getContractFactory("AgentPayKit");
  const agentPayKit = await AgentPayKit.deploy(treasuryAddress);
  await agentPayKit.waitForDeployment();

  const contractAddress = await agentPayKit.getAddress();
  console.log(`✅ AgentPayKit deployed to: ${contractAddress}`);

  // Get network info for environment variables
  const networkName = getNetworkName(network.chainId);
  const envVarName = `AGENTPAY_${networkName.toUpperCase()}_CONTRACT`;

  // Save deployment info
  const deploymentInfo = {
    network: networkName,
    chainId: Number(network.chainId),
    contractAddress,
    treasuryAddress,
    deployerAddress: deployer.address,
    deploymentTime: new Date().toISOString(),
    transactionHash: agentPayKit.deploymentTransaction()?.hash
  };

  // Write to deployments file
  const deploymentsPath = join(__dirname, "..", "deployments.json");
  let deployments: any = {};
  
  try {
    const existing = require(deploymentsPath);
    deployments = existing;
  } catch (error) {
    // File doesn't exist, start fresh
  }

  deployments[networkName] = deploymentInfo;
  writeFileSync(deploymentsPath, JSON.stringify(deployments, null, 2));

  console.log(`\n💾 Deployment info saved to deployments.json`);
  console.log(`\n🌐 Add this to your .env file:`);
  console.log(`${envVarName}=${contractAddress}`);

  // Network-specific post-deployment actions
  await handleNetworkSpecificSetup(agentPayKit, networkName, contractAddress);

  console.log(`\n🎉 Deployment complete!`);
  console.log(`Contract: ${contractAddress}`);
  console.log(`Network: ${networkName}`);
  console.log(`Chain ID: ${network.chainId}`);
}

function getNetworkName(chainId: bigint): string {
  const chainIdNum = Number(chainId);
  
  switch (chainIdNum) {
    case 1: return "ethereum";
    case 8453: return "base";
    case 42161: return "arbitrum";
    case 10: return "optimism";
    case 1301: return "unichain";
    case 480: return "worldchain";
    case 59144: return "linea";
    case 81457: return "blast";
    case 534352: return "scroll";
    case 1101: return "polygon-zkevm";
    case 5000: return "mantle";
    default: return `unknown-${chainIdNum}`;
  }
}

async function handleNetworkSpecificSetup(contract: any, networkName: string, contractAddress: string) {
  console.log(`\n⚙️  Setting up ${networkName}-specific configuration...`);

  switch (networkName) {
    case "ethereum":
      console.log("💰 Ethereum mainnet - Higher gas costs expected");
      console.log("🔧 Consider setting platform fee to 5% for mainnet");
      break;
      
    case "base":
      console.log("🔵 Base - Coinbase's L2, great for consumer apps");
      console.log("💡 Consider reaching out to Base team for ecosystem support");
      break;
      
    case "arbitrum":
      console.log("🔷 Arbitrum - Leading L2 by TVL");
      console.log("💡 Consider integrating with major Arbitrum DeFi protocols");
      break;
      
    case "optimism":
      console.log("🔴 Optimism - Part of Superchain ecosystem");
      console.log("💡 Consider applying for Optimism grants");
      break;
      
    case "unichain":
      console.log("🦄 Unichain - Uniswap's dedicated L2");
      console.log("💡 Perfect for DeFi integrations and DEX functionality");
      break;
      
    case "worldchain":
      console.log("🌍 World Chain - World ID integration available");
      console.log("💡 Consider human verification features");
      break;
      
    case "linea":
      console.log("🟢 Linea - ConsenSys zkEVM");
      console.log("💡 Strong developer tooling ecosystem");
      break;
      
    case "blast":
      console.log("💥 Blast - Native yield for ETH and stablecoins");
      console.log("💡 Leverage native yield features for enhanced UX");
      break;
      
    case "scroll":
      console.log("📜 Scroll - Security-focused zkEVM");
      console.log("💡 Emphasize security in marketing");
      break;
      
    case "polygon-zkevm":
      console.log("🔺 Polygon zkEVM - Ethereum equivalent");
      console.log("💡 Tap into large Polygon ecosystem");
      break;
      
    case "mantle":
      console.log("🌐 Mantle - Modular architecture");
      console.log("💡 Focus on high-throughput applications");
      break;
  }

  // Check USDC deployment on this network
  const usdcAddresses: { [key: string]: string } = {
    ethereum: "0xA0b86a33E6441b8aA0de8E7c8b3f3B2c7D43C9A7",
    base: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    arbitrum: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    optimism: "0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85",
    linea: "0x176211869cA2b568f2A7D4EE941E073a821EE1ff",
    blast: "0x4300000000000000000000000000000000000003",
    scroll: "0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4",
    "polygon-zkevm": "0xA8CE8aee21bC2A48a5EF670afCc9274C7bbbC035",
    mantle: "0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9"
  };

  const usdcAddress = usdcAddresses[networkName];
  if (usdcAddress) {
    console.log(`💵 USDC available at: ${usdcAddress}`);
  } else {
    console.log(`⚠️  USDC address not configured for ${networkName}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 