# ClimaCool E-Commerce Platform

Enterprise e-commerce solution for heating, cooling, and solar energy systems built with ASP.NET Core and Angular.

## Overview

ClimaCool is a modern, scalable e-commerce platform specializing in:
- Air conditioning systems
- Solar panels and inverters
- Heating solutions
- Cooling equipment
- HVAC accessories and parts

## Tech Stack

### Backend
- **Framework**: ASP.NET Core 8
- **Database**: PostgreSQL
- **Caching**: Redis
- **Message Queue**: RabbitMQ
- **Search**: OpenSearch/Elasticsearch

### Frontend
- **Framework**: Angular 18+
- **State Management**: NgRx
- **UI Library**: Angular Material
- **CSS**: Tailwind CSS

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana

## Project Structure

```
ClimaCool/
├── src/
│   ├── backend/           # ASP.NET Core API
│   ├── frontend/          # Angular applications
│   └── shared/            # Shared contracts
├── infrastructure/        # IaC and deployment configs
├── docs/                  # Documentation
└── tests/                 # Test projects
```

## Getting Started

### Prerequisites

- .NET 8 SDK
- Node.js 20+ and npm
- Docker Desktop
- PostgreSQL 15+
- Redis

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/[your-username]/ClimaCool.git
cd ClimaCool
```

2. Set up backend (instructions coming soon)

3. Set up frontend (instructions coming soon)

4. Run with Docker Compose (instructions coming soon)

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `feature/*` - New features
- `bugfix/*` - Bug fixes
- `hotfix/*` - Emergency fixes

### Creating a Pull Request

1. Create a feature branch from `main`:
```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:
```bash
git add .
git commit -m "feat: add your feature description"
```

3. Push to GitHub:
```bash
git push -u origin feature/your-feature-name
```

4. Create a PR on GitHub targeting `main`

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

## Testing

- **Unit Tests**: Run with `dotnet test`
- **Integration Tests**: Run with `dotnet test --filter Category=Integration`
- **E2E Tests**: Run with `npm run e2e`

All PRs must maintain >80% code coverage.

## Documentation

- [Development Plan](./E-COMMERCE-PLATFORM-PLAN.md)
- [Open Source Stack](./OPEN-SOURCE-STACK-SUMMARY.md)
- API Documentation (coming soon)
- Architecture Diagrams (coming soon)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For issues and questions, please use the GitHub issue tracker.

## Roadmap

See our [Development Plan](./E-COMMERCE-PLATFORM-PLAN.md) for the complete roadmap.

### Current Phase
- [ ] Initial setup and infrastructure
- [ ] Core backend architecture
- [ ] Frontend scaffold
- [ ] Authentication system

## Team

- Technical Lead: TBD
- Backend Team: TBD
- Frontend Team: TBD
- DevOps: TBD

---

Built with ❤️ using open-source technologies