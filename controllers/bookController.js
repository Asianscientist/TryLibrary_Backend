// controllers/bookController.js
const { Book, BookPage, Genre, ReadingHistory } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const bookProcessingQueue = require('../queues/bookProcessingQueue');

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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get single book by ID
exports.getBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      include: [{ model: Genre }]
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new book (with file upload)
exports.createBook = async (req, res) => {
  try {
    const { title, author_name, description, genre_id, publication_year, is_premium } = req.body;

    // Check if files were uploaded
    if (!req.files || !req.files.bookFile) {
      return res.status(400).json({
        success: false,
        message: 'Book file is required'
      });
    }

    const bookFile = req.files.bookFile[0];
    const coverFile = req.files.coverImage ? req.files.coverImage[0] : null;

    // Create file URLs (relative paths)
    const fileUrl = `/uploads/books/${bookFile.filename}`;
    const coverUrl = coverFile ? `/uploads/covers/${coverFile.filename}` : null;

    // Create book record
    const book = await Book.create({
      title,
      author_name,
      description,
      genre_id: parseInt(genre_id),
      publication_year: publication_year ? parseInt(publication_year) : null,
      file_url: fileUrl,
      cover_url: coverUrl,
      is_premium: is_premium === 'true',
      processing_status: 'pending',
      file_format: path.extname(bookFile.originalname).substring(1),
      file_size: bookFile.size
    });

    // Queue processing job
    await bookProcessingQueue.add({
      bookId: book.id,
      filePath: bookFile.path,
      mimeType: bookFile.mimetype
    });

    res.status(201).json({
      success: true,
      message: 'Book uploaded successfully. Processing in background.',
      data: book
    });

  } catch (error) {
    console.error('Create book error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update existing book
exports.updateBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await book.update(req.body);

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete book
exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    await book.destroy();

    res.json({
      success: true,
      message: 'Book deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update reading progress
exports.updateReadingProgress = async (req, res) => {
  try {
    const { progress } = req.body;
    const { id: book_id } = req.params;

    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get book processing status
exports.getBookStatus = async (req, res) => {
  try {
    const book = await Book.findByPk(req.params.id, {
      attributes: ['id', 'title', 'processing_status', 'total_pages']
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const statusMessages = {
      'pending': 'Queued for processing...',
      'processing': 'Extracting text and creating pages...',
      'completed': 'Book is ready to read!',
      'failed': 'Processing failed. Please contact support.'
    };

    res.json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        status: book.processing_status,
        totalPages: book.total_pages,
        message: statusMessages[book.processing_status]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get book page content
exports.getBookPage = async (req, res) => {
  try {
    const { id: bookId, pageNumber } = req.params;
    const page = parseInt(pageNumber);

    // Check book access
    const book = await Book.findByPk(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({
        success: false,
        message: 'Premium subscription required'
      });
    }

    if (book.processing_status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Book is still being processed',
        status: book.processing_status
      });
    }

    // Get page content
    const pageContent = await BookPage.findOne({
      where: {
        book_id: bookId,
        page_number: page
      }
    });

    if (!pageContent) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      data: {
        pageNumber: page,
        content: pageContent.content,
        totalPages: book.total_pages,
        hasNext: page < book.total_pages,
        hasPrevious: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export all functions
// module.exports = {
//   getBook,
//   getAllBooks,
//   createBook,
//   updateBook,
//   deleteBook,
//   updateReadingProgress,
//   getBookStatus,
//   getBookPage
// };