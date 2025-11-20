require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres'
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('✓ PostgreSQL connected successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('✗ Connection failed:', err.message);
    process.exit(1);
  });