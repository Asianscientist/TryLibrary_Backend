const sequelize = require('../config/database');
const User = require('./User');
const Subscription = require('./Subscription');
const Book = require('./Book');
const Genre = require('./Genre');
const BorrowRecord = require('./BorrowRecord');
const ReadingHistory = require('./ReadingHistory');
const Recommendation = require('./Recommendation');

// Define associations
User.belongsTo(Subscription, { foreignKey: 'subscription_id' });
Subscription.hasMany(User, { foreignKey: 'subscription_id' });

Book.belongsTo(Genre, { foreignKey: 'genre_id' });
Genre.hasMany(Book, { foreignKey: 'genre_id' });

BorrowRecord.belongsTo(User, { foreignKey: 'user_id' });
BorrowRecord.belongsTo(Book, { foreignKey: 'book_id' });
User.hasMany(BorrowRecord, { foreignKey: 'user_id' });
Book.hasMany(BorrowRecord, { foreignKey: 'book_id' });

ReadingHistory.belongsTo(User, { foreignKey: 'user_id' });
ReadingHistory.belongsTo(Book, { foreignKey: 'book_id' });
User.hasMany(ReadingHistory, { foreignKey: 'user_id' });
Book.hasMany(ReadingHistory, { foreignKey: 'book_id' });

Recommendation.belongsTo(User, { foreignKey: 'user_id' });
Recommendation.belongsTo(Book, { foreignKey: 'recommended_book_id', as: 'RecommendedBook' });
User.hasMany(Recommendation, { foreignKey: 'user_id' });

module.exports = {
  sequelize,
  User,
  Subscription,
  Book,
  Genre,
  BorrowRecord,
  ReadingHistory,
  Recommendation
};