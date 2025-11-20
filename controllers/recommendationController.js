const { Recommendation, Book, ReadingHistory, User, Genre } = require('../models');
const { Op, fn, col, literal } = require('sequelize');

const LIKE_OPERATOR = Op.iLike || Op.like;
const ORDERABLE_FIELDS = ['created_at'];
const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

const buildWhereClause = (conditions = []) => {
  const filtered = conditions.filter(Boolean);
  if (!filtered.length) {
    return {};
  }
  if (filtered.length === 1) {
    return filtered[0];
  }
  return { [Op.and]: filtered };
};

const buildSearchClause = (search) => {
  if (!search) return null;
  const pattern = `%${search}%`;
  return {
    [Op.or]: [
      { reason: { [LIKE_OPERATOR]: pattern } },
      { '$RecommendedBook.title$': { [LIKE_OPERATOR]: pattern } },
      { '$RecommendedBook.author_name$': { [LIKE_OPERATOR]: pattern } }
    ]
  };
};

const buildRecommendationInclude = ({ genre } = {}) => [{
  model: Book,
  as: 'RecommendedBook',
  attributes: ['id', 'title', 'author_name', 'cover_url', 'genre_id', 'is_premium'],
  include: [{
    model: Genre,
    attributes: ['id', 'name'],
    ...(genre ? {
      where: { name: { [LIKE_OPERATOR]: `%${genre}%` } },
      required: true
    } : {})
  }]
}];

const buildOrder = (ordering, direction) => {
  const field = ORDERABLE_FIELDS.includes(ordering) ? ordering : 'created_at';
  const dir = direction && direction.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  return [[field, dir]];
};

const parsePagination = (query) => {
  const limit = Math.min(parseInt(query.limit, 10) || 20, 50);
  const offset = parseInt(query.offset, 10) || 0;
  return { limit, offset };
};

exports.getRecommendations = async (req, res) => {
  try {
    const { recommended_book, search, ordering, direction } = req.query;
    const { limit, offset } = parsePagination(req.query);

    const where = buildWhereClause([
      { user_id: req.user.id },
      recommended_book ? { recommended_book_id: recommended_book } : null,
      buildSearchClause(search)
    ]);

    const recommendations = await Recommendation.findAll({
      where,
      include: buildRecommendationInclude(),
      order: buildOrder(ordering, direction),
      limit,
      offset
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRecentRecommendations = async (req, res) => {
  try {
    const recommendations = await Recommendation.findAll({
      where: {
        user_id: req.user.id,
        created_at: { [Op.gte]: SEVEN_DAYS_AGO() }
      },
      include: buildRecommendationInclude(),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRecommendationsByGenre = async (req, res) => {
  try {
    const { genre } = req.query;
    const recommendations = await Recommendation.findAll({
      where: { user_id: req.user.id },
      include: buildRecommendationInclude({ genre }),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getUnreadRecommendations = async (req, res) => {
  try {
    const readEntries = await ReadingHistory.findAll({
      where: {
        user_id: req.user.id,
        progress: { [Op.gt]: 0 }
      },
      attributes: ['book_id'],
      raw: true
    });

    const readBookIds = readEntries.map((entry) => entry.book_id);

    const where = {
      user_id: req.user.id
    };

    if (readBookIds.length) {
      where.recommended_book_id = { [Op.notIn]: readBookIds };
    }

    const recommendations = await Recommendation.findAll({
      where,
      include: buildRecommendationInclude(),
      order: [['created_at', 'DESC']]
    });

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getPopularRecommendedBooks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const popularBooks = await Recommendation.findAll({
      attributes: [
        'recommended_book_id',
        [fn('COUNT', col('Recommendation.id')), 'recommendation_count']
      ],
      include: [{
        model: Book,
        as: 'RecommendedBook',
        attributes: ['id', 'title', 'author_name', 'cover_url']
      }],
      group: ['recommended_book_id', 'RecommendedBook.id'],
      order: [[literal('recommendation_count'), 'DESC']],
      limit
    });

    const data = popularBooks.map((entry) => ({
      book: entry.RecommendedBook,
      recommendation_count: Number(entry.get('recommendation_count'))
    }));

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getRecommendationStats = async (req, res) => {
  try {
    const sevenDaysAgo = SEVEN_DAYS_AGO();

    const [total, recentCount, genreStats] = await Promise.all([
      Recommendation.count({ where: { user_id: req.user.id } }),
      Recommendation.count({
        where: {
          user_id: req.user.id,
          created_at: { [Op.gte]: sevenDaysAgo }
        }
      }),
      Recommendation.findAll({
        where: { user_id: req.user.id },
        attributes: [
          [col('RecommendedBook->Genre.name'), 'genre'],
          [fn('COUNT', col('Recommendation.id')), 'count']
        ],
        include: [{
          model: Book,
          as: 'RecommendedBook',
          attributes: [],
          include: [{
            model: Genre,
            attributes: []
          }]
        }],
        group: ['RecommendedBook->Genre.id', 'RecommendedBook->Genre.name'],
        order: [[literal('count'), 'DESC']]
      })
    ]);

    const genre_distribution = genreStats.map((stat) => ({
      genre: stat.get('genre'),
      count: Number(stat.get('count'))
    }));

    res.json({
      success: true,
      data: {
        total_recommendations: total,
        recent_count: recentCount,
        genre_distribution
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.recommendToUser = async (req, res) => {
  try {
    const { user_id, recommended_book_id, reason } = req.body;

    if (!user_id || !recommended_book_id) {
      return res.status(400).json({ message: 'user_id and recommended_book_id are required' });
    }

    const [user, book] = await Promise.all([
      User.findByPk(user_id),
      Book.findByPk(recommended_book_id)
    ]);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }

    const recommendation = await Recommendation.create({
      user_id,
      recommended_book_id,
      reason: reason ? reason.trim() : 'Manual recommendation'
    });

    res.status(201).json({ success: true, data: recommendation });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.dismissRecommendation = async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: 'id query parameter is required' });
    }

    const deleted = await Recommendation.destroy({
      where: {
        id,
        user_id: req.user.id
      }
    });

    if (!deleted) {
      return res.status(404).json({ message: 'Recommendation not found' });
    }

    res.json({ success: true, message: 'Recommendation dismissed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.generateRecommendations = async (req, res) => {
  try {
    const readingHistory = await ReadingHistory.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Book }],
      order: [['last_read_at', 'DESC']],
      limit: 10
    });

    if (readingHistory.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'No reading history found'
      });
    }

    const genreIds = [...new Set(readingHistory.map((rh) => rh.Book.genre_id))];
    const readBookIds = readingHistory.map((rh) => rh.book_id);

    const recommendedBooks = await Book.findAll({
      where: buildWhereClause([
        genreIds.length ? { genre_id: { [Op.in]: genreIds } } : null,
        readBookIds.length ? { id: { [Op.notIn]: readBookIds } } : null,
        req.user.hasActiveSubscription()
          ? null
          : { is_premium: false }
      ]),
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    const recommendations = await Promise.all(
      recommendedBooks.map((book) =>
        Recommendation.create({
          user_id: req.user.id,
          recommended_book_id: book.id,
          reason: 'Based on your reading history'
        })
      )
    );

    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.generateSmartRecommendations = async (req, res) => {
  try {
    const completedBooks = await ReadingHistory.findAll({
      where: {
        user_id: req.user.id,
        progress: 100
      },
      include: [{ model: Book }],
      order: [['last_read_at', 'DESC']],
      limit: 20
    });

    if (!completedBooks.length) {
      return res.json({
        success: true,
        data: [],
        message: 'Complete some books to get personalized recommendations'
      });
    }

    const favoriteGenreIds = [...new Set(completedBooks.map((entry) => entry.Book.genre_id))];

    const [readBooks, alreadyRecommended] = await Promise.all([
      ReadingHistory.findAll({
        where: { user_id: req.user.id },
        attributes: ['book_id'],
        raw: true
      }),
      Recommendation.findAll({
        where: { user_id: req.user.id },
        attributes: ['recommended_book_id'],
        raw: true
      })
    ]);

    const excludedIds = [
      ...new Set([
        ...readBooks.map((entry) => entry.book_id),
        ...alreadyRecommended.map((entry) => entry.recommended_book_id)
      ])
    ];

    const smartBooks = await Book.findAll({
      where: buildWhereClause([
        favoriteGenreIds.length ? { genre_id: { [Op.in]: favoriteGenreIds } } : null,
        excludedIds.length ? { id: { [Op.notIn]: excludedIds } } : null,
        req.user.hasActiveSubscription()
          ? null
          : { is_premium: false }
      ]),
      limit: 5,
      order: [['created_at', 'DESC']]
    });

    if (!smartBooks.length) {
      return res.json({
        success: true,
        data: [],
        message: 'No new personalized recommendations available'
      });
    }

    const recommendations = await Promise.all(
      smartBooks.map((book) =>
        Recommendation.create({
          user_id: req.user.id,
          recommended_book_id: book.id,
          reason: `Based on your interest in ${book.genre_id ? 'similar genres' : 'recent reads'}`
        })
      )
    );

    res.json({
      success: true,
      data: recommendations,
      message: `Generated ${recommendations.length} personalized recommendations`
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};