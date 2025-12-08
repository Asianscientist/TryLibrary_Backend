
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Book = sequelize.define('Book', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  author_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT
  },
  genre_id: {
    type: DataTypes.INTEGER,
    references: {
      model: 'genres',
      key: 'id'
    }
  },
  publication_year: {
    type: DataTypes.INTEGER
  },
  file_url: {
    type: DataTypes.STRING
  },
  cover_url: {
    type: DataTypes.STRING
  },
  is_premium: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  processing_status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending'
  },
  total_pages: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  file_format: {
    type: DataTypes.STRING
  },
  file_size: {
    type: DataTypes.INTEGER
  }
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Book;