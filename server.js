const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { sequelize } = require('./models');
const { connectRedis } = require('./config/redis'); // ADD THIS
const bookProcessingQueue = require('./queues/bookProcessingQueue');
const testRoutes = require('./routes/testRoutes'); // ADD THIS

const { swaggerUi, specs: swaggerSpec } = require('./swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const genreRoutes = require('./routes/genreRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

// Swagger documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/test', testRoutes); // ADD THIS

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (uploaded books and covers)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/borrows', borrowRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

/**
 * @openapi
 * /api/health:
 *   get:
 *     summary: Health check for server
 *     description: Returns the status of the API
 *     responses:
 *       200:
 *         description: Server is running
 */
app.get('/api/health', async (req, res) => {
  try {
    await sequelize.authenticate();

    const waiting = await bookProcessingQueue.getWaitingCount();
    const active = await bookProcessingQueue.getActiveCount();

    res.json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: 'connected',
        redis: 'connected',
        queue: {
          waiting,
          active
        }
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      message: 'Service unavailable',
      error: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      books: '/api/books',
      borrows: '/api/borrows',
      recommendations: '/api/recommendations',
      genres: '/api/genres',
      subscriptions: '/api/subscriptions',
      health: '/api/health',
      test: '/api/test' // ADD THIS
    },
    features: {
      fileUpload: 'enabled',
      backgroundProcessing: 'enabled',
      supportedFormats: ['PDF', 'EPUB', 'DOCX', 'TXT']
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    // Sync database models
    await sequelize.sync({
      alter: process.env.NODE_ENV === 'development'
    });
    console.log('✓ Database models synchronized');

    // Test Redis connection
    try {
      await bookProcessingQueue.client.ping();
      console.log('✓ Redis connected successfully');
      console.log('✓ Background job queue initialized');
    } catch (redisError) {
      console.warn('⚠ Redis connection failed. Background processing disabled.');
      console.warn('  Install Redis: sudo apt-get install redis-server (Ubuntu)');
      console.warn('  Or: brew install redis (macOS)');
    }

    // Start server
    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`✓ Upload directory: ${path.join(__dirname, 'uploads')}`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully...');

  // Close queue
  await bookProcessingQueue.close();
  console.log('✓ Queue closed');

  // Close database
  await sequelize.close();
  console.log('✓ Database connection closed');

  process.exit(0);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();

module.exports = app;