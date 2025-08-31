# Branch Protection Rules Setup

To protect the `main` branch and enforce PR workflow, configure these settings in GitHub:

## Navigate to Settings

1. Go to https://github.com/byrzohod/ClimaCool
2. Click on **Settings** tab
3. Navigate to **Branches** in the left sidebar
4. Click **Add rule** or **Add branch protection rule**

## Configure Protection Rules for `main`

### Branch name pattern
- Enter: `main`

### Protect matching branches

#### ✅ Required Settings
- [x] **Require a pull request before merging**
  - [x] Require approvals: **2** (minimum)
  - [x] Dismiss stale pull request approvals when new commits are pushed
  - [x] Require review from CODEOWNERS (if applicable)

- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - Add these status checks (once CI/CD is set up):
    - `build`
    - `test`
    - `lint`
    - `security-scan`

- [x] **Require conversation resolution before merging**

- [x] **Require linear history** (optional - enforces clean commit history)

- [x] **Include administrators** (recommended for consistency)

#### ⚠️ Optional Settings
- [ ] **Require signed commits** (if team uses GPG signing)
- [ ] **Require deployments to succeed** (once deployment pipeline is ready)
- [ ] **Lock branch** (only for releases)
- [ ] **Restrict who can push to matching branches** (for larger teams)

### Rules for Feature Branches

No protection needed, but naming convention should be:
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes
- `chore/*` - Maintenance
- `docs/*` - Documentation

## GitHub Actions for PR Checks

Create `.github/workflows/pr-checks.yml` (coming in next PR):

```yaml
name: PR Checks

on:
  pull_request:
    branches: [ main ]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      # Will be implemented in infrastructure setup
```

## Additional Recommendations

1. **CODEOWNERS file**: Create `.github/CODEOWNERS` to require specific reviewers
2. **PR Templates**: Add `.github/pull_request_template.md` 
3. **Issue Templates**: Add `.github/ISSUE_TEMPLATE/` directory
4. **Automated Security**: Enable Dependabot in Security settings
5. **Branch Cleanup**: Enable automatic deletion of head branches after merge

## Manual Setup Required

Since these settings require GitHub UI access, please:

1. Go to repository settings
2. Apply the branch protection rules above
3. Enable the following in Settings:
   - **Security & Analysis**: Enable all security features
   - **General**: 
     - Disable "Allow merge commits" (keep only squash merge)
     - Enable "Automatically delete head branches"
   - **Actions**: Allow GitHub Actions

## Verification

After setup, test the protection:
1. Try pushing directly to main (should fail)
2. Create a feature branch and PR
3. Verify approval requirements work
4. Confirm status checks block merge (once CI/CD is added)