# AgentPayKit Deployment Guide

## Week 1-2: Foundation Setup

### Prerequisites

- Node.js 18+
- Redis instance
- Private keys for Base and Arbitrum
- USDC on target networks

### 1. Deploy Smart Contracts

```bash
cd contracts
npm install
cp .env.example .env
# Edit .env with your private key and API keys

# Deploy to Base
npm run deploy:base

# Deploy to Arbitrum  
npm run deploy:arbitrum
```

### 2. Start Gateway

```bash
cd gateway
npm install
cp .env.example .env
# Edit .env with:
# - REDIS_URL
# - AGENTPAY_BASE_CONTRACT (from step 1)
# - AGENTPAY_ARBITRUM_CONTRACT (from step 1)

npm run build
npm start
```

### 3. Install CLI

```bash
cd cli
npm install
npm run build
npm link

# Test CLI
agentpay --help
```

### 4. Register Demo API

```bash
# Start weather API example
cd examples/weather-api
node index.js

# In another terminal, register it
export PRIVATE_KEY="your-private-key"
agentpay register
# Follow prompts:
# Model ID: weather-v1
# Endpoint: http://localhost:3001/weather
# Price: 0.005
```

### 5. Test Payment Flow

```typescript
import { AgentPayKit } from '@agentpay/sdk';
import { ethers } from 'ethers';

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const agentpay = new AgentPayKit(wallet, 'base');

// Make paid API call
const result = await agentpay.payAndCall('weather-v1', 
  { city: 'NYC' }, 
  { price: '0.005' }
);

console.log(result);
```

## Environment Variables

```bash
# .env for all components
PRIVATE_KEY=your-ethereum-private-key
REDIS_URL=redis://localhost:6379
AGENTPAY_BASE_CONTRACT=0x...
AGENTPAY_ARBITRUM_CONTRACT=0x...
AGENTPAY_GATEWAY_URL=http://localhost:3000
```

## Network Addresses

### Base Mainnet
- USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`
- AgentPayKit: TBD (deploy first)

### Arbitrum One  
- USDC: `0xaf88d065e77c8cC2239327C5EDb3A432268e5831`
- AgentPayKit: TBD (deploy first)

## Next Steps (Week 3-4)

1. Python SDK development
2. CrewAI integration  
3. LangChain wrapper
4. Cross-chain routing
5. Enhanced gateway features

## Support

For issues or questions:
- GitHub Issues: Link to repo
- Discord: Link to community  
- Docs: Link to documentation 

# AgentPayKit Production Deployment Checklist

This document outlines the steps required to deploy AgentPayKit to production (mainnet).

## ✅ Pre-Deployment Checklist

### 1. Smart Contract Deployment
- [ ] **Deploy to Base Mainnet**
  ```bash
  cd contracts
  npm run deploy:base:mainnet
  ```
  - Contract address: `_______________`
  - Verification: `_______________`

- [ ] **Deploy to Arbitrum One**
  ```bash
  npm run deploy:arbitrum:mainnet
  ```
  - Contract address: `_______________`
  - Verification: `_______________`

- [ ] **Deploy to Optimism**
  ```bash
  npm run deploy:optimism:mainnet
  ```
  - Contract address: `_______________`
  - Verification: `_______________`

### 2. Update Contract Addresses
- [ ] **TypeScript SDK** (`sdk/typescript/src/index.ts`)
  ```typescript
  const CONTRACTS = {
    base: '0x_CONTRACT_ADDRESS_BASE_',
    arbitrum: '0x_CONTRACT_ADDRESS_ARBITRUM_',
    optimism: '0x_CONTRACT_ADDRESS_OPTIMISM_'
  };
  ```

- [ ] **Python SDK** (`sdk/python/agentpay/__init__.py`)
  ```python
  NETWORKS = {
    "base": {
      "contract": "0x_CONTRACT_ADDRESS_BASE_"
    },
    "arbitrum": {
      "contract": "0x_CONTRACT_ADDRESS_ARBITRUM_"
    }
  }
  ```

### 3. Infrastructure Setup
- [ ] **Deploy Gateway to Production**
  - Service: AWS ECS / Google Cloud Run / Railway
  - Domain: `gateway.agentpay.dev`
  - SSL Certificate: Configured
  - Environment Variables:
    ```bash
    AGENTPAY_BASE_CONTRACT=0x...
    AGENTPAY_ARBITRUM_CONTRACT=0x...
    REDIS_URL=redis://prod-redis:6379
    PORT=3000
    ALLOWED_ORIGINS=https://agentpay.dev,https://docs.agentpay.dev
    ```

- [ ] **Redis Production Instance**
  - Provider: AWS ElastiCache / Upstash / Railway
  - Memory: 1GB minimum
  - Persistence: Enabled
  - Backup: Daily snapshots

- [ ] **Domain & DNS Setup**
  - Main site: `agentpay.dev`
  - Gateway: `gateway.agentpay.dev`
  - Docs: `docs.agentpay.dev`
  - CDN: Cloudflare configured

### 4. SDK Publishing
- [ ] **TypeScript SDK to NPM**
  ```bash
  cd sdk/typescript
  npm version 1.0.0
  npm login
  npm publish --access public
  ```
  - Package: `@agentpay/sdk@1.0.0`
  - Downloads: Track on NPM

- [ ] **Python SDK to PyPI**
  ```bash
  cd sdk/python
  python setup.py sdist bdist_wheel
  twine upload dist/*
  ```
  - Package: `agentpay@1.0.0`
  - Downloads: Track on PyPI

- [ ] **CLI Tool to NPM**
  ```bash
  cd cli
  npm version 1.0.0
  npm publish --access public
  ```
  - Package: `@agentpay/cli@1.0.0`

### 5. Security & Monitoring
- [ ] **Smart Contract Audits**
  - Audit firm: `_______________`
  - Audit report: `_______________`
  - Issues resolved: `_______________`

- [ ] **Infrastructure Security**
  - Rate limiting: 100 req/15min per IP
  - DDoS protection: Cloudflare enabled
  - API key rotation: Monthly
  - Environment secrets: Vault storage

- [ ] **Monitoring Setup**
  - Application monitoring: DataDog / New Relic
  - Blockchain monitoring: Alchemy webhooks
  - Error tracking: Sentry
  - Uptime monitoring: PingDom
  - Alerting: PagerDuty / Slack

### 6. Documentation & Website
- [ ] **Production Documentation**
  - Website: `https://agentpay.dev`
  - Docs: `https://docs.agentpay.dev`
  - API Reference: Swagger UI live
  - Code examples: All working

- [ ] **Legal Pages**
  - Terms of Service
  - Privacy Policy
  - API Terms
  - DMCA Policy

## 🚀 Launch Activities

### 1. Soft Launch (Week 1)
- [ ] **Beta Testing**
  - Invite 20 beta developers
  - Test all integrations
  - Collect feedback
  - Fix critical issues

- [ ] **Community Setup**
  - Discord server: Created & moderated
  - Twitter account: @AgentPayKit
  - GitHub discussions: Enabled
  - Email newsletter: ConvertKit setup

### 2. Public Launch (Week 2)
- [ ] **HackerNews Post**
  - Title: "Show HN: AgentPayKit – Pay-per-call APIs for AI agents"
  - Post time: Tuesday 9 AM PST
  - Engagement: Monitor & respond

- [ ] **ProductHunt Launch**
  - Product page: Live
  - Launch date: Wednesday
  - Maker comments: Prepared
  - Community notification: 48h advance

- [ ] **Social Media Blitz**
  - Twitter thread: 8-part launch story
  - LinkedIn article: Technical deep-dive
  - Reddit posts: r/MachineLearning, r/webdev
  - Dev.to article: Tutorial & case studies

### 3. Partnership Outreach
- [ ] **AI Framework Integrations**
  - CrewAI: Partnership discussion
  - LangChain: Integration showcase
  - AutoGPT: Plugin development
  - Semantic Kernel: Example apps

- [ ] **Infrastructure Partnerships**
  - Alchemy: Node provider discount
  - Coinbase: Base ecosystem support
  - Arbitrum: Grant application
  - OpenAI: API credits partnership

## 📊 Success Metrics (Month 1)

### Usage Targets
- [ ] **Developers**: 500 registered developers
- [ ] **APIs**: 100 registered API endpoints
- [ ] **Transactions**: 10,000 payments processed
- [ ] **Volume**: $1,000 total payment volume
- [ ] **Revenue**: $100 platform fees collected

### Technical Metrics
- [ ] **Uptime**: 99.9% gateway availability
- [ ] **Response Time**: <2s average API response
- [ ] **Error Rate**: <1% failed transactions
- [ ] **Security**: Zero critical vulnerabilities

### Community Metrics
- [ ] **GitHub**: 1,000 stars
- [ ] **Discord**: 500 members
- [ ] **Twitter**: 2,000 followers
- [ ] **Newsletter**: 1,000 subscribers

## 🔍 Post-Launch Monitoring

### Daily Checks
- [ ] Gateway health & uptime
- [ ] Transaction processing rate
- [ ] Error logs & debugging
- [ ] Community engagement

### Weekly Reviews
- [ ] Usage analytics & trends
- [ ] Revenue & fee collection
- [ ] User feedback analysis
- [ ] Security incident review

### Monthly Planning
- [ ] Feature roadmap updates
- [ ] Partnership progress
- [ ] Marketing campaign results
- [ ] Technical debt assessment

## 🚨 Emergency Procedures

### Smart Contract Issues
1. **Pause contract** (if pause functionality exists)
2. **Notify users** via Discord/Twitter
3. **Deploy fix** or migration contract
4. **Resume operations** after testing

### Gateway Downtime
1. **Switch to backup** gateway instance
2. **Check Redis** connectivity
3. **Review logs** for root cause
4. **Scale resources** if needed

### Security Incidents
1. **Assess impact** immediately
2. **Contain threat** (rate limits, IP blocks)
3. **Notify users** if data affected
4. **Implement fix** and monitor

## 📝 Launch Day Timeline

### T-24 Hours
- [ ] Final system checks
- [ ] Content scheduled
- [ ] Team briefing
- [ ] Monitoring active

### T-0 (Launch)
- [ ] HackerNews post goes live
- [ ] Social media activation
- [ ] Discord announcement
- [ ] Team monitoring

### T+4 Hours
- [ ] Initial metrics review
- [ ] Community engagement
- [ ] Bug triage
- [ ] Press outreach

### T+24 Hours
- [ ] Launch recap & metrics
- [ ] User feedback collection
- [ ] Issue prioritization
- [ ] Next day planning

---

**Status**: 🚧 Ready for deployment  
**Last Updated**: Production checklist created  
**Owner**: Engineering Team  
**Review Date**: Pre-launch (TBD) 