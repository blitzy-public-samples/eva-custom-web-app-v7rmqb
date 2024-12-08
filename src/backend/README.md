# Estate Kit Backend Services

## Overview

Estate Kit is a comprehensive estate planning and management system. This backend service provides the core functionality for document management, delegate access control, subscription management, and secure user authentication.

## Requirements

- Node.js >= 16.0.0
- PostgreSQL >= 13.0
- AWS Account with S3, SES, and KMS access
- Auth0 tenant configuration

## Technology Stack

- **Runtime**: Node.js 18 LTS
- **Framework**: Express.js 4.18.2
- **Database**: PostgreSQL with Sequelize 6.31.0
- **Authentication**: Auth0 2.37.0
- **Cloud Services**: AWS SDK 2.1360.0
- **PDF Processing**: pdf-lib 1.17.1
- **Validation**: Zod 3.21.4
- **Testing**: Jest 29.6.0
- **Logging**: Winston 3.8.2

## Project Structure

```
src/backend/
├── src/
│   ├── api/           # API routes, controllers, validators
│   ├── config/        # Configuration files
│   ├── db/           # Database models and migrations
│   ├── services/     # Business logic services
│   ├── types/        # TypeScript type definitions
│   ├── utils/        # Utility functions
│   └── index.ts      # Application entry point
├── scripts/          # Database migration scripts
├── openapi/         # API documentation
├── tests/           # Test files
└── dist/           # Compiled JavaScript files
```

## Setup Instructions

1. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Configure required environment variables
   # - Database credentials
   # - AWS credentials
   # - Auth0 configuration
   # - JWT secrets
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Run database migrations
   npm run migrate

   # Seed initial data (if needed)
   npm run seed
   ```

4. **Build and Run**
   ```bash
   # Development mode
   npm run dev

   # Production build
   npm run build
   npm start
   ```

## API Documentation

The API documentation is available in OpenAPI/Swagger format:

- Development: `http://localhost:3000/api-docs`
- Production: `https://api.estatekit.com/api-docs`

## Core Features

### User Management
- User authentication via Auth0
- Role-based access control (RBAC)
- User profile management
- Secure password handling

### Document Management
- Document upload and storage in AWS S3
- Document categorization and metadata
- PDF generation and processing
- Version control

### Delegate Access
- Delegate invitation system
- Permission management
- Role-based delegate access
- Expiration handling

### Subscription Management
- Subscription plan handling
- Payment processing integration
- Subscription status tracking
- Plan feature management

## Development Guidelines

### Code Style
- Follow TypeScript best practices
- Use ESLint for code linting
- Follow the project's naming conventions
- Document code with JSDoc comments

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- path/to/test
```

### Database Migrations
```bash
# Create new migration
npm run migrate:create name_of_migration

# Run migrations
npm run migrate

# Rollback migration
npm run migrate:undo
```

## Deployment

### Docker
```bash
# Build Docker image
docker build -t estate-kit-backend .

# Run container
docker run -p 3000:3000 estate-kit-backend
```

### Production Deployment Checklist
1. Configure production environment variables
2. Set up SSL certificates
3. Configure database backups
4. Set up monitoring and logging
5. Configure auto-scaling policies
6. Review security settings

## Monitoring and Logging

- Application logs are stored in `logs/`
- Winston logger configured for structured logging
- AWS CloudWatch integration for production
- Error tracking via logging service

## Security Considerations

- JWT-based authentication
- Role-based access control
- Data encryption at rest and in transit
- Regular security audits
- Rate limiting on API endpoints
- Input validation and sanitization

## Support and Contact

For technical support or questions:
- Email: support@estatekit.com
- Documentation: https://docs.estatekit.com
- Issue Tracker: https://github.com/estate-kit/backend/issues

## License

UNLICENSED - Private repository
Copyright (c) 2024 Estate Kit