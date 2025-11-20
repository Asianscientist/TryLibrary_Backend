const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./models');

const { swaggerUi, specs: swaggerSpec } = require('./swagger');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const bookRoutes = require('./routes/bookRoutes');
const borrowRoutes = require('./routes/borrowRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const genreRoutes = require('./routes/genreRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');

const app = express();

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}


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
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
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
    }
  });
});


app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

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
    await sequelize.authenticate();
    console.log('✓ Database connected successfully');

    await sequelize.sync({
      alter: process.env.NODE_ENV === 'development'
    });
    console.log('✓ Database models synchronized');

    app.listen(PORT, () => {
      console.log('========================================');
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Docs: http://localhost:${PORT}/api-docs`);
      console.log('========================================');
    });
  } catch (error) {
    console.error('✗ Unable to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

startServer();

module.exports = app;
