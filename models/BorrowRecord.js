const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BorrowRecord = sequelize.define('BorrowRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  book_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'books',
      key: 'id'
    }
  },
  borrowed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  returned_at: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'borrow_records',
  timestamps: false
});

module.exports = BorrowRecord;