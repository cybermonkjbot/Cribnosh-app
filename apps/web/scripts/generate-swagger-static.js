#!/usr/bin/env node

/**
 * Generate static Swagger documentation for CribNosh API
 * This script scans all API route files and generates a static swagger.json file
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const yaml = require('js-yaml');

// Base OpenAPI specification with all tags
const baseSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CribNosh API',
    description: 'Personalized meal platform API with modern, glossy, culturally-aware design',
    version: '1.0.0',
    contact: {
      name: 'CribNosh API Support',
      email: 'support@cribnosh.co.uk'
    }
  },
  servers: [
    {
      url: 'https://cribnosh.co.uk',
      description: 'Production server'
    },
    {
      url: 'https://cribnosh.com',
      description: 'Alternative production server'
    }
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
    { name: 'Recommendations', description: 'Recommendation engine' }
  ],
  paths: {},
  components: {
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message'
          },
          code: {
            type: 'string',
            description: 'Error code'
          },
          details: {
            type: 'object',
            description: 'Additional error details'
          }
        }
      },
      Success: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Success status'
          },
          message: {
            type: 'string',
            description: 'Success message'
          },
          data: {
            type: 'object',
            description: 'Response data'
          }
        }
      }
    },
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key'
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

/**
 * Extract OpenAPI documentation from JSDoc comments
 */
function extractOpenAPIDocs(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    let inSwaggerBlock = false;
    let swaggerLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes('@swagger') || line.includes('* @swagger')) {
        inSwaggerBlock = true;
        continue;
      }
      
      if (inSwaggerBlock) {
        if (line.trim() === '*/' || line.trim() === '*/') {
          break;
        }
        if (line.includes('*')) {
          swaggerLines.push(line.replace(/^\s*\*\s?/, ''));
        }
      }
    }
    
    if (swaggerLines.length > 0) {
      return swaggerLines.join('\n');
    }
  } catch (error) {
    console.warn(`Warning: Could not read file ${filePath}:`, error.message);
  }
  
  return null;
}

/**
 * Generate path from file path
 */
function generatePathFromFilePath(filePath) {
  // Convert file path to API path
  let apiPath = filePath
    .replace(/^app\/api\//, '/api/')
    .replace(/\/route\.ts$/, '')
    .replace(/\/route\.js$/, '')
    .replace(/\/\[([^\]]+)\]/g, '/{$1}'); // Convert [param] to {param}
  
  return apiPath;
}

/**
 * Generate basic OpenAPI spec for a route file
 */
function generateBasicSpec(filePath) {
  const apiPath = generatePathFromFilePath(filePath);
  const fileName = path.basename(filePath);
  
  // Determine HTTP methods based on file name and exports
  const methods = []; // Start with empty array, only add methods that exist
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('export const GET')) methods.push('GET');
    if (content.includes('export const POST')) methods.push('POST');
    if (content.includes('export const PUT')) methods.push('PUT');
    if (content.includes('export const DELETE')) methods.push('DELETE');
    if (content.includes('export const PATCH')) methods.push('PATCH');
  } catch (error) {
    console.warn(`Warning: Could not analyze file ${filePath}:`, error.message);
  }
  
  const pathSpec = {};
  
  methods.forEach(method => {
    pathSpec[method.toLowerCase()] = {
      summary: `${method} ${apiPath}`,
      description: `Handle ${method} requests to ${apiPath}`,
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Success'
              }
            }
          }
        },
        '400': {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        '500': {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    };
    
    // Add request body for POST, PUT, PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      pathSpec[method.toLowerCase()].requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              description: 'Request payload'
            }
          }
        }
      };
    }
  });
  
  return { [apiPath]: pathSpec };
}

/**
 * Main function to generate Swagger documentation
 */
function generateSwaggerDocs() {
  console.log('🔍 Scanning API route files...');
  
  // Find all API route files
  const apiFiles = glob.sync('app/api/**/route.{ts,js}', {
    cwd: process.cwd(),
    absolute: false
  });
  
  console.log(`📁 Found ${apiFiles.length} API route files`);
  
  const spec = { ...baseSpec };
  
  apiFiles.forEach(filePath => {
    console.log(`📄 Processing: ${filePath}`);
    
    // Try to extract existing OpenAPI docs
    const existingDocs = extractOpenAPIDocs(filePath);
    
    if (existingDocs) {
      try {
        // Parse existing OpenAPI documentation (YAML format)
        const parsedDocs = yaml.load(existingDocs);
        Object.assign(spec.paths, parsedDocs);
        console.log(`✅ Extracted OpenAPI docs from ${filePath}`);
      } catch (error) {
        console.warn(`⚠️  Could not parse OpenAPI docs from ${filePath}: ${error.message}, generating basic spec`);
        Object.assign(spec.paths, generateBasicSpec(filePath));
      }
    } else {
      // Generate basic specification
      Object.assign(spec.paths, generateBasicSpec(filePath));
    }
  });
  
  // Create backup with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = `public/swagger-${timestamp}.json`;
  
  // Write main swagger.json
  const outputPath = 'public/swagger.json';
  fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));
  console.log(`📝 Generated ${outputPath}`);
  
  // Write backup
  fs.writeFileSync(backupPath, JSON.stringify(spec, null, 2));
  console.log(`💾 Created backup: ${backupPath}`);
  
  console.log(`🎉 Swagger documentation generated successfully!`);
  console.log(`📊 Total paths documented: ${Object.keys(spec.paths).length}`);
  console.log(`🏷️  Total tags defined: ${spec.tags ? spec.tags.length : 0}`);
  
  return spec;
}

// Run the generator
if (require.main === module) {
  try {
    generateSwaggerDocs();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error generating Swagger documentation:', error);
    process.exit(1);
  }
}

module.exports = { generateSwaggerDocs };