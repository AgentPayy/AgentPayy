# Contributing

## Setup
```bash
git clone https://github.com/YOUR_USERNAME/agentpay.git
cd agentpay
npm install
npm run build
npm test
```

## Development
- Smart contracts: `cd contracts && forge test`
- SDK: `cd sdk/typescript && npm test`
- Follow conventional commits: `feat(sdk): add feature`

## Pull Requests
- Add tests for new features
- Update docs
- Follow code style
- No breaking changes without discussion
      mockMode: true
    });
  });
  
  it('should initialize correctly', () => {
    expect(agentPay).toBeDefined();
  });
  
  it('should handle API calls', async () => {
    const result = await agentPay.callAPI(
      'https://api.example.com',
      { test: true },
      'test-model'
    );
    
    expect(result.response).toBeDefined();
    expect(result.cost).toBe('0.000 USDC (mock)');
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:contracts
npm run test:sdk
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## 📝 Code Style Guidelines

### General Principles

- **Clarity over cleverness** - Write code that's easy to understand
- **Consistency** - Follow existing patterns in the codebase
- **Documentation** - Comment complex logic and public APIs
- **Testing** - Write tests for new features and bug fixes

### Solidity Style

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title MyContract
 * @notice Brief description of what this contract does
 * @dev More detailed technical information
 */
contract MyContract is ReentrancyGuard {
    /// @notice State variable description
    uint256 public constant MAX_VALUE = 1000;
    
    /// @notice Mapping description
    mapping(address => uint256) public balances;
    
    /**
     * @notice Function description
     * @param param1 Description of parameter
     * @return Description of return value
     */
    function myFunction(uint256 param1) external nonReentrant returns (uint256) {
        require(param1 <= MAX_VALUE, "Value too high");
        
        // Implementation
        return param1 * 2;
    }
}
```

### TypeScript Style

```typescript
/**
 * Interface description
 */
export interface PaymentOptions {
  /** Maximum cost willing to pay */
  maxCost?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Additional headers */
  headers?: Record<string, string>;
}

/**
 * Class description
 */
export class AgentPayKit {
  private readonly config: AgentPayConfig;
  
  /**
   * Constructor description
   * @param config - Configuration options
   */
  constructor(config: AgentPayConfig) {
    this.config = config;
  }
  
  /**
   * Method description
   * @param apiUrl - The API endpoint URL
   * @param input - Input data for the API call
   * @param modelId - Registered model identifier
   * @param options - Optional configuration
   * @returns Promise resolving to API call result
   */
  async callAPI(
    apiUrl: string,
    input: any,
    modelId: string,
    options?: PaymentOptions
  ): Promise<CallAPIResult> {
    // Implementation
  }
}
```

### Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Format: type(scope): description

# Examples:
git commit -m "feat(sdk): add batch API call support"
git commit -m "fix(contracts): resolve reentrancy vulnerability"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(sdk): add integration tests for payment validation"
git commit -m "refactor(contracts): optimize gas usage in payment processing"
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Adding or updating tests
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

## 🔍 Code Review Process

### Before Submitting

- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] No sensitive information in code
- [ ] Performance impact considered

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### Review Criteria

Reviewers will check for:

- **Functionality** - Does the code work as intended?
- **Security** - Are there any security vulnerabilities?
- **Performance** - Is the code efficient?
- **Maintainability** - Is the code easy to understand and modify?
- **Testing** - Are there adequate tests?
- **Documentation** - Is the code properly documented?

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues to avoid duplicates
2. Test with the latest version
3. Gather relevant information

### Bug Report Template

```markdown
**Describe the Bug**
Clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Initialize AgentPay with '...'
2. Call method '...'
3. See error

**Expected Behavior**
What you expected to happen.

**Actual Behavior**
What actually happened.

**Environment**
- OS: [e.g., macOS 12.0]
- Node.js version: [e.g., 18.0.0]
- AgentPay version: [e.g., 1.0.0]
- Network: [e.g., base, arbitrum]

**Additional Context**
Any other context about the problem.

**Code Sample**
```typescript
// Minimal code sample that reproduces the issue
const agentPay = new AgentPayKit({...});
// ...
```
```

## 💡 Feature Requests

### Feature Request Template

```markdown
**Feature Description**
Clear description of the feature you'd like to see.

**Use Case**
Describe the problem this feature would solve.

**Proposed Solution**
Describe how you envision this feature working.

**Alternatives Considered**
Other solutions you've considered.

**Additional Context**
Any other context or screenshots.
```

## 📚 Documentation Contributions

### Types of Documentation

- **API Documentation** - Function/method documentation
- **Guides** - Step-by-step tutorials
- **Examples** - Code samples and integrations
- **Architecture** - System design documentation

### Documentation Style

- Use clear, concise language
- Include code examples
- Test all code samples
- Use consistent formatting
- Add diagrams where helpful

### Example Documentation

```markdown
## callAPI()

Pay for and execute an API call.

### Syntax

```typescript
await agentPay.callAPI(apiUrl, input, modelId, options?)
```

### Parameters

- `apiUrl` (string) - The API endpoint URL
- `input` (any) - Input data for the API call
- `modelId` (string) - Registered model identifier
- `options` (CallAPIOptions, optional) - Configuration options

### Returns

Promise<CallAPIResult> - The API response and payment details

### Example

```typescript
const result = await agentPay.callAPI(
  'https://api.weather.com/v1/current',
  { city: 'London' },
  'weather-api-v1',
  { maxCost: '0.01' }
);

console.log(result.response); // Weather data
console.log(result.cost);     // "0.005 USDC"
```

### Error Handling

```typescript
try {
  const result = await agentPay.callAPI(/* ... */);
} catch (error) {
  if (error.code === 'INSUFFICIENT_BALANCE') {
    // Handle insufficient balance
  }
}
```
```

## 🏆 Recognition

### Contributors

All contributors are recognized in:

- GitHub contributors list
- Release notes
- Documentation credits
- Community highlights

### Contribution Levels

- **First-time contributor** - Welcome package and mentorship
- **Regular contributor** - Special Discord role and early access
- **Core contributor** - Maintainer privileges and decision input
- **Expert contributor** - Technical advisory role

## 🤝 Community Guidelines

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive
- Help others learn and grow
- Embrace diverse perspectives
- Focus on what's best for the community

### Communication Channels

- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - General questions and ideas
- **Discord** - Real-time chat and community support
- **Email** - Private or sensitive matters

## 🚀 Getting Help

### For Contributors

- **Discord #contributors** - Chat with other contributors
- **GitHub Discussions** - Ask questions publicly
- **Mentorship Program** - Get paired with experienced contributors

### For Maintainers

- **Weekly sync calls** - Coordinate development efforts
- **Technical decisions** - Discuss architecture and design
- **Release planning** - Plan features and timelines

## 📋 Checklist for New Contributors

- [ ] Read this contributing guide
- [ ] Join our Discord community
- [ ] Set up development environment
- [ ] Run tests successfully
- [ ] Make a small first contribution (docs, tests, etc.)
- [ ] Introduce yourself in Discord
- [ ] Ask questions when stuck

## 🎯 Current Priorities

### High Priority

- [ ] Python SDK development
- [ ] Additional network integrations
- [ ] Performance optimizations
- [ ] Security audit preparations

### Medium Priority

- [ ] Advanced examples and tutorials
- [ ] Developer tooling improvements
- [ ] Documentation enhancements
- [ ] Community growth initiatives

### Low Priority

- [ ] Experimental features
- [ ] Nice-to-have improvements
- [ ] Long-term architectural changes

## 📞 Contact

- **General Questions**: [Discord](https://discord.gg/agentpay)
- **Technical Issues**: [GitHub Issues](https://github.com/agentpay/agentpay/issues)
- **Security Issues**: security@agentpay.org
- **Partnership Inquiries**: partnerships@agentpay.org

---

**Thank you for contributing to AgentPay!** 🙏

Together, we're building the future of API monetization. Every contribution, no matter how small, makes a difference.

*Happy coding! 🚀* 