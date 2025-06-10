#!/bin/bash

# AgentPayKit Multichain Deployment Script
set -e

echo "🚀 AgentPayKit Multichain Deployment"
echo "=================================="

# Source .env file if it exists
if [ -f .env ]; then
    source .env
    echo "✅ Loaded environment variables"
else
    echo "❌ .env file not found. Please create one with your private key and API keys."
    exit 1
fi

# Check if private key exists
if [ -z "$PRIVATE_KEY" ]; then
    echo "❌ PRIVATE_KEY not found in .env file"
    exit 1
fi

# Deploy function
deploy_to_network() {
    local network=$1
    local rpc_key=$2
    
    echo ""
    echo "🌐 Deploying to $network..."
    echo "--------------------------------"
    
    # Deploy using forge script
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url $rpc_key \
        --broadcast \
        --verify \
        --etherscan-api-key $(eval echo \$${network^^}_API_KEY) \
        -vvvv
    
    if [ $? -eq 0 ]; then
        echo "✅ Successfully deployed to $network"
    else
        echo "❌ Failed to deploy to $network"
        return 1
    fi
}

# Tier 1 networks (high priority)
deploy_tier1() {
    echo "🏆 Deploying to Tier 1 networks..."
    deploy_to_network "base" "base"
    deploy_to_network "arbitrum" "arbitrum" 
    deploy_to_network "optimism" "optimism"
    deploy_to_network "ethereum" "ethereum"
}

# Tier 2 networks (emerging L2s)
deploy_tier2() {
    echo "🚀 Deploying to Tier 2 networks..."
    deploy_to_network "unichain" "unichain"
    deploy_to_network "worldchain" "worldchain"
    deploy_to_network "linea" "linea"
    deploy_to_network "blast" "blast"
}

# Tier 3 networks (additional L2s)
deploy_tier3() {
    echo "⚡ Deploying to Tier 3 networks..."
    deploy_to_network "scroll" "scroll"
    deploy_to_network "polygon_zkevm" "polygon_zkevm"
    deploy_to_network "mantle" "mantle"
}

# Parse command line arguments
case "${1:-all}" in
    "tier1")
        deploy_tier1
        ;;
    "tier2")
        deploy_tier2
        ;;
    "tier3")
        deploy_tier3
        ;;
    "all")
        deploy_tier1
        deploy_tier2 
        deploy_tier3
        ;;
    *)
        echo "Usage: $0 [tier1|tier2|tier3|all]"
        echo ""
        echo "  tier1: Deploy to Base, Arbitrum, Optimism, Ethereum"
        echo "  tier2: Deploy to Unichain, World Chain, Linea, Blast"
        echo "  tier3: Deploy to Scroll, Polygon zkEVM, Mantle"
        echo "  all:   Deploy to all networks (default)"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment complete!"
echo "Check the broadcast/ directory for transaction details." 