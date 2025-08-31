# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files
COPY ClimaCool.sln ./
COPY ClimaCool.API/*.csproj ./ClimaCool.API/
COPY ClimaCool.Core/*.csproj ./ClimaCool.Core/
COPY ClimaCool.Domain/*.csproj ./ClimaCool.Domain/
COPY ClimaCool.Application/*.csproj ./ClimaCool.Application/
COPY ClimaCool.Infrastructure/*.csproj ./ClimaCool.Infrastructure/
COPY ClimaCool.Tests/*.csproj ./ClimaCool.Tests/

# Restore dependencies
RUN dotnet restore

# Copy source code
COPY . .

# Build the application
WORKDIR /src/ClimaCool.API
RUN dotnet build -c Release --no-restore

# Publish the application
RUN dotnet publish -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy published application
COPY --from=build /app/publish .

# Create non-root user
RUN useradd -m -u 1001 appuser && chown -R appuser:appuser /app
USER appuser

# Expose ports
EXPOSE 8080
EXPOSE 8081

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

# Run the application
ENTRYPOINT ["dotnet", "ClimaCool.API.dll"]