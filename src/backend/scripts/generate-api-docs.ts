/**
 * API Documentation Generator Script for Estate Kit Platform
 * Automatically generates comprehensive OpenAPI/Swagger documentation by aggregating
 * route definitions, schemas, and security configurations.
 * @version 1.0.0
 */

import swaggerJsdoc from 'swagger-jsdoc'; // ^6.2.8
import { promises as fs } from 'fs';
import path from 'path';
import { router } from '../api/routes';
import { logger } from '../utils/logger.util';

// OpenAPI version and output configuration
const OPENAPI_VERSION = '3.0.3';
const OUTPUT_PATH = path.resolve(__dirname, '../openapi/swagger.json');
const SCHEMA_DIR = path.resolve(__dirname, '../openapi/schemas');

/**
 * Main function to generate comprehensive API documentation
 */
async function generateApiDocs(): Promise<void> {
  try {
    logger.info('Starting API documentation generation');

    // Configure Swagger options
    const options = {
      definition: {
        openapi: OPENAPI_VERSION,
        info: {
          title: 'Estate Kit API',
          version: '1.0.0',
          description: 'Estate Kit Platform API Documentation',
          license: {
            name: 'Proprietary',
            url: 'https://estatekit.ca/terms'
          },
          contact: {
            name: 'Estate Kit Support',
            url: 'https://estatekit.ca/support',
            email: 'support@estatekit.ca'
          }
        },
        servers: [
          {
            url: 'https://api.estatekit.ca/v1',
            description: 'Production server'
          },
          {
            url: 'https://staging-api.estatekit.ca/v1',
            description: 'Staging server'
          },
          {
            url: 'http://localhost:3000/v1',
            description: 'Development server'
          }
        ],
        security: [
          {
            BearerAuth: [],
            ApiKeyAuth: []
          }
        ],
        components: {
          securitySchemes: {
            BearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token obtained from Auth0 authentication'
            },
            ApiKeyAuth: {
              type: 'apiKey',
              in: 'header',
              name: 'X-API-Key',
              description: 'API key for service-to-service authentication'
            }
          },
          schemas: await loadSchemas()
        },
        tags: [
          { name: 'Users', description: 'User management endpoints' },
          { name: 'Documents', description: 'Document management endpoints' },
          { name: 'Delegates', description: 'Delegate management endpoints' },
          { name: 'Subscriptions', description: 'Subscription management endpoints' }
        ]
      },
      apis: [
        './src/api/routes/*.ts',
        './src/api/controllers/*.ts',
        './src/types/*.ts'
      ]
    };

    // Generate OpenAPI specification
    const spec = swaggerJsdoc(options);

    // Add CORS configuration
    spec.components.securitySchemes.cors = {
      type: 'apiKey',
      in: 'header',
      name: 'Origin',
      description: 'CORS configuration for allowed origins'
    };

    // Add rate limiting documentation
    spec.components.securitySchemes.rateLimit = {
      type: 'apiKey',
      in: 'header',
      name: 'X-RateLimit-Limit',
      description: 'Rate limiting configuration for API endpoints'
    };

    // Validate generated specification
    await validateSpec(spec);

    // Write specification to file
    await fs.writeFile(
      OUTPUT_PATH,
      JSON.stringify(spec, null, 2),
      'utf8'
    );

    logger.info('API documentation generated successfully', {
      outputPath: OUTPUT_PATH,
      schemaCount: Object.keys(spec.components.schemas).length,
      endpointCount: Object.keys(spec.paths).length
    });
  } catch (error) {
    logger.error('Failed to generate API documentation', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

/**
 * Loads and aggregates all schema definitions from the schemas directory
 */
async function loadSchemas(): Promise<object> {
  try {
    const schemas: Record<string, any> = {};
    
    // Read all schema files
    const files = await fs.readdir(SCHEMA_DIR);
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const content = await fs.readFile(
          path.join(SCHEMA_DIR, file),
          'utf8'
        );
        const schema = JSON.parse(content);
        
        // Extract schema name from filename
        const schemaName = path.basename(file, '.json');
        schemas[schemaName] = schema;
      }
    }

    return schemas;
  } catch (error) {
    logger.error('Failed to load schema definitions', {
      error: error instanceof Error ? error.message : 'Unknown error',
      schemaDir: SCHEMA_DIR
    });
    throw error;
  }
}

/**
 * Validates the generated OpenAPI specification for correctness
 */
async function validateSpec(spec: object): Promise<boolean> {
  try {
    // Validate required OpenAPI fields
    if (!spec.hasOwnProperty('openapi') || !spec.hasOwnProperty('info')) {
      throw new Error('Missing required OpenAPI fields');
    }

    // Validate schema references
    const schemas = spec.components?.schemas || {};
    for (const [name, schema] of Object.entries(schemas)) {
      if (schema.$ref && !schema.$ref.startsWith('#/components/schemas/')) {
        throw new Error(`Invalid schema reference in ${name}`);
      }
    }

    // Validate security schemes
    const securitySchemes = spec.components?.securitySchemes || {};
    for (const [name, scheme] of Object.entries(securitySchemes)) {
      if (!scheme.type || !['http', 'apiKey', 'oauth2', 'openIdConnect'].includes(scheme.type)) {
        throw new Error(`Invalid security scheme type in ${name}`);
      }
    }

    logger.info('OpenAPI specification validation successful');
    return true;
  } catch (error) {
    logger.error('OpenAPI specification validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

// Execute documentation generation
if (require.main === module) {
  generateApiDocs().catch((error) => {
    console.error('Documentation generation failed:', error);
    process.exit(1);
  });
}

export default generateApiDocs;