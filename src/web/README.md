# Estate Kit Frontend Application

Estate Kit is a comprehensive web application designed to simplify estate planning and management. This document provides essential information for developers to set up, develop, and maintain the frontend application.

## Project Overview

Estate Kit's frontend is built using modern web technologies and follows industry best practices for security, accessibility, and user experience. The application enables users to manage estate documents, delegate access, and handle subscriptions securely.

### Key Features
- Document management with secure storage and sharing
- Role-based delegate access control
- Subscription management
- Secure authentication using Auth0
- Responsive design with Material UI
- Accessibility compliance (WCAG 2.1 Level AA)

### Technology Stack
- React 18.2.0
- Material UI 5.11.0
- Redux Toolkit for state management
- Auth0 for authentication
- TypeScript for type safety
- Jest for testing

## Setup Instructions

### Prerequisites
1. Node.js (v16 or higher)
2. npm or yarn package manager
3. Auth0 account and application credentials

### Environment Configuration
Create a `.env` file in the project root with the following variables:
```env
REACT_APP_AUTH0_DOMAIN=your-tenant.region.auth0.com
REACT_APP_AUTH0_CLIENT_ID=your-client-id
REACT_APP_API_BASE_URL=https://api.estatekit.com
REACT_APP_INTERCOM_APP_ID=your-intercom-app-id
```

### Installation
1. Clone the repository
```bash
git clone https://github.com/your-org/estate-kit.git
cd estate-kit/src/web
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm start
```

## Development Guidelines

### Code Structure
- `/src/components` - Reusable UI components
- `/src/pages` - Page-level components
- `/src/hooks` - Custom React hooks
- `/src/services` - API service integrations
- `/src/redux` - State management
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions
- `/src/config` - Configuration files

### Design System
The application uses Material UI with a custom theme configuration:
- Primary color: #2C5282 (Blue)
- Secondary color: #48BB78 (Green)
- Error color: #E53E3E (Red)
- Font families: Inter for body text, Merriweather for headings

### Accessibility Guidelines
- Maintain WCAG 2.1 Level AA compliance
- Ensure proper ARIA attributes
- Support keyboard navigation
- Provide alternative text for images
- Maintain color contrast ratios
- Support screen readers

## API Documentation

### Base URL
The API base URL is configured in `src/config/api.config.ts`. All API requests are made relative to this base URL.

### Authentication
- Auth0 is used for user authentication
- JWT tokens are stored securely
- Role-based access control is implemented
- Token refresh is handled automatically

### API Endpoints
- `/documents` - Document management
- `/delegates` - Delegate access control
- `/subscriptions` - Subscription management
- `/users` - User profile management

### Error Handling
- API errors are handled consistently
- User-friendly error messages are displayed
- Network errors are handled gracefully
- Validation errors provide clear feedback

## Theming and Design System

### Theme Configuration
The theme is configured in `src/config/theme.config.ts` and includes:
- Color palette
- Typography scale
- Spacing system
- Component variants
- Responsive breakpoints

### CSS Variables
Global CSS variables are defined in:
- `src/styles/variables.css` - Design tokens
- `src/styles/typography.css` - Typography styles
- `src/styles/animations.css` - Animation utilities

### Responsive Design
- Mobile-first approach
- Breakpoints:
  - xs: 320px
  - sm: 576px
  - md: 768px
  - lg: 1024px
  - xl: 1280px

### Component Library
- Reusable components in `/src/components/common`
- Consistent styling and behavior
- Accessibility built-in
- Proper TypeScript types
- Comprehensive documentation

## Contributing
1. Follow the established code structure
2. Maintain consistent styling using the theme system
3. Ensure accessibility compliance
4. Write unit tests for new features
5. Document changes and new features
6. Follow Git commit message conventions

## Testing
- Run tests: `npm test`
- Coverage report: `npm test -- --coverage`
- E2E tests: `npm run test:e2e`
- Component tests: `npm run test:components`

## Deployment
- Build production bundle: `npm run build`
- Static files will be in `/build` directory
- Configure CI/CD pipeline as needed
- Verify environment variables

## Support
For technical support or questions:
- GitHub Issues
- Development team contact
- Documentation updates