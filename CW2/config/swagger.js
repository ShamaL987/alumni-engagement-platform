const swaggerJsDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Alumni Influencers API',
      version: '2.0.0',
      description:
          'API documentation for alumni registration, profile management, professional development records, blind bidding, analytics, API key scoping, and featured alumnus retrieval.'
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Local API server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        },
        apiKeyAuth: {
          type: 'http',
          scheme: 'bearer',
          description: 'Scoped API key sent as an Authorization Bearer token.'
        }
      }
    }
  },
  apis: ['./routes/api/*.js']
};

module.exports = swaggerJsDoc(options);