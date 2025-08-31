# Open Source Technology Stack Summary

## Core Technologies (100% Free & Open Source)

### Backend Stack
- **Framework**: ASP.NET Core 8 (MIT License)
- **Database**: PostgreSQL (PostgreSQL License)
- **Caching**: Redis (BSD License)
- **Message Queue**: RabbitMQ (MPL 2.0)
- **Search Engine**: OpenSearch/Elasticsearch (Apache 2.0)
- **File Storage**: MinIO (AGPL v3)
- **Background Jobs**: Hangfire Community (LGPL v3)
- **Email**: MailKit (MIT) / Postal (MIT)

### Frontend Stack
- **Framework**: Angular 18+ (MIT)
- **State Management**: NgRx (MIT)
- **UI Components**: Angular Material (MIT)
- **Charts**: Chart.js (MIT)
- **Icons**: Font Awesome Free (CC BY 4.0)

### Infrastructure & DevOps
- **Containerization**: Docker (Apache 2.0)
- **Orchestration**: Kubernetes/K3s (Apache 2.0)
- **CI/CD**: GitLab CE / Jenkins (MIT/MIT)
- **Container Registry**: Harbor (Apache 2.0)
- **API Gateway**: YARP (MIT) / Kong OSS (Apache 2.0)
- **Load Balancer**: NGINX (BSD) / HAProxy (GPL v2)
- **SSL**: Let's Encrypt with Certbot (Free)

### Monitoring & Observability
- **APM**: OpenTelemetry + Jaeger (Apache 2.0)
- **Metrics**: Prometheus + Grafana (Apache 2.0)
- **Logging**: ELK Stack or OpenSearch Stack
- **Error Tracking**: Sentry Self-Hosted (BSL)

### Security
- **Identity**: Keycloak (Apache 2.0)
- **Secrets**: HashiCorp Vault OSS (MPL 2.0)
- **WAF**: ModSecurity (Apache 2.0)
- **Scanning**: Trivy (Apache 2.0)

### Testing Tools
- **Unit Testing**: xUnit, NUnit (Apache 2.0)
- **E2E Testing**: Playwright (Apache 2.0)
- **Load Testing**: K6 OSS (AGPL v3)
- **Security Testing**: OWASP ZAP (Apache 2.0)

## Cost Considerations

### Completely Free Services
1. **Development**: All tools and frameworks
2. **Version Control**: GitHub Free / GitLab CE
3. **SSL Certificates**: Let's Encrypt
4. **CDN**: Cloudflare Free Tier (with limitations)

### Minimal Required Costs
1. **Hosting**: VPS/Cloud servers ($5-20/month starting)
2. **Domain Name**: (~$10-15/year)
3. **Payment Processing**: Transaction fees only (2.9% + $0.30 typical)
4. **Email Sending**: Can use free SMTP with limits

## Deployment Options

### Budget-Friendly Hosting
1. **Oracle Cloud Free Tier**: 4 ARM cores, 24GB RAM (Always Free)
2. **Hetzner Cloud**: Starting at €3.29/month
3. **DigitalOcean**: Starting at $6/month
4. **Linode**: Starting at $5/month
5. **Self-hosted**: On-premise servers

### Development Environment
- **Local Development**: Docker Desktop (free for small businesses)
- **IDE**: VS Code (free) / JetBrains Community Editions
- **Database GUI**: pgAdmin (PostgreSQL) / DBeaver Community

## Migration Path from Paid Services

### If You Later Need Enterprise Features
- **Elasticsearch** → Keep using or switch to OpenSearch
- **Redis** → Redis Stack (still free)
- **RabbitMQ** → Can scale horizontally
- **PostgreSQL** → Can handle millions of records
- **Keycloak** → Supports enterprise SSO/SAML
- **GitLab CE** → Upgrade to EE if needed

## License Compliance Notes
- Most tools use MIT, Apache 2.0, or BSD licenses (business-friendly)
- AGPL (MinIO, K6) requires open-sourcing modifications if providing as service
- Review licenses before commercial deployment
- No license fees for any of the recommended stack

## Total Initial Investment
- **Software Licenses**: $0
- **Essential Costs**: ~$20-50/month (hosting + domain)
- **Scale-up Costs**: Add servers as needed ($5-20 each)