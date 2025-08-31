## Description
<!-- Provide a brief description of the changes in this PR -->

## Type of Change
- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code refactoring
- [ ] ⚡ Performance improvement
- [ ] ✅ Test addition or update

## Related Issue
<!-- Link to the issue this PR addresses -->
Closes #

## Feature Being Implemented
<!-- If implementing a feature from FEATURE-SPECIFICATIONS.md, specify which one -->
- [ ] 1.1 User Registration and Authentication
- [ ] 1.2 Product Catalog with Categories
- [ ] 1.3 Product Search and Filtering
- [ ] 1.4 Shopping Cart Functionality
- [ ] 1.5 Basic Checkout Process
- [ ] 1.6 Order Management
- [ ] 1.7 Admin Product Management
- [ ] Other: _______________

## Success Criteria Checklist
<!-- Check all that apply from FEATURE-SUCCESS-CRITERIA.md -->

### General Requirements
- [ ] Code follows project conventions and patterns
- [ ] No linting errors or warnings
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG.md updated

### Testing Requirements
#### Backend Tests
- [ ] Unit tests written for all new code
- [ ] Integration tests written for API endpoints
- [ ] Database integration tests written (if applicable)
- [ ] All existing tests still pass
- [ ] Code coverage ≥ 80% for new code

#### Frontend Tests
- [ ] Unit tests written for components/services
- [ ] Component integration tests written
- [ ] E2E tests written for new user flows
- [ ] All existing tests still pass
- [ ] Code coverage ≥ 80% for new code

### Performance Requirements
- [ ] API response time < 200ms (p95)
- [ ] No N+1 database queries
- [ ] Frontend bundle size increase < 10KB (or justified)
- [ ] Lighthouse score > 90

### Security Requirements
- [ ] No security vulnerabilities introduced
- [ ] Input validation implemented
- [ ] Authentication/authorization properly handled
- [ ] No sensitive data in logs or responses

## Testing Evidence
<!-- Provide evidence that tests are passing -->

### Test Results
```
# Paste test execution results here
dotnet test results:
npm test results:
```

### Coverage Report
```
# Paste coverage summary here
Backend coverage: __%
Frontend coverage: __%
```

### Performance Testing
<!-- If applicable, provide performance test results -->
```
Response times:
Load test results:
```

## Screenshots
<!-- If applicable, add screenshots to help explain your changes -->

## Database Changes
<!-- List any database schema changes -->
- [ ] No database changes
- [ ] Migration script created
- [ ] Migration tested with rollback

## Deployment Notes
<!-- Any special deployment considerations -->
- [ ] No special deployment requirements
- [ ] Environment variables added/modified
- [ ] Configuration changes required
- [ ] Infrastructure changes needed

## Checklist Before Requesting Review
- [ ] Self-review completed
- [ ] Code builds without warnings
- [ ] All tests pass locally
- [ ] Branch is up to date with main
- [ ] Commits are logical and well-described
- [ ] PR title follows conventional commit format

## Reviewer Checklist
<!-- For reviewers to check -->
- [ ] Code quality and readability
- [ ] Test coverage adequate
- [ ] Performance impact acceptable
- [ ] Security considerations addressed
- [ ] Documentation sufficient
- [ ] Business logic correct

## Post-Merge Actions
- [ ] Deploy to staging environment
- [ ] Run smoke tests
- [ ] Monitor error rates
- [ ] Update project board

---
**Note**: This PR will not be merged until all CI checks pass and the success criteria from FEATURE-SUCCESS-CRITERIA.md are met.