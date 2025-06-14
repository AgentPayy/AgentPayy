# 📝 Commit Message Guide for Semantic Release

## Format
```
<type>: <description>

[optional body]

[optional footer]
```

## Types

### Patch Release (0.1.0 → 0.1.1)
```bash
fix: resolve payment validation bug
docs: update API documentation
perf: improve contract gas efficiency
```

### Minor Release (0.1.0 → 0.2.0)
```bash
feat: add attribution payment support
feat: implement reputation scoring
```

### Major Release (0.1.0 → 1.0.0)
```bash
feat!: redesign SDK API
BREAKING CHANGE: payment method signatures changed

# or

feat: redesign SDK API

BREAKING CHANGE: payment method signatures changed
```

## Examples

```bash
# Bug fix
git commit -m "fix: resolve contract validation issue"

# New feature
git commit -m "feat: add multi-chain support"

# Breaking change
git commit -m "feat!: redesign payment API

BREAKING CHANGE: payment methods now require explicit network parameter"

# Documentation
git commit -m "docs: add deployment guide"

# Performance improvement
git commit -m "perf: optimize gas usage in contracts"
```

## Ready to Release?
Just push to main with conventional commits and semantic-release will handle the rest! 🚀 