const { Book, Genre, ReadingHistory } = require('../models');
const { Op } = require('sequelize');

exports.getAllBooks = async (req, res) => {
  try {
    const { search, genre, premium } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { author_name: { [Op.like]: `%${search}%` } }
      ];
    }

    if (genre) {
      where.genre_id = genre;
    }

    if (premium !== undefined) {
      where.is_premium = premium === 'true';
    }

    // If user doesn't have premium, filter out premium books
    if (!req.user.hasActiveSubscription()) {
      where.is_premium = false;
    }

    const { count, rows: books } = await Book.findAndCountAll({
      where,
      include: [{ model: Genre }],
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: books,
      pagination: {
        total: count,
        page,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Genre }]
    });

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createBook = async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.update(req.body);

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    await book.destroy();

    res.json({
      success: true,
      message: 'Book deleted'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateReadingProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const { id: book_id } = req.params;

    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    const [history, created] = await ReadingHistory.findOrCreate({
      where: {
        user_id: req.user.id,
        book_id
      },
      defaults: {
        progress,
        last_read_at: new Date()
      }
    });

    if (!created) {
      await history.update({
        progress,
        last_read_at: new Date()
      });
    }

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
