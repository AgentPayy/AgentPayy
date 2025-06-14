# Contributing to AgentPayy

## Project Structure

```
AgentPayy/
├── contracts/              # Smart contracts (Solidity)
├── sdk/
│   ├── typescript/         # Consolidated TypeScript SDK
│   │   └── src/
│   │       ├── core/       # Core utilities & types
│   │       ├── services/   # Payment & balance services
│   │       ├── wallet/     # Wallet adapters
│   │       ├── paywall/    # Express middleware
│   │       └── registry/   # API marketplace
│   └── python/             # Python SDK
├── cli/                    # Command-line tools
├── gateway/                # Gateway service
├── examples/               # Integration examples
└── docs/                   # Documentation
```

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.8+
- Foundry (for contracts)

### Quick Start
```bash
git clone https://github.com/agentpay/agentpay
cd agentpay

# Install dependencies
npm install

# Build TypeScript SDK
cd sdk/typescript
npm run build

# Run contract tests
cd ../../contracts
forge test
```

## Making Changes

### TypeScript SDK
All TypeScript code is now in `sdk/typescript/src/`:

```bash
cd sdk/typescript

# Install dependencies
npm install

# Run type checking
npm run type-check

# Build package
npm run build

# Run tests
npm test
```

### Smart Contracts
```bash
cd contracts

# Compile contracts
forge build

# Run tests
forge test

# Run specific test
forge test --match-test test_PayWithPrepaidBalance
```

### Python SDK
```bash
cd sdk/python

# Install in development mode
pip install -e .

# Run tests
python -m pytest

# Type checking
mypy agentpay/
```

## Code Standards

### TypeScript
- Use TypeScript strict mode
- Export types from `src/core/types.ts`
- Import from consolidated package: `import { AgentPayyKit } from '@agentpayy/sdk'`
- Follow existing patterns for new modules

### Solidity
- Use Foundry for testing
- Follow OpenZeppelin patterns
- Add comprehensive tests for new features
- Use NatSpec documentation

### Python
- Follow PEP 8
- Use type hints
- Add docstrings for public methods
- Maintain compatibility with Python 3.8+

## Testing

### Contract Tests
All contract functionality must have tests:
```bash
cd contracts
forge test --gas-report
```

### SDK Tests
Both SDKs should have comprehensive test coverage:
```bash
# TypeScript
cd sdk/typescript && npm test

# Python  
cd sdk/python && python -m pytest
```

## Documentation

### Update Documentation When:
- Adding new features
- Changing API interfaces
- Modifying installation process
- Adding new examples

### Documentation Files
- `README.md` - Main project overview
- `sdk/typescript/README.md` - TypeScript SDK guide
- `sdk/python/README.md` - Python SDK guide
- `AI_AGENT_GUIDE.md` - AI agent integration
- `ARCHITECTURE.md` - Technical architecture
- `DEPLOYMENT.md` - Deployment guide

## Pull Request Process

1. **Fork & Branch**: Create feature branch from `main`
2. **Develop**: Make changes following code standards
3. **Test**: Ensure all tests pass
4. **Document**: Update relevant documentation
5. **PR**: Submit pull request with clear description

### PR Checklist
- [ ] All contract tests pass (`forge test`)
- [ ] TypeScript builds without errors (`npm run build`)
- [ ] Python tests pass (`python -m pytest`)
- [ ] Documentation updated
- [ ] Examples work with changes
- [ ] No breaking changes (or clearly documented)

## Release Process

### Version Bumping
- Contracts: Update version in deployment scripts
- TypeScript SDK: Update `package.json` version
- Python SDK: Update `setup.py` version
- Documentation: Update version references

### Publishing
```bash
# TypeScript SDK
cd sdk/typescript
npm publish --access public

# Python SDK
cd sdk/python
python setup.py sdist bdist_wheel
twine upload dist/*
```

## Getting Help

- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Discord**: Join our developer community
- **Email**: dev@agentpay.org for private inquiries