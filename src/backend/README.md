# ClimaCool Backend API

ASP.NET Core Web API following Clean Architecture principles.

## Project Structure

```
ClimaCool.API/          # Web API project - Controllers, Middleware, Configuration
ClimaCool.Core/         # Core abstractions - Interfaces, Base classes, Specifications
ClimaCool.Domain/       # Domain entities, Value objects, Domain events
ClimaCool.Application/  # Application logic - Use cases, DTOs, Services
ClimaCool.Infrastructure/ # External concerns - Database, File storage, Email
ClimaCool.Tests/        # Unit and Integration tests
```

## Prerequisites

- .NET 9 SDK
- PostgreSQL 16+
- Redis
- Docker & Docker Compose

## Getting Started

### Using Docker Compose (Recommended)

1. Start the infrastructure services:
```bash
docker-compose up -d postgres redis rabbitmq opensearch minio
```

2. Run database migrations:
```bash
dotnet ef database update -p ClimaCool.Infrastructure -s ClimaCool.API
```

3. Run the API:
```bash
dotnet run --project ClimaCool.API
```

The API will be available at `http://localhost:5000`

### Manual Setup

1. Install PostgreSQL, Redis, RabbitMQ, OpenSearch, and MinIO
2. Update connection strings in `appsettings.Development.json`
3. Run migrations and start the API as shown above

## Development

### Adding Entity Framework Migrations

```bash
dotnet ef migrations add MigrationName -p ClimaCool.Infrastructure -s ClimaCool.API
```

### Running Tests

```bash
dotnet test
```

### Building for Production

```bash
dotnet publish -c Release -o ./publish
```

## API Documentation

When running in development, Swagger UI is available at:
- http://localhost:5000/swagger

## Architecture

This project follows Clean Architecture principles:

- **Domain Layer**: Contains business logic and entities
- **Application Layer**: Contains use cases and application logic
- **Infrastructure Layer**: Contains data access, file storage, and external services
- **API Layer**: Contains controllers, middleware, and API configuration

### Key Patterns

- Repository Pattern
- Unit of Work
- CQRS (Command Query Responsibility Segregation)
- Specification Pattern
- Domain Events

## Configuration

Configuration is managed through:
- `appsettings.json` - Base configuration
- `appsettings.Development.json` - Development overrides
- `appsettings.Production.json` - Production overrides
- Environment variables
- User secrets (for sensitive data in development)

## Logging

Serilog is configured for structured logging with outputs to:
- Console
- File (rolling daily)
- OpenSearch (in production)