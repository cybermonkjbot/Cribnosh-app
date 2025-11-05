import swaggerJSDoc from 'swagger-jsdoc';
import { glob } from 'glob';
import path from 'path';

interface SwaggerConfig {
  title: string;
  version: string;
  description: string;
  baseUrl: string;
  contact?: {
    name: string;
    email: string;
  };
  license?: {
    name: string;
    url?: string;
  };
}

export class DynamicSwaggerGenerator {
  private config: SwaggerConfig;

  constructor(config: SwaggerConfig) {
    this.config = config;
  }

  /**
   * Generate OpenAPI specification dynamically by scanning API routes
   */
  async generateSpec() {
    const apiFiles = await this.findAPIFiles();
    
    const options: swaggerJSDoc.Options = {
      definition: {
        openapi: '3.0.3',
        info: {
          title: this.config.title,
          version: this.config.version,
          description: this.config.description,
          contact: this.config.contact,
          license: this.config.license,
        },
        servers: [
          {
            url: this.config.baseUrl,
            description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
          },
        ],
        tags: [
          { name: 'Authentication', description: 'User authentication and authorization endpoints' },
          { name: 'Admin', description: 'Administrative operations and platform management' },
          { name: 'Customer', description: 'Customer-specific operations and data management' },
          { name: 'Chef', description: 'Chef-specific operations and meal management' },
          { name: 'Staff', description: 'Staff operations and internal management' },
          { name: 'Orders', description: 'Order management and processing' },
          { name: 'Payments', description: 'Payment processing and financial operations' },
          { name: 'Reviews', description: 'Review and rating system' },
          { name: 'Analytics', description: 'Analytics and data tracking' },
          { name: 'Monitoring', description: 'System monitoring and health checks' },
          { name: 'Live Streaming', description: 'Live streaming and real-time features' },
          { name: 'Notifications', description: 'User notification management' },
          { name: 'Webhooks', description: 'Webhook endpoints for external integrations' },
          { name: 'Email', description: 'Email service integration' },
          { name: 'AI', description: 'AI-powered features and recommendations' },
          { name: 'Integrations', description: 'External service integrations' },
          { name: 'Sync', description: 'Data synchronization services' },
          { name: 'System', description: 'System utilities and core operations' },
          { name: 'Delivery', description: 'Delivery management and driver operations' },
          { name: 'Chat', description: 'Real-time messaging and communication' },
          { name: 'Messaging', description: 'Messaging and communication services' },
          { name: 'Contact', description: 'Contact form and communication' },
          { name: 'Contacts', description: 'Contact management and forms' },
          { name: 'Forms', description: 'Form handling and submissions' },
          { name: 'Documentation', description: 'API documentation and specifications' },
          { name: 'Delivery Applications', description: 'Delivery driver applications' },
          { name: 'Driver Applications', description: 'Driver application management' },
          { name: 'User Management', description: 'User account management' },
          { name: 'System Operations', description: 'System administration operations' },
          { name: 'Dishes', description: 'Dish and meal management' },
          { name: 'Meals', description: 'Meal and food item management' },
          { name: 'Cards', description: 'Payment card management' },
          { name: 'Search', description: 'Search functionality and suggestions' },
          { name: 'Suggestions', description: 'Search suggestions and recommendations' },
          { name: 'Real-time', description: 'Real-time features and broadcasting' },
          { name: 'Broadcasting', description: 'Real-time broadcasting services' },
          { name: 'Waitlist', description: 'Waitlist management' },
          { name: 'Chef Management', description: 'Chef account and profile management' },
          { name: 'Cuisines', description: 'Cuisine type management' },
          { name: 'Custom Orders', description: 'Custom order processing' },
          { name: 'Dashboard', description: 'Dashboard and analytics views' },
          { name: 'Revenue', description: 'Revenue tracking and analytics' },
          { name: 'Images', description: 'Image upload and management' },
          { name: 'Chef - Dashboard', description: 'Chef-specific dashboard features' },
          { name: 'Moderation', description: 'Content moderation and management' },
          { name: 'Session', description: 'Session management and handoff' },
          { name: 'Live Streaming Functions', description: 'Live streaming function calls' },
          { name: 'Payroll', description: 'Payroll and tax document management' },
          { name: 'Timelogs', description: 'Time tracking and logging' },
          { name: 'Admin - Images', description: 'Administrative image management' },
          { name: 'Admin - Email Configuration', description: 'Email configuration management' },
          { name: 'Admin - Emotions Engine', description: 'Emotions engine administration' },
          { name: 'Admin Emotions Engine', description: 'Emotions engine admin operations' },
          { name: 'Admin Reports', description: 'Administrative reporting' },
          { name: 'Admin - Dishes', description: 'Administrative dish management' },
          { name: 'Customer Menus', description: 'Customer menu browsing' },
          { name: 'Customer Chefs', description: 'Customer chef discovery' },
          { name: 'Conversations', description: 'Chat conversation management' },
          { name: 'Messages', description: 'Message handling and management' },
          { name: 'Read', description: 'Read status and tracking' },
          { name: 'Reactions', description: 'Message reactions and interactions' },
          { name: 'Pin', description: 'Message pinning functionality' },
          { name: 'Participation', description: 'Chat participation management' },
          { name: 'File Upload', description: 'File upload functionality' },
          { name: 'Profile', description: 'User profile management' },
          { name: 'Documents', description: 'Document management and storage' },
          { name: 'Chef Documents', description: 'Chef-specific document management' },
          { name: 'Heatmap', description: 'Analytics heatmap visualization' },
          { name: 'Count', description: 'Count and statistics' },
          { name: 'Metrics', description: 'Performance metrics and monitoring' },
          { name: 'Export', description: 'Data export functionality' },
          { name: 'Pending Items', description: 'Pending approval items' },
          { name: 'Order Management', description: 'Order processing and management' },
          { name: 'Refunds', description: 'Refund processing' },
          { name: 'History', description: 'Historical data and records' },
          { name: 'Notes', description: 'Order notes and comments' },
          { name: 'Status', description: 'Status tracking and updates' },
          { name: 'Location', description: 'Location-based services' },
          { name: 'Availability', description: 'Chef availability management' },
          { name: 'Applications', description: 'Application processing' },
          { name: 'Onboarding', description: 'User onboarding processes' },
          { name: 'CORS', description: 'Cross-origin resource sharing' },
          { name: 'Content Management', description: 'Content management system' },
          { name: 'Presence', description: 'User presence tracking' },
          { name: 'Comments', description: 'Comment system management' },
          { name: 'Viewers', description: 'Viewer management and tracking' },
          { name: 'Sessions', description: 'Session management' },
          { name: 'Trending', description: 'Trending content and analytics' },
          { name: 'Sentiment Analysis', description: 'Sentiment analysis and AI processing' },
          { name: 'Mattermost', description: 'Mattermost integration' },
          { name: 'Notices', description: 'Notice and announcement management' },
          { name: 'Time Tracking', description: 'Time tracking and clock-in/out' },
          { name: 'Clock-In', description: 'Clock-in functionality' },
          { name: 'Early Access', description: 'Early access program management' },
          { name: 'Testing', description: 'Testing and development tools' },
          { name: 'Rate Limiting', description: 'Rate limiting and throttling' },
          { name: 'Nosh Heaven', description: 'Nosh Heaven video platform' },
          { name: 'Videos', description: 'Video content management' },
          { name: 'Collections', description: 'Content collections' },
          { name: 'Users', description: 'User management' },
          { name: 'Social', description: 'Social features and interactions' },
          { name: 'Interactions', description: 'User interactions and engagement' },
          { name: 'Document Management', description: 'Document management system' },
          { name: 'Review Management', description: 'Review management and approval' },
          { name: 'AI Analysis', description: 'AI-powered analysis features' },
          { name: 'Drivers', description: 'Driver management' },
          { name: 'Tracking', description: 'Order and delivery tracking' },
          { name: 'Preparation', description: 'Order preparation management' },
          { name: 'Functions', description: 'Serverless function calls' },
          { name: 'Recommendations', description: 'Recommendation engine' },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'JWT token for API authentication. Include as "Bearer {token}" in Authorization header.',
            },
            cookieAuth: {
              type: 'apiKey',
              in: 'cookie',
              name: 'convex-auth-token',
              description: 'Session token stored in HTTP-only cookie for authentication.',
            },
          },
          schemas: {
            Error: {
              type: 'object',
              properties: {
                error: {
                  type: 'string',
                  description: 'Error message',
                },
                details: {
                  type: 'object',
                  description: 'Additional error details',
                },
                code: {
                  type: 'string',
                  description: 'Error code',
                },
              },
              required: ['error'],
            },
            Success: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  description: 'Success status',
                },
                data: {
                  type: 'object',
                  description: 'Response data',
                },
                message: {
                  type: 'string',
                  description: 'Success message',
                },
              },
              required: ['success'],
            },
          },
        },
        security: [
          { bearerAuth: [] },
          { cookieAuth: [] },
        ],
      },
      apis: apiFiles,
      failOnErrors: false, // Don't fail on parsing errors
    };

    return swaggerJSDoc(options);
  }

  /**
   * Find all API route files in the app/api directory
   */
  private async findAPIFiles(): Promise<string[]> {
    const apiDir = path.join(process.cwd(), 'app', 'api');
    
    try {
      // Find all TypeScript files in the API directory
      const files = await glob('**/*.ts', {
        cwd: apiDir,
        ignore: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
        absolute: true,
      });

      // Filter out files that are not route handlers
      const routeFiles = files.filter((file: string) => {
        const relativePath = path.relative(apiDir, file);
        // Include files that are route.ts or index.ts, or files in specific patterns
        return (
          file.endsWith('route.ts') ||
          file.endsWith('index.ts') ||
          relativePath.includes('/') // Include files in subdirectories
        );
      });

      console.log(`Found ${routeFiles.length} API route files for Swagger generation`);
      return routeFiles;
    } catch (error) {
      console.error('Error finding API files:', error);
      return [];
    }
  }

  /**
   * Generate a basic OpenAPI spec without scanning files (fallback)
   */
  generateBasicSpec() {
    return {
      openapi: '3.0.0',
      info: {
        title: this.config.title,
        version: this.config.version,
        description: this.config.description,
        contact: this.config.contact,
        license: this.config.license,
      },
      servers: [
        {
          url: this.config.baseUrl,
          description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
        },
      ],
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token for API authentication. Include as "Bearer {token}" in Authorization header.',
          },
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'convex-auth-token',
            description: 'Session token stored in HTTP-only cookie for authentication.',
          },
        },
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: {
                type: 'string',
                description: 'Error message',
              },
              details: {
                type: 'object',
                description: 'Additional error details',
              },
              code: {
                type: 'string',
                description: 'Error code',
              },
            },
            required: ['error'],
          },
          Success: {
            type: 'object',
            properties: {
              success: {
                type: 'boolean',
                description: 'Success status',
              },
              data: {
                type: 'object',
                description: 'Response data',
              },
              message: {
                type: 'string',
                description: 'Success message',
              },
            },
            required: ['success'],
          },
        },
      },
      security: [
        { bearerAuth: [] },
        { cookieAuth: [] },
      ],
    };
  }
}

// Default configuration for CribNosh API
export const cribNoshSwaggerConfig: SwaggerConfig = {
  title: 'CribNosh API',
  version: '1.0.0',
  description: 'API documentation for CribNosh - Personalized meal platform with modern, glossy, culturally-aware design.',
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://cribnosh.com/api' 
    : 'http://localhost:3000/api',
  contact: {
    name: 'CribNosh Support',
    email: 'support@cribnosh.com',
  },
  license: {
    name: 'Cribnosh Private Collab Licence',
    url: '',
  },
};

// Create a singleton instance
export const swaggerGenerator = new DynamicSwaggerGenerator(cribNoshSwaggerConfig);
