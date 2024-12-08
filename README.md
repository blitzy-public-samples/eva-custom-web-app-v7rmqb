# Estate Kit

Estate Kit is a comprehensive estate planning and management platform designed to help users organize, manage, and securely share important documents and information with designated delegates.

## Project Overview

Estate Kit provides a secure and user-friendly platform for:
- Document management and organization
- Delegate access control
- Subscription-based services
- Province-specific estate planning guidance

### Key Features

- Secure document storage and management
- Role-based access control for delegates
- Multi-factor authentication
- Subscription management
- Audit logging and compliance tracking
- Province-specific resource delivery

## Getting Started

### Prerequisites

- Node.js >= 16.0.0
- npm >= 8.0.0
- PostgreSQL >= 13.0
- AWS Account (for S3 storage)
- Auth0 Account (for authentication)

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/estate-kit/estate-kit.git
cd estate-kit
```

2. Install dependencies:
```bash
# Install frontend dependencies
cd src/web
npm install

# Install backend dependencies
cd ../backend
npm install
```

3. Configure environment variables:
```bash
# Backend (.env)
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=estate_kit
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AUTH0_DOMAIN=your_auth0_domain
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret

# Frontend (.env)
VITE_API_URL=http://localhost:3000/api
VITE_AUTH0_DOMAIN=your_auth0_domain
VITE_AUTH0_CLIENT_ID=your_auth0_client_id
```

### Database Setup

1. Create the database:
```bash
createdb estate_kit
```

2. Run migrations:
```bash
cd src/backend
npm run migrate
```

3. Seed initial data:
```bash
npm run seed
```

## Development

### Running the Application

1. Start the backend server:
```bash
cd src/backend
npm run dev
```

2. Start the frontend development server:
```bash
cd src/web
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### Testing

#### Frontend Tests

```bash
cd src/web
npm run test
```

Frontend tests use Jest and React Testing Library to ensure component reliability and functionality.

#### Backend Tests

```bash
cd src/backend
npm run test
```

Backend tests cover:
- API endpoints
- Authentication
- Database operations
- Business logic
- Integration tests

### API Documentation

The API documentation is available through Swagger UI when running the backend server:

```bash
# Generate API documentation
cd src/backend
npm run docs

# Access at http://localhost:3000/api-docs
```

## Deployment

### Production Build

1. Build the frontend:
```bash
cd src/web
npm run build
```

2. Build the backend:
```bash
cd src/backend
npm run build
```

### Deployment Checklist

- [ ] Configure production environment variables
- [ ] Set up SSL certificates
- [ ] Configure database backups
- [ ] Set up monitoring and logging
- [ ] Configure AWS S3 bucket permissions
- [ ] Set up Auth0 production tenant

## Architecture

Estate Kit follows a modern, scalable architecture:

- Frontend: React with TypeScript
- Backend: Node.js with Express and TypeScript
- Database: PostgreSQL
- Authentication: Auth0
- Storage: AWS S3
- API Documentation: OpenAPI/Swagger

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

Please ensure your code follows our style guide and includes appropriate tests.

## License

This project is proprietary and confidential. Unauthorized copying, distribution, or use is strictly prohibited.

## Support

For support inquiries, please contact:
- Email: support@estate-kit.com
- Documentation: https://docs.estate-kit.com