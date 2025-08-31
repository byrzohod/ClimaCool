# Contributing to ClimaCool

## Development Process

We use GitHub to host code, track issues and feature requests, and accept pull requests.

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Write tests** for any new functionality
3. **Ensure all tests pass** locally
4. **Update documentation** as needed
5. **Create a Pull Request** with a clear description

## Branch Naming Convention

- `feature/` - New features
- `bugfix/` - Bug fixes  
- `hotfix/` - Urgent production fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates

Examples:
- `feature/add-payment-gateway`
- `bugfix/fix-cart-calculation`
- `hotfix/critical-security-patch`

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Code follows the project's style guidelines
- [ ] Unit tests pass with >80% coverage
- [ ] Integration tests pass
- [ ] No breaking changes without discussion
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] PR description clearly explains the changes

## Code Review Process

All PRs require:
- Minimum 2 approvals from team members
- All CI checks passing
- No unresolved conversations
- Up-to-date with main branch

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting changes
- `refactor`: Code restructuring
- `perf`: Performance improvements
- `test`: Test additions/corrections
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes

## Testing Requirements

### Backend (.NET)
- Unit tests for all business logic
- Integration tests for API endpoints
- Minimum 80% code coverage

### Frontend (Angular)
- Component unit tests
- Service unit tests
- E2E tests for critical paths

## Code Style

### C# / .NET
- Follow Microsoft's C# coding conventions
- Use meaningful variable and method names
- Keep methods small and focused
- Use async/await for I/O operations

### TypeScript / Angular
- Follow Angular style guide
- Use TypeScript strict mode
- Implement proper error handling
- Use reactive forms over template-driven forms

## Definition of Done

A feature is considered "done" when:
- Code is written and reviewed
- Tests are written and passing
- Documentation is updated
- Code is deployed to staging
- Product owner has accepted the feature

## Reporting Issues

Use GitHub Issues to report bugs or request features:

### Bug Reports
Include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment details

### Feature Requests
Include:
- Problem statement
- Proposed solution
- Alternative solutions considered
- Mockups or examples if applicable

## Questions?

Feel free to open an issue for any questions about contributing.