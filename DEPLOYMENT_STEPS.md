# AgentPayy Base Deployment

## Quick Setup

1. **Create Gnosis Safe**: Go to https://app.safe.global/ and create a Safe on Base
2. **Setup environment**: `cp env.example .env` and fill in your values
3. **Deploy**: `forge script script/DeployBase.s.sol --rpc-url $BASE_RPC_URL --broadcast`

## Required Environment Variables

```bash
PRIVATE_KEY=0x...                    # Your deployer wallet private key
GNOSIS_SAFE_ADDRESS=0x...            # Your Gnosis Safe address
BASE_RPC_URL=https://mainnet.base.org # Free Base RPC
```

## Deployment Commands

```bash
cd contracts

# 1. Deploy contracts
forge script script/DeployBase.s.sol:DeployBase \
    --rpc-url $BASE_RPC_URL \
    --broadcast

# 2. Verify contracts (run the commands output by the script)
# The deployment script will give you the exact verification commands
```

The script will output all contract addresses and verification commands. 