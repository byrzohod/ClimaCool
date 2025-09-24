# Branch Protection Rules for ClimaCool

## ⚠️ CRITICAL: Branch Protection Not Currently Enabled

The `main` branch currently has **NO branch protection rules**, which allowed code with failing tests to be merged. This document outlines the required branch protection settings that must be configured.

## Required Branch Protection Settings for `main`

### 1. Go to Repository Settings
Navigate to: `Settings` → `Branches` → `Add rule`

### 2. Branch name pattern
- Pattern: `main`

### 3. Protect matching branches

#### ✅ Required Status Checks
**Check**: `Require status checks to pass before merging`
- **Required checks** (ALL must pass):
  - `Backend Build & Test`
  - `Customer Portal Build & Test`
  - `E2E Tests`
  - `Security Scan`
  - `Code Quality Check`

**Check**: `Require branches to be up to date before merging`

#### ✅ Require Pull Request Reviews
**Check**: `Require a pull request before merging`
- `Require approvals`: 1
- `Dismiss stale pull request approvals when new commits are pushed`: ✅
- `Require review from CODEOWNERS`: ✅ (if CODEOWNERS file exists)
- `Require approval of the most recent reviewable push`: ✅

#### ✅ Additional Protection
- `Require signed commits`: ✅ (recommended)
- `Require conversation resolution before merging`: ✅
- `Require deployments to succeed before merging`: ✅ (if deployments configured)
- `Lock branch`: ❌ (keep unchecked)
- `Do not allow bypassing the above settings`: ✅

#### ✅ Rules for Administrators
- `Include administrators`: ✅ (Administrators should also follow the rules)

### 4. Create the rule
Click `Create` to enable protection.

## Additional Recommended Branch Protection

### For `develop` branch (if using git-flow)
Similar to main but with slightly relaxed rules:
- Required status checks: Yes
- Required reviews: Optional
- Allow force pushes: No
- Allow deletions: No

### For `release/*` branches
- Required status checks: Yes
- Required reviews: 1
- Restrict who can push: Release managers only

## GitHub CLI Commands to Set Up Protection

You can also set up branch protection using the GitHub CLI:

```bash
# Set up branch protection for main
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Backend Build & Test","Customer Portal Build & Test","E2E Tests","Security Scan","Code Quality Check"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false \
  --field required_conversation_resolution=true
```

## Verification Checklist

After setting up branch protection, verify:

- [ ] Cannot push directly to main
- [ ] Cannot merge PR with failing tests
- [ ] Backend Build & Test is required
- [ ] Customer Portal Build & Test is required
- [ ] E2E Tests are required
- [ ] At least 1 approval is required
- [ ] Branch must be up to date with main
- [ ] Administrators cannot bypass rules

## Why This Matters

Without proper branch protection:
1. ❌ Code with compilation errors can be merged (as happened with the payment controller)
2. ❌ Failing tests don't block merges
3. ❌ No code review is enforced
4. ❌ Breaking changes can be pushed directly to main

With branch protection:
1. ✅ All tests must pass before merge
2. ✅ Code review is mandatory
3. ✅ Build must succeed
4. ✅ E2E tests verify full stack functionality
5. ✅ Security scans prevent vulnerable code

## Current Issues to Address

1. **Backend compilation errors were merged to main** - This should never happen with proper branch protection
2. **E2E tests don't actually test backend integration** - Fixed with new `full-stack-e2e.cy.ts` test suite
3. **No branch protection enabled** - Must be configured immediately

## Action Required

**Repository administrators must configure these branch protection rules immediately to prevent future issues.**