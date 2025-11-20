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
  }
}, {
  tableName: 'books',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = Book;
