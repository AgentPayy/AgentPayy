# Contributing to Unlock

Thank you for considering contributing to Unlock! This guide ensures high-quality, consistent contributions.

## Code of Conduct

1. Be respectful and constructive
2. Focus on technical merit
3. Help others learn
4. Assume good intent

## Development Principles

### No Assumptions or Placeholders

Use only provided or verifiable data. Never make up values like:
- Fake API endpoints
- Mock transaction hashes
- Placeholder addresses

Bad:
```typescript
const FACILITATOR = 'https://example.com';
```

Good:
```typescript
const FACILITATOR = process.env.FACILITATOR_URL || 'https://x402.coinbase.com';
```

### File Size Limits

Code must stay under 600 lines per file. Split logic into modules if needed.

When approaching limit:
1. Extract utilities to separate files
2. Split routes into multiple files
3. Create subdirectories for features

Example:
```
middleware.ts (590 lines) → Split into:
  middleware/index.ts
  middleware/verification.ts
  middleware/payment.ts
```

### Surgical Edits

Treat this as production code:
1. Minimize disruption to existing code
2. Consider impact on other components
3. Maintain backward compatibility
4. Add deprecation warnings before breaking changes

### Documentation Standards

Docs must be concise, complete, and technical:
1. No filler or vague commentary
2. Use numbered lists (no bullet points)
3. Include dates only in timelines
4. Provide working code examples

## Pull Request Process

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/unlock-x402.git
cd unlock-x402
git checkout -b feature/your-feature-name
```

### 2. Make Changes

1. Follow existing code style
2. Add comments for complex logic
3. Update relevant documentation
4. Test thoroughly

### 3. Test Changes

**Extension:**
```bash
cd extension
# Load unpacked in Chrome and test manually
```

**Publisher SDK:**
```bash
cd publisher-sdk
npm run build
npm test  # When tests added
```

**Demo Server:**
```bash
cd demo-server
npm run dev
# Test with extension
```

### 4. Commit

Use semantic commit messages:

```
feat: Add multi-facilitator support
fix: Resolve daily cap reset timing issue
docs: Update setup instructions for Windows
refactor: Extract verification logic to separate module
perf: Cache facilitator responses
test: Add payment flow E2E tests
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Create pull request on GitHub with:
1. Clear title
2. Description of changes
3. Screenshots (if UI changes)
4. Testing steps
5. Related issues

## Code Style

### TypeScript

1. Use strict mode
2. Explicit types (avoid `any`)
3. Interface over type alias
4. Prefer functional over class-based

Example:
```typescript
interface PaymentConfig {
  amount: string;
  network: 'base' | 'bnb';
}

async function processPayment(config: PaymentConfig): Promise<Receipt> {
  // Implementation
}
```

### JavaScript (Extension)

1. Use ES6+ features
2. Const over let, never var
3. Arrow functions for callbacks
4. Async/await over promises

Example:
```javascript
const handlePayment = async (request) => {
  const result = await submitTransaction(request);
  return result;
};
```

### File Organization

```
src/
  index.ts          # Public API exports
  types.ts          # Type definitions
  middleware.ts     # Core logic
  utils/            # Helper functions
    validation.ts
    formatting.ts
  __tests__/        # Test files
    middleware.test.ts
```

## Areas for Contribution

### High Priority

1. **Testing Infrastructure**
   - Unit tests for middleware
   - E2E tests for extension
   - Integration tests for facilitator API

2. **Multi-Wallet Support**
   - MetaMask connector
   - WalletConnect integration
   - Self-custody options

3. **Performance Optimization**
   - Payment caching
   - Verification result caching
   - Batch transaction processing

### Medium Priority

1. **Firefox/Safari Ports**
   - Manifest V2 for Firefox
   - Safari extension conversion

2. **Publisher Dashboard**
   - Analytics UI
   - Revenue tracking
   - Refund management

3. **Paylinks System**
   - Link shortener
   - Referral tracking
   - QR code generation

### Low Priority

1. **UI Enhancements**
   - Dark mode
   - Animations
   - Accessibility improvements

2. **Documentation**
   - Video tutorials
   - Interactive examples
   - API reference

## Testing Requirements

### Extension Tests

Required before merging:
1. Manual test of payment flow
2. Verification of receipt storage
3. Daily cap enforcement check
4. Auto-pay functionality test

### SDK Tests

Required before merging:
1. Route protection working
2. Payment verification accurate
3. Dynamic pricing functional
4. Error handling graceful

## Security Guidelines

### Extension

1. Never expose private keys
2. Validate all user inputs
3. Sanitize display of receipts
4. Use HTTPS only

### Server

1. Always verify payments server-side
2. Never trust X-PAYMENT headers alone
3. Implement rate limiting
4. Log security events

### Facilitator Integration

1. Use official endpoints only
2. Verify SSL certificates
3. Timeout requests (5 seconds max)
4. Handle errors gracefully

## Documentation Changes

### README Updates

When adding features:
1. Update feature list
2. Add usage examples
3. Update roadmap status

### Architecture Documentation

When changing core logic:
1. Update flow diagrams
2. Revise data schemas
3. Document new endpoints

### Setup Instructions

When changing dependencies:
1. Update installation steps
2. Revise environment variables
3. Add troubleshooting entries

## Issue Reporting

### Bug Reports

Include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Environment (browser, OS, extension version)
5. Console errors
6. Screenshots

Template:
```markdown
## Bug Description
Clear description of the bug.

## Reproduction Steps
1. Go to...
2. Click on...
3. See error

## Expected Behavior
What should happen.

## Actual Behavior
What actually happens.

## Environment
- Browser: Chrome 120
- OS: macOS 14
- Extension: v0.1.0

## Console Errors
```
error logs here
```

## Screenshots
[Attach here]
```

### Feature Requests

Include:
1. Use case
2. Proposed solution
3. Alternatives considered
4. Impact on existing features

## Review Process

### Code Review Checklist

Reviewers check:
1. ✓ Code follows style guide
2. ✓ No placeholders or mock data
3. ✓ Files under 600 lines
4. ✓ Documentation updated
5. ✓ Tests pass
6. ✓ No security vulnerabilities
7. ✓ Performance impact minimal

### Approval Requirements

1. One maintainer approval
2. All checks passing
3. No merge conflicts
4. Up-to-date with main branch

### Merge Strategy

1. Squash and merge for features
2. Rebase for hotfixes
3. Merge commits for releases

## Release Process

### Version Numbering

Follow semantic versioning:
- **Major (1.0.0):** Breaking changes
- **Minor (0.1.0):** New features
- **Patch (0.0.1):** Bug fixes

### Release Checklist

1. Update version in all package.json files
2. Update CHANGELOG.md
3. Run full test suite
4. Build production artifacts
5. Create GitHub release
6. Publish to Chrome Web Store
7. Publish SDK to npm
8. Announce on Discord/Twitter

## Communication

### Discord

1. #general - General discussion
2. #development - Technical questions
3. #contributions - PR discussions
4. #support - User help

### GitHub Discussions

Use for:
1. Feature proposals
2. Architecture debates
3. Roadmap planning

### Email

security@unlock.xyz for:
1. Security vulnerabilities
2. Responsible disclosure

## Recognition

Contributors featured in:
1. README contributors section
2. Release notes
3. Twitter shoutouts
4. Discord contributor role

## License

By contributing, you agree your code is licensed under MIT License.

---

**Thank you for helping unlock the web! 🔓**

