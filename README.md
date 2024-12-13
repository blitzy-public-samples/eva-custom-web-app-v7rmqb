# Estate Kit Platform

A comprehensive estate planning platform combining physical organization tools with a secure digital vault for the Canadian market.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](package.json)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.11-blue)](requirements.txt)

## Overview

Estate Kit is a first-to-market hybrid physical/digital estate planning solution designed specifically for the Canadian market. The platform addresses the critical need for simplified estate planning among older adults (60+) by providing an intuitive interface for organizing both physical and digital assets, documents, and information.

### Key Features

- 🔒 Secure digital vault for document storage
- 👥 Role-based delegate access management
- 📄 PDF generation and formatting
- 🍁 Province-specific resource delivery
- 🛍️ Physical kit e-commerce integration
- 🔐 PIPEDA and HIPAA-compliant architecture

## Project Structure

```
estate-kit/
├── src/
│   ├── web/                 # Frontend React application
│   ├── backend/            # Microservices architecture
│   └── shared/             # Shared utilities and types
├── infrastructure/         # AWS and Kubernetes configurations
├── docs/                  # Documentation and API specifications
├── tests/                 # Test suites and utilities
└── scripts/              # Development and deployment utilities
```

## Prerequisites

### Required Software
- Node.js >= 18.0.0
- PostgreSQL 14+
- Redis 6.2+
- Docker >= 20.0.0
- Kubernetes >= 1.24
- Terraform >= 1.0.0

### Required Accounts
- AWS Account with appropriate IAM permissions
- Auth0 Account
- SendGrid API access
- Intercom configuration
- Sanity.io project setup

## Version Compatibility Matrix

### Frontend
- React 18.2+
- Material UI 5.11+
- TypeScript 4.9+
- Redux Toolkit 1.9+
- React Query 4.0+

### Backend
- Node.js 18 LTS
- Python 3.11+
- FastAPI 0.95+
- Express.js 4.18+
- PostgreSQL 14+

### Infrastructure
- AWS CDK 2.0+
- Terraform 1.0+
- Kubernetes 1.24+
- Docker 20.0+

## Quick Start Guide

### Local Development Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/estate-kit.git
cd estate-kit
```

2. Install dependencies:
```bash
# Frontend dependencies
cd src/web
npm install

# Backend dependencies
cd ../backend
npm install
pip install -r requirements.txt
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start development services:
```bash
docker-compose up -d    # Starts PostgreSQL, Redis, and MinIO
```

5. Run the development servers:
```bash
# Frontend
cd src/web
npm run dev

# Backend
cd src/backend
npm run dev
```

### Staging Deployment

1. Provision infrastructure:
```bash
cd infrastructure
terraform init
terraform plan -out=staging.tfplan
terraform apply staging.tfplan
```

2. Deploy services:
```bash
kubectl apply -f k8s/staging/
```

3. Verify deployment:
```bash
kubectl get pods -n estate-kit-staging
```

### Production Deployment

1. Provision production infrastructure:
```bash
cd infrastructure
terraform workspace select production
terraform plan -out=prod.tfplan
terraform apply prod.tfplan
```

2. Deploy services:
```bash
kubectl apply -f k8s/production/
```

3. Verify deployment:
```bash
kubectl get pods -n estate-kit-production
```

## Security Considerations

- All data is encrypted at rest using AES-256
- TLS 1.3 encryption for data in transit
- PIPEDA and HIPAA compliance measures implemented
- Regular security audits and penetration testing
- Multi-factor authentication support
- Role-based access control (RBAC)
- Automated security scanning in CI/CD pipeline

## Troubleshooting Guide

### Common Development Issues

1. **Database Connection Issues**
   - Verify PostgreSQL service is running
   - Check connection string in .env file
   - Ensure database user has proper permissions

2. **Redis Connection Issues**
   - Verify Redis service is running
   - Check Redis connection string
   - Ensure proper Redis configuration

3. **AWS Credential Issues**
   - Verify AWS credentials are properly configured
   - Check IAM permissions
   - Ensure proper AWS region is set

### Deployment Issues

1. **Kubernetes Deployment Failures**
   - Check pod logs: `kubectl logs <pod-name>`
   - Verify resource limits
   - Check image pull policies

2. **Infrastructure Provisioning Issues**
   - Verify Terraform state
   - Check AWS quota limits
   - Validate IAM permissions

## Maintenance Procedures

### Monthly Tasks
- Review and update documentation
- Verify setup instructions
- Update version compatibility matrix
- Review security guidelines
- Update troubleshooting guides

### Quarterly Tasks
- Security audit
- Compliance review
- Update security protocols
- Verify authentication flows
- Review and update best practices

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- 📧 Email: support@estate-kit.com
- 💬 Intercom: Available in-app
- 📚 Documentation: [docs.estate-kit.com](https://docs.estate-kit.com)

## Acknowledgments

- Auth0 for authentication services
- AWS for infrastructure hosting
- SendGrid for communication services
- Intercom for customer support
- Sanity.io for content management

---
Built with ❤️ for Canadian estate planning