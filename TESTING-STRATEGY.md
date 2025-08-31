# ClimaCool Testing Strategy

## Testing Philosophy

We follow the **Testing Pyramid** approach with comprehensive coverage at all levels:
- **Many** Unit Tests (fast, isolated, focused)
- **Some** Integration Tests (API, database, service integration)
- **Few** E2E Tests (critical user journeys)

**Goal**: Catch bugs early, ensure reliability, maintain confidence in deployments.

## Testing Levels

### 1. Unit Tests
**Purpose**: Test individual components in isolation
**Target Coverage**: ≥ 80%
**Execution Time**: < 1 second per test
**Run Frequency**: On every code change

#### Backend Unit Tests
- Test services, utilities, domain logic
- Mock all external dependencies
- Use in-memory database for repositories
- Test edge cases and error conditions

#### Frontend Unit Tests
- Test components, services, pipes, directives
- Mock HTTP calls and external services
- Test component logic and rendering
- Test form validations and user interactions

### 2. Integration Tests
**Purpose**: Test component interactions with real dependencies
**Target Coverage**: ≥ 70%
**Execution Time**: < 10 seconds per test
**Run Frequency**: On every commit

#### Backend Integration Tests
- Use real PostgreSQL database (TestContainers)
- Test complete API endpoints
- Include authentication/authorization
- Test database transactions
- Verify data persistence

#### Frontend Integration Tests
- Test component integration
- Test service interactions
- Test routing and navigation
- Mock only external APIs

### 3. End-to-End Tests
**Purpose**: Test complete user workflows
**Target Coverage**: Critical paths only
**Execution Time**: < 30 seconds per test
**Run Frequency**: Before merge to main

#### E2E Test Scenarios
- User registration and login
- Product search and browse
- Add to cart and checkout
- Order placement
- Admin product management

### 4. Performance Tests
**Purpose**: Ensure system meets performance requirements
**Target Metrics**: Response time, throughput, resource usage
**Execution Time**: 5-15 minutes
**Run Frequency**: Nightly or on-demand

### 5. Security Tests
**Purpose**: Identify vulnerabilities
**Tools**: OWASP ZAP, Trivy, Snyk
**Run Frequency**: On every PR and nightly

## Test Organization

### Backend Test Structure
```
ClimaCool.Tests/
├── Unit/
│   ├── Services/
│   │   ├── AuthServiceTests.cs
│   │   ├── ProductServiceTests.cs
│   │   └── OrderServiceTests.cs
│   ├── Domain/
│   │   ├── UserTests.cs
│   │   └── ProductTests.cs
│   └── Utilities/
│       └── HelperTests.cs
├── Integration/
│   ├── Controllers/
│   │   ├── AuthControllerTests.cs
│   │   └── ProductControllerTests.cs
│   ├── Repositories/
│   │   └── UserRepositoryTests.cs
│   └── Services/
│       └── EmailServiceTests.cs
├── Fixtures/
│   ├── DatabaseFixture.cs
│   ├── TestDataBuilder.cs
│   └── MockFactory.cs
└── Performance/
    └── LoadTests/
```

### Frontend Test Structure
```
src/app/
├── auth/
│   ├── services/
│   │   └── auth.service.spec.ts
│   ├── components/
│   │   ├── login.component.spec.ts
│   │   └── register.component.spec.ts
│   └── guards/
│       └── auth.guard.spec.ts
├── products/
│   ├── services/
│   │   └── product.service.spec.ts
│   └── components/
│       └── product-list.component.spec.ts
└── shared/
    └── testing/
        ├── mock-services.ts
        ├── test-helpers.ts
        └── test-data.ts

e2e/
├── support/
│   ├── commands.ts
│   ├── page-objects/
│   └── test-data/
├── specs/
│   ├── auth.cy.ts
│   ├── products.cy.ts
│   └── checkout.cy.ts
└── fixtures/
```

## Testing Tools & Frameworks

### Backend Testing Stack
- **xUnit**: Unit testing framework
- **Moq**: Mocking framework
- **FluentAssertions**: Assertion library
- **TestContainers**: Integration testing with real databases
- **WebApplicationFactory**: API integration testing
- **Bogus**: Fake data generation
- **NetArchTest**: Architecture testing
- **NBomber/K6**: Load testing

### Frontend Testing Stack
- **Jasmine/Karma**: Unit testing
- **Angular Testing Library**: Component testing
- **Cypress/Playwright**: E2E testing
- **Mock Service Worker**: API mocking
- **Jest** (optional): Alternative test runner

### CI/CD Testing Tools
- **GitHub Actions**: CI/CD pipeline
- **SonarQube**: Code quality analysis
- **Codecov**: Coverage reporting
- **Lighthouse CI**: Performance testing
- **OWASP ZAP**: Security testing

## Test Data Management

### Test Data Strategies
1. **Builders**: Use builder pattern for test objects
2. **Factories**: Create realistic test data
3. **Fixtures**: Shared test data sets
4. **Seeds**: Database seeding for integration tests

### Test Data Examples
```csharp
// Builder Pattern
var user = new UserBuilder()
    .WithEmail("test@example.com")
    .WithRole(UserRole.Customer)
    .Build();

// Factory Pattern
var products = ProductFactory.CreateMany(10);

// Fixture
public class DatabaseFixture : IDisposable
{
    public TestDatabase Database { get; }
    public DatabaseFixture() => Database = new TestDatabase();
    public void Dispose() => Database.Dispose();
}
```

## Test Writing Guidelines

### Unit Test Best Practices
1. **Arrange-Act-Assert** pattern
2. **One assertion per test** (when possible)
3. **Descriptive test names**: Method_Scenario_ExpectedResult
4. **Test edge cases**: null, empty, boundary values
5. **Mock external dependencies**
6. **Keep tests independent**

### Integration Test Best Practices
1. **Use real dependencies** when possible
2. **Reset database state** between tests
3. **Test happy path and error scenarios**
4. **Verify data persistence**
5. **Test transaction rollback**

### E2E Test Best Practices
1. **Test user journeys**, not implementation
2. **Use page objects** pattern
3. **Avoid testing UI details**
4. **Keep tests stable** (avoid flaky tests)
5. **Use explicit waits**

## Code Coverage Requirements

### Coverage Targets by Type
- **Unit Tests**: ≥ 80%
- **Integration Tests**: ≥ 70%
- **Overall Coverage**: ≥ 75%

### Coverage Exclusions
- Generated code (migrations, scaffolding)
- Program.cs and startup configuration
- DTOs and POCOs (unless complex logic)
- Test code itself

### Coverage Enforcement
```xml
<!-- Directory.Build.props -->
<PropertyGroup>
  <CollectCoverage>true</CollectCoverage>
  <CoverletOutputFormat>opencover</CoverletOutputFormat>
  <Threshold>80</Threshold>
  <ThresholdType>line,branch,method</ThresholdType>
  <ThresholdStat>total</ThresholdStat>
</PropertyGroup>
```

## Test Execution Strategy

### Local Development
```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true

# Run specific category
dotnet test --filter Category=Unit

# Watch mode
dotnet watch test

# Frontend tests
npm test
npm run test:coverage
npm run e2e
```

### CI Pipeline Stages
1. **Lint & Format Check**
2. **Build**
3. **Unit Tests** (parallel)
4. **Integration Tests** (with services)
5. **E2E Tests** (against test environment)
6. **Coverage Report**
7. **Security Scan**

### Test Environments
- **Local**: Developer machine
- **CI**: GitHub Actions runners
- **Test**: Dedicated test environment
- **Staging**: Pre-production environment

## Performance Testing Strategy

### Load Test Scenarios
1. **Normal Load**: 100 concurrent users
2. **Peak Load**: 500 concurrent users
3. **Stress Test**: Find breaking point
4. **Endurance Test**: 2 hours sustained load

### Performance Metrics
- Response time (p50, p95, p99)
- Throughput (requests/second)
- Error rate
- Resource utilization (CPU, memory)

### K6 Test Example
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.1'],
  },
};

export default function () {
  let response = http.get('https://api.example.com/products');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

## Security Testing Strategy

### Security Test Types
1. **Static Analysis** (SAST)
2. **Dependency Scanning**
3. **Container Scanning**
4. **Dynamic Testing** (DAST)
5. **Penetration Testing** (quarterly)

### Security Test Tools
- **Trivy**: Vulnerability scanning
- **OWASP ZAP**: Dynamic security testing
- **Snyk**: Dependency vulnerability scanning
- **SonarQube**: Static code analysis
- **GitHub Security**: Dependabot alerts

## Test Reporting

### Test Reports
1. **Unit Test Results**: xUnit XML format
2. **Coverage Reports**: Cobertura/OpenCover format
3. **E2E Test Videos**: Cypress recordings
4. **Performance Reports**: K6 HTML reports
5. **Security Reports**: SARIF format

### Dashboards
- Test execution trends
- Coverage trends
- Flaky test tracking
- Performance metrics
- Security vulnerability trends

## Continuous Improvement

### Test Metrics to Track
- Test execution time
- Test failure rate
- Flaky test count
- Coverage percentage
- Defect escape rate

### Regular Reviews
- Weekly: Review failed tests
- Monthly: Analyze test metrics
- Quarterly: Update test strategy

## Test Maintenance

### Test Refactoring
- Remove duplicate tests
- Update outdated assertions
- Improve test performance
- Enhance test readability

### Test Debt Management
- Track missing tests
- Prioritize test creation
- Allocate time for test improvement
- Regular test code reviews

## Troubleshooting Guide

### Common Issues
1. **Flaky Tests**
   - Add explicit waits
   - Mock time-dependent code
   - Isolate test data

2. **Slow Tests**
   - Use test parallelization
   - Optimize database queries
   - Mock expensive operations

3. **False Positives**
   - Verify test assumptions
   - Check test data consistency
   - Review assertion logic

## Testing Checklist

### Before Commit
- [ ] Unit tests written for new code
- [ ] All tests passing locally
- [ ] Coverage meets requirements
- [ ] No console.log or debug code

### Before PR
- [ ] Integration tests written
- [ ] E2E tests for new features
- [ ] Performance impact assessed
- [ ] Security considerations tested

### Before Merge
- [ ] All CI checks passing
- [ ] Coverage hasn't decreased
- [ ] No new security vulnerabilities
- [ ] Performance benchmarks met

## Resources

### Documentation
- [xUnit Documentation](https://xunit.net/)
- [Angular Testing Guide](https://angular.io/guide/testing)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [K6 Documentation](https://k6.io/docs/)

### Learning Materials
- Unit Testing Principles (book)
- Test-Driven Development (TDD)
- Behavior-Driven Development (BDD)
- Contract Testing
- Property-Based Testing

---

This testing strategy is a living document and should be updated as the project evolves and new testing needs arise.