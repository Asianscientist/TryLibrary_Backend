// models/bookPage.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const BookPage = sequelize.define('BookPage', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    book_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'books',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    page_number: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    }
}, {
    tableName: 'book_pages',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
        {
            unique: true,
            fields: ['book_id', 'page_number']
        }
    ]
});

module.exports = BookPage;