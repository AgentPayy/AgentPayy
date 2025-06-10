# AgentPayKit Test Suite

A comprehensive testing framework for the entire AgentPayKit ecosystem covering smart contracts, SDKs, gateway, CLI, and end-to-end workflows.

## 🏗️ Test Architecture

### Test Levels

1. **Unit Tests** - Individual component testing
2. **Integration Tests** - Component interaction testing  
3. **Contract Tests** - Smart contract functionality
4. **E2E Tests** - Full user workflow testing
5. **Multichain Tests** - Cross-chain functionality
6. **Performance Tests** - Load and stress testing

### Test Structure

```
tests/
├── unit/                   # Unit tests for individual components
│   ├── contracts/          # Smart contract unit tests (Foundry)
│   ├── sdk/               # SDK unit tests
│   ├── gateway/           # Gateway unit tests
│   └── cli/               # CLI unit tests
├── integration/           # Integration tests
│   ├── sdk-gateway/       # SDK + Gateway integration
│   ├── contract-sdk/      # Contract + SDK integration
│   └── full-stack/        # Multi-component integration
├── e2e/                   # End-to-end tests
│   ├── workflows/         # Complete user workflows
│   ├── multichain/        # Cross-chain scenarios
│   └── performance/       # Load and stress tests
├── fixtures/              # Test data and mocks
├── utils/                 # Test utilities
└── scripts/               # Test automation scripts
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:all
```

### Run Specific Test Categories
```bash
npm run test:contracts     # Smart contract tests
npm run test:sdk          # SDK tests
npm run test:gateway      # Gateway tests
npm run test:cli          # CLI tests
npm run test:integration  # Integration tests
npm run test:e2e          # End-to-end tests
npm run test:performance  # Performance tests
```

### Run Multichain Tests
```bash
npm run test:multichain:local    # Local testnet
npm run test:multichain:testnet  # Live testnets
```

## 📋 Test Categories

### 1. Smart Contract Tests (Foundry)

- **Unit Tests**: Individual contract functions
- **Integration Tests**: Contract interactions
- **Fuzz Tests**: Property-based testing
- **Invariant Tests**: System-wide invariants
- **Gas Tests**: Gas optimization verification

### 2. SDK Tests (Vitest)

- **TypeScript SDK**: Core functionality, error handling
- **Python SDK**: Feature parity, type safety
- **Consumer SDK**: Payment flows, wallet integration
- **Paywall SDK**: Content protection, access control

### 3. Gateway Tests (Jest)

- **API Endpoints**: Request/response validation
- **Middleware**: Authentication, rate limiting
- **Database**: Data persistence, migrations
- **External APIs**: Third-party integrations

### 4. CLI Tests (Bats)

- **Commands**: All CLI commands and flags
- **Configuration**: Config file handling
- **Deployment**: Contract deployment flows
- **Error Handling**: Invalid inputs, network errors

### 5. Integration Tests

- **SDK + Gateway**: Payment processing flows
- **Contract + SDK**: On-chain transaction handling
- **CLI + Gateway**: Deployment and management
- **Multi-component**: Complex workflows

### 6. E2E Tests (Playwright)

- **User Workflows**: Complete payment journeys
- **Admin Workflows**: Model registration, fee management
- **Error Scenarios**: Network failures, insufficient funds
- **Cross-browser**: Browser compatibility testing

### 7. Performance Tests (Artillery/K6)

- **Load Testing**: High concurrent user scenarios
- **Stress Testing**: System breaking points
- **Spike Testing**: Traffic spike handling
- **Volume Testing**: Large dataset processing

## 🛠️ Test Tools

- **Foundry**: Smart contract testing
- **Vitest**: Fast unit testing for TypeScript
- **Jest**: Node.js application testing
- **Playwright**: End-to-end browser testing
- **Bats**: Bash/CLI testing
- **Artillery**: Load testing
- **Docker**: Test environment isolation

## 📊 Coverage Requirements

- **Smart Contracts**: 95%+ code coverage
- **SDK**: 90%+ code coverage
- **Gateway**: 85%+ code coverage
- **CLI**: 80%+ code coverage
- **Integration**: Critical path coverage
- **E2E**: Key user journey coverage

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to main branch
- Scheduled nightly runs
- Pre-deployment validation

## 📈 Test Reporting

- Coverage reports
- Performance benchmarks
- Gas usage reports
- Cross-chain compatibility matrix
- Test execution metrics 