// @package openapi v3.0.0
import { Router } from 'express';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Import route initialization function
import initializeRoutes from '../api/routes/index';

// Import OpenAPI schemas
import UserSchema from '../openapi/schemas/user.schema.json';
import SubscriptionSchema from '../openapi/schemas/subscription.schema.json';
import DocumentSchema from '../openapi/schemas/document.schema.json';
import DelegateSchema from '../openapi/schemas/delegate.schema.json';

/**
 * Human Tasks:
 * 1. Verify that all API endpoints are properly documented
 * 2. Ensure schema definitions match the actual data structures
 * 3. Review API versioning strategy
 * 4. Configure documentation hosting and access controls
 */

/**
 * Generates OpenAPI documentation by consolidating schemas and routes.
 * 
 * Requirements Addressed:
 * - API Documentation (Technical Specifications/2.3 API Design/Documentation)
 *   Generates OpenAPI documentation for all API endpoints, ensuring consistency
 *   and compliance with the defined schemas.
 * 
 * @returns The file path of the generated OpenAPI documentation
 */
export const generateOpenAPIDocumentation = (): string => {
  // Initialize router to get all routes
  const router = Router();
  const configuredRouter = initializeRoutes(router);

  // Create base OpenAPI document
  const openApiDoc = {
    openapi: '3.0.0',
    info: {
      title: 'Estate Kit API Documentation',
      description: 'API documentation for the Estate Kit backend system',
      version: '1.0.0',
      contact: {
        name: 'Estate Kit Support',
        email: 'support@estatekit.com'
      }
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000',
        description: 'API Server'
      }
    ],
    paths: {},
    components: {
      schemas: {
        // Consolidate all schemas
        ...UserSchema.components.schemas,
        ...SubscriptionSchema.properties,
        ...DocumentSchema.components.schemas,
        ...DelegateSchema.components.schemas
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };

  // Map routes to OpenAPI paths
  const stack = (configuredRouter as any).stack;
  stack.forEach((layer: any) => {
    if (layer.route) {
      const path = layer.route.path;
      const method = Object.keys(layer.route.methods)[0];

      // Add path to OpenAPI document
      openApiDoc.paths[path] = {
        ...openApiDoc.paths[path],
        [method]: {
          tags: [getTagFromPath(path)],
          summary: getSummaryFromPath(path, method),
          security: [{ bearerAuth: [] }],
          parameters: getParametersFromPath(path),
          requestBody: getRequestBodyFromPath(path, method),
          responses: getResponsesFromPath(path, method)
        }
      };
    }
  });

  // Write OpenAPI document to file
  const outputPath = join(__dirname, '../openapi/openapi.json');
  writeFileSync(outputPath, JSON.stringify(openApiDoc, null, 2));

  return outputPath;
};

/**
 * Helper function to determine API tag from path
 */
const getTagFromPath = (path: string): string => {
  const segments = path.split('/');
  return segments[1] || 'default';
};

/**
 * Helper function to generate API summary from path and method
 */
const getSummaryFromPath = (path: string, method: string): string => {
  const resource = getTagFromPath(path);
  const action = method === 'get' ? 'Retrieve' :
                method === 'post' ? 'Create' :
                method === 'put' ? 'Update' :
                method === 'delete' ? 'Delete' : 'Manage';
  return `${action} ${resource}`;
};

/**
 * Helper function to extract path parameters
 */
const getParametersFromPath = (path: string): any[] => {
  const parameters: any[] = [];
  const paramMatches = path.match(/:[a-zA-Z]+/g);

  if (paramMatches) {
    paramMatches.forEach(param => {
      parameters.push({
        name: param.substring(1),
        in: 'path',
        required: true,
        schema: {
          type: 'string'
        }
      });
    });
  }

  return parameters;
};

/**
 * Helper function to determine request body schema
 */
const getRequestBodyFromPath = (path: string, method: string): any => {
  if (method === 'get' || method === 'delete') {
    return undefined;
  }

  const resource = getTagFromPath(path);
  const schemaName = resource.charAt(0).toUpperCase() + resource.slice(1);

  return {
    required: true,
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${schemaName}Schema`
        }
      }
    }
  };
};

/**
 * Helper function to generate response schemas
 */
const getResponsesFromPath = (path: string, method: string): any => {
  const resource = getTagFromPath(path);
  const schemaName = resource.charAt(0).toUpperCase() + resource.slice(1);

  return {
    '200': {
      description: 'Successful operation',
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${schemaName}Schema`
          }
        }
      }
    },
    '400': {
      description: 'Bad request',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    '401': {
      description: 'Unauthorized',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    '403': {
      description: 'Forbidden',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    '404': {
      description: 'Not found',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              }
            }
          }
        }
      }
    },
    '500': {
      description: 'Internal server error',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              error: {
                type: 'string'
              }
            }
          }
        }
      }
    }
  };
};

export default generateOpenAPIDocumentation;