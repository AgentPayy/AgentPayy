# 🚀 AgentPayy Release Guide

## Automated Semantic Versioning & Publishing

AgentPayy uses semantic-release for automated versioning and publishing to npm and PyPI.

## Setup (One-time)

### 1. GitHub Secrets
Add these secrets to your GitHub repository:

```bash
# Required for npm publishing
NPM_TOKEN=npm_xxxxxxxxxxxxxxxx

# Required for PyPI publishing  
PYPI_TOKEN=pypi-xxxxxxxxxxxxxxxx

# GitHub token (usually auto-provided)
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxx
```

### 2. npm Token Setup
```bash
# Login to npm
npm login

# Create automation token
npm token create --type=automation

# Add to GitHub secrets as NPM_TOKEN
```

### 3. PyPI Token Setup
```bash
# Go to https://pypi.org/manage/account/token/
# Create new API token for entire account
# Add to GitHub secrets as PYPI_TOKEN
```

## How It Works

### Commit Message Format
Use conventional commits for automatic versioning:

```bash
# Patch release (0.1.0 → 0.1.1)
fix: resolve payment validation bug

# Minor release (0.1.0 → 0.2.0)  
feat: add attribution payment support

# Major release (0.1.0 → 1.0.0)
feat!: redesign SDK API
BREAKING CHANGE: payment method signatures changed
```

### Automatic Process
1. **Push to main** → Triggers release workflow
2. **Analyze commits** → Determines version bump
3. **Update versions** → All package.json and setup.py files
4. **Build packages** → TypeScript and Python SDKs
5. **Run tests** → Ensures quality
6. **Publish** → npm and PyPI simultaneously
7. **Create release** → GitHub release with changelog
8. **Update repo** → Commits version bumps

## Manual Release

### Test Release (Dry Run)
```bash
npm run release:dry-run
```

### Manual Version Bump
```bash
# Prepare specific version
npm run release:prepare 1.2.3

# Publish manually
npm run release:publish
```

## Release Types

### Patch (Bug Fixes)
```bash
git commit -m "fix: resolve contract validation issue"
# Results in: 1.0.0 → 1.0.1
```

### Minor (New Features)
```bash
git commit -m "feat: add reputation scoring system"
# Results in: 1.0.0 → 1.1.0
```

### Major (Breaking Changes)
```bash
git commit -m "feat!: redesign payment API

BREAKING CHANGE: payment methods now require explicit network parameter"
# Results in: 1.0.0 → 2.0.0
```

## Published Packages

### npm (TypeScript SDK)
```bash
npm install @agentpayy/sdk
```
- **Package**: `@agentpayy/sdk`
- **Registry**: https://www.npmjs.com/package/@agentpayy/sdk

### PyPI (Python SDK)
```bash
pip install agentpayy
```
- **Package**: `agentpayy`
- **Registry**: https://pypi.org/project/agentpayy/

## Troubleshooting

### Release Failed
1. Check GitHub Actions logs
2. Verify tokens are valid
3. Ensure tests pass locally
4. Check for version conflicts

### Package Not Published
1. Verify token permissions
2. Check package name availability
3. Ensure build succeeded
4. Review npm/PyPI logs

### Version Conflicts
```bash
# Reset to last good version
git reset --hard HEAD~1

# Fix issues and recommit
git commit -m "fix: resolve version conflict"
```

## Best Practices

### Before Major Release
1. **Update documentation**
2. **Test on multiple networks**
3. **Notify community of breaking changes**
4. **Prepare migration guide**

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Contract addresses configured
- [ ] Breaking changes documented
- [ ] Migration guide ready (if needed)

## Monitoring Releases

### GitHub Releases
- Automatic changelog generation
- Release notes from commit messages
- Tagged versions for easy reference

### Package Registries
- **npm**: Monitor download stats
- **PyPI**: Track installation metrics
- **GitHub**: Watch star/fork activity

## Emergency Procedures

### Unpublish Bad Release
```bash
# npm (within 24 hours)
npm unpublish @agentpayy/sdk@1.2.3

# PyPI (contact support)
# Cannot unpublish, must release patch
```

### Hotfix Release
```bash
# Create hotfix branch
git checkout -b hotfix/critical-fix

# Make fix
git commit -m "fix: critical security patch"

# Merge to main (triggers release)
git checkout main
git merge hotfix/critical-fix
```

## Success Metrics

### Release Health
- ✅ Automated releases working
- ✅ Both npm and PyPI publishing
- ✅ Tests passing consistently
- ✅ Documentation staying current

### Community Adoption
- 📈 Download/install metrics
- 🌟 GitHub stars and forks
- 💬 Community feedback and issues
- 🔄 Contribution activity

---

**Ready to release?** Just push to main with conventional commits! 🚀 