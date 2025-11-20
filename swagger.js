const path = require('path');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const port = process.env.PORT || 3000;
const baseUrl = process.env.API_BASE_URL || `http://localhost:${port}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Library Management System API',
      version: '1.0.0',
      description:
        'Comprehensive API documentation for the Library Management System backend.'
    },
    servers: [
      {
        url: baseUrl,
        description: 'Current environment'
      }
    ],
    tags: [
      { name: 'Auth', description: 'Authentication and profile endpoints' },
      { name: 'Users', description: 'User profile and subscription management' },
      { name: 'Books', description: 'Book catalog management and reading progress' },
      { name: 'Borrows', description: 'Borrowing workflow' },
      { name: 'Recommendations', description: 'Personalized recommendation suite' },
      { name: 'Genres', description: 'Genre catalog management' },
      { name: 'Subscriptions', description: 'Subscription plans and actions' },
      { name: 'Utility', description: 'Utility endpoints such as health checks' }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Include a valid JWT in the Authorization header as `Bearer <token>`.'
        }
      },
      responses: {
        Unauthorized: {
          description: 'JWT is missing, invalid or expired',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        Forbidden: {
          description: 'User lacks necessary permissions for this resource',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        NotFound: {
          description: 'Requested resource was not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Request payload is invalid or missing required fields',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        },
        ServerError: {
          description: 'Unexpected error occurred on the server',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' }
            }
          }
        }
      },
      schemas: {
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Server error' },
            error: { type: 'string', nullable: true }
          }
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            pages: { type: 'integer', example: 5 }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['fullname', 'email', 'password'],
          properties: {
            fullname: { type: 'string', example: 'Alice Reader' },
            email: { type: 'string', format: 'email', example: 'alice@example.com' },
            password: { type: 'string', format: 'password', minLength: 6 }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', format: 'password' }
          }
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            token: { type: 'string' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        CurrentUserResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            fullname: { type: 'string', example: 'Alice Reader' },
            name: { type: 'string', example: 'Alice Reader' },
            email: { type: 'string', format: 'email' },
            is_admin: { type: 'boolean', example: false },
            subscription: { $ref: '#/components/schemas/Subscription' },
            subscription_id: { type: 'integer', nullable: true },
            subscription_expires_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        UpdateProfileRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Alice Reader' },
            email: { type: 'string', format: 'email' }
          }
        },
        Book: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            author_name: { type: 'string' },
            description: { type: 'string', nullable: true },
            genre_id: { type: 'integer', nullable: true },
            publication_year: { type: 'integer', nullable: true },
            file_url: { type: 'string', nullable: true },
            cover_url: { type: 'string', nullable: true },
            is_premium: { type: 'boolean' }
          }
        },
        BookRequest: {
          type: 'object',
          required: ['title', 'author_name'],
          properties: {
            title: { type: 'string' },
            author_name: { type: 'string' },
            description: { type: 'string', nullable: true },
            genre_id: { type: 'integer', nullable: true },
            publication_year: { type: 'integer', nullable: true },
            file_url: { type: 'string', nullable: true },
            cover_url: { type: 'string', nullable: true },
            is_premium: { type: 'boolean', default: false }
          }
        },
        ReadingProgressRequest: {
          type: 'object',
          required: ['progress'],
          properties: {
            progress: {
              type: 'number',
              minimum: 0,
              maximum: 100,
              example: 42.5,
              description: 'Completion percentage for the book'
            }
          }
        },
        BorrowRecord: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            book_id: { type: 'integer' },
            borrowed_at: { type: 'string', format: 'date-time' },
            returned_at: { type: 'string', format: 'date-time', nullable: true }
          }
        },
        BorrowRequest: {
          type: 'object',
          required: ['book_id'],
          properties: {
            book_id: { type: 'integer', example: 12 }
          }
        },
        ReadingHistory: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            book_id: { type: 'integer' },
            progress: { type: 'number', minimum: 0, maximum: 100 },
            last_read_at: { type: 'string', format: 'date-time' },
            Book: { $ref: '#/components/schemas/Book' }
          }
        },
        Genre: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' }
          }
        },
        GenreRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Science Fiction' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', format: 'float' },
            duration_days: { type: 'integer' }
          }
        },
        SubscriptionRequest: {
          type: 'object',
          required: ['name', 'price', 'duration_days'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            price: { type: 'number', example: 9.99 },
            duration_days: { type: 'integer', example: 30 }
          }
        },
        Recommendation: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            user_id: { type: 'integer' },
            recommended_book_id: { type: 'integer' },
            reason: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        },
        RecommendationRequest: {
          type: 'object',
          required: ['user_id', 'recommended_book_id'],
          properties: {
            user_id: { type: 'integer' },
            recommended_book_id: { type: 'integer' },
            reason: { type: 'string', example: 'Because you liked ...' }
          }
        },
        UpgradeSubscriptionRequest: {
          type: 'object',
          required: ['subscription_id'],
          properties: {
            subscription_id: { type: 'integer', example: 2 }
          }
        }
      }
    }
  },
  apis: [
    path.join(__dirname, 'routes/*.js'),
    path.join(__dirname, 'server.js')
  ]
};

const specs = swaggerJsDoc(options);

module.exports = { swaggerUi, specs };
