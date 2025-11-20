const { BorrowRecord, Book, User } = require('../models');

exports.borrowBook = async (req, res) => {
  try {
    const { book_id } = req.body;

    const book = await Book.findByPk(book_id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    if (book.is_premium && !req.user.hasActiveSubscription()) {
      return res.status(403).json({ message: 'Premium subscription required' });
    }

    const activeBorrow = await BorrowRecord.findOne({
      where: {
        user_id: req.user.id,
        book_id,
        returned_at: null
      }
    });

    if (activeBorrow) {
      return res.status(400).json({ message: 'Book already borrowed' });
    }

    const borrowRecord = await BorrowRecord.create({
      user_id: req.user.id,
      book_id
    });

    res.status(201).json({
      success: true,
      data: borrowRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.returnBook = async (req, res) => {
  try {
    const { id } = req.params;

    const borrowRecord = await BorrowRecord.findOne({
      where: {
        id,
        user_id: req.user.id,
        returned_at: null
      }
    });

    if (!borrowRecord) {
      return res.status(404).json({ message: 'Borrow record not found' });
    }

    await borrowRecord.update({ returned_at: new Date() });

    res.json({
      success: true,
      data: borrowRecord
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUserBorrowHistory = async (req, res) => {
  try {
    const records = await BorrowRecord.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Book }],
      order: [['borrowed_at', 'DESC']]
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getActiveBorrows = async (req, res) => {
  try {
    const records = await BorrowRecord.findAll({
      where: {
        user_id: req.user.id,
        returned_at: null
      },
      include: [{ model: Book }]
    });

    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};