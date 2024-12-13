# Estate Kit Frontend Application

## Table of Contents
- [Project Overview](#project-overview)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building and Deployment](#building-and-deployment)
- [Security](#security)

## Project Overview

### Purpose and Goals
Estate Kit is a comprehensive web-based estate planning platform that provides an intuitive interface for organizing both physical and digital assets, documents, and information. The frontend application is designed to deliver a seamless user experience while maintaining high security and accessibility standards.

### Key Features
- Secure digital vault for document storage
- Role-based delegate access management
- PDF generation and formatting
- Province-specific resource delivery
- Physical kit e-commerce integration

### Technology Stack
- **Core Framework**: React 18.2.0
- **UI Framework**: Material UI 5.11.0
- **State Management**: Redux Toolkit 1.9.0
- **API Integration**: React Query 4.0.0
- **Authentication**: Auth0 React SDK 2.0.0
- **Build Tool**: Vite 4.0.0
- **Language**: TypeScript 4.9.0
- **HTTP Client**: Axios 1.2.0

### Architecture Overview
The application follows a component-based architecture with strict separation of concerns:
- Presentational Components
- Container Components
- Custom Hooks
- Services Layer
- State Management
- API Integration

### Browser Compatibility
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

### Accessibility Standards
- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0
- Git
- VS Code (recommended)
- Docker (optional)
- AWS CLI (optional)

### Installation Steps
```bash
# Clone the repository
git clone <repository_url>

# Navigate to frontend directory
cd src/web

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Configuration
Create a `.env` file with the following variables:
```
VITE_API_URL=<backend_api_endpoint>
VITE_AUTH0_DOMAIN=<auth0_domain>
VITE_AUTH0_CLIENT_ID=<auth0_client_id>
VITE_AUTH0_AUDIENCE=<auth0_api_audience>
VITE_AUTH0_REDIRECT_URI=<auth0_redirect_uri>
VITE_INTERCOM_APP_ID=<intercom_integration_id>
VITE_APP_ENV=<application_environment>
```

### IDE Setup
VS Code recommended extensions:
- ESLint
- Prettier
- GitLens
- ES7+ React/Redux/React-Native snippets
- vscode-styled-components

### Troubleshooting Guide
Common issues and solutions are documented in the [Wiki](./wiki/troubleshooting.md).

## Development

### Available Scripts
```bash
# Development
npm run dev           # Start development server
npm run test:watch   # Run tests in watch mode
npm run storybook    # Run Storybook development

# Testing
npm run test         # Run test suite
npm run test:coverage # Generate test coverage

# Linting and Formatting
npm run lint         # Run ESLint checks
npm run lint:fix     # Fix ESLint issues
npm run format       # Format code with Prettier
npm run typecheck    # Run TypeScript checks

# Documentation
npm run storybook        # Run Storybook development
npm run build-storybook  # Build Storybook static files
```

### Code Structure
```
src/
├── assets/          # Static assets
├── components/      # Reusable components
├── config/          # Configuration files
├── features/        # Feature-based modules
├── hooks/           # Custom React hooks
├── layouts/         # Layout components
├── pages/           # Page components
├── services/        # API services
├── store/           # Redux store
├── types/           # TypeScript definitions
└── utils/           # Utility functions
```

### Coding Standards
- Follow TypeScript best practices
- Use functional components with hooks
- Implement proper error handling
- Write comprehensive tests
- Document complex logic
- Follow accessibility guidelines

### Testing Guidelines
- Unit tests for utilities and hooks
- Component tests with React Testing Library
- Integration tests for complex features
- Maintain >80% test coverage
- Mock external dependencies

### State Management
- Use Redux Toolkit for global state
- React Query for server state
- Local state with useState/useReducer
- Context API for theme/auth state

### Component Development
- Follow atomic design principles
- Use Storybook for component development
- Implement proper prop validation
- Maintain component documentation
- Follow accessibility guidelines

### API Integration
- Use React Query for data fetching
- Implement proper error handling
- Handle loading states
- Cache responses appropriately
- Follow REST best practices

### Internationalization
- Use react-intl for translations
- Support multiple languages
- Handle date/time formatting
- Support right-to-left languages

### Performance Optimization
- Implement code splitting
- Use React.lazy for route-based splitting
- Optimize images and assets
- Monitor bundle size
- Use performance monitoring tools

## Building and Deployment

### Build Process
```bash
# Production build
npm run typecheck   # Type checking
npm run test        # Run tests
npm run build       # Create production build
```

### Environment Variables
- Use .env files for configuration
- Never commit sensitive data
- Document all required variables
- Validate environment setup

### Deployment Guidelines
- Use CI/CD pipelines
- Implement automated testing
- Configure proper caching
- Monitor deployment health
- Implement rollback procedures

### CI/CD Integration
- GitHub Actions workflow
- Automated testing
- Build verification
- Deployment automation
- Security scanning

### Version Management
- Follow semantic versioning
- Maintain changelog
- Tag releases
- Document breaking changes

### Monitoring Setup
- Error tracking with Sentry
- Performance monitoring
- User analytics
- API monitoring
- Resource utilization tracking

## Security

### Auth0 Setup
- Configure Auth0 application
- Implement proper callbacks
- Handle token management
- Implement role-based access
- Regular security audits

### Environment Variables Security
- Use proper encryption
- Implement access controls
- Regular rotation of secrets
- Secure storage solutions
- Audit access logs

### API Security
- Implement JWT authentication
- Use HTTPS only
- Validate all inputs
- Handle errors securely
- Rate limiting implementation

### CORS Configuration
- Restrict to known origins
- Implement proper headers
- Handle preflight requests
- Document CORS policies
- Regular security reviews

### Content Security Policy
- Implement CSP headers
- Restrict resource origins
- Prevent XSS attacks
- Monitor violations
- Regular policy updates

### Security Best Practices
- Regular dependency updates
- Security vulnerability scanning
- Code security reviews
- Access control audits
- Security training