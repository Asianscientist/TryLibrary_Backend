const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getRecentRecommendations,
  getRecommendationsByGenre,
  getUnreadRecommendations,
  getPopularRecommendedBooks,
  getRecommendationStats,
  recommendToUser,
  dismissRecommendation,
  generateRecommendations,
  generateSmartRecommendations
} = require('../controllers/recommendationController');
const { protect } = require('../middleware/auth');

/**
 * @openapi
 * /api/recommendations:
 *   get:
 *     tags: [Recommendations]
 *     summary: List recommendations for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: recommended_book
 *         schema:
 *           type: integer
 *         description: Filter by recommended book ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search across book title, author, and reason
 *       - in: query
 *         name: ordering
 *         schema:
 *           type: string
 *           enum: [created_at]
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Recommendation list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', protect, getRecommendations);

/**
 * @openapi
 * /api/recommendations/recent:
 *   get:
 *     tags: [Recommendations]
 *     summary: Fetch recommendations from the last 7 days
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Recent recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/recent', protect, getRecentRecommendations);

/**
 * @openapi
 * /api/recommendations/by-genre:
 *   get:
 *     tags: [Recommendations]
 *     summary: Filter recommendations by genre
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: genre
 *         schema:
 *           type: string
 *         description: Genre name or partial match
 *     responses:
 *       200:
 *         description: Recommendations filtered by genre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/by-genre', protect, getRecommendationsByGenre);

/**
 * @openapi
 * /api/recommendations/unread:
 *   get:
 *     tags: [Recommendations]
 *     summary: Recommendations whose books the user has not yet started reading
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/unread', protect, getUnreadRecommendations);

/**
 * @openapi
 * /api/recommendations/popular-books:
 *   get:
 *     tags: [Recommendations]
 *     summary: Fetch popular recommended books across all users
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Popularly recommended books
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       book:
 *                         $ref: '#/components/schemas/Book'
 *                       recommendation_count:
 *                         type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/popular-books', protect, getPopularRecommendedBooks);

/**
 * @openapi
 * /api/recommendations/stats:
 *   get:
 *     tags: [Recommendations]
 *     summary: Retrieve recommendation statistics for the user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Aggregate statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_recommendations:
 *                       type: integer
 *                     recent_count:
 *                       type: integer
 *                     genre_distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           genre:
 *                             type: string
 *                           count:
 *                             type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/stats', protect, getRecommendationStats);

/**
 * @openapi
 * /api/recommendations/recommend-to-user:
 *   post:
 *     tags: [Recommendations]
 *     summary: Manually create a recommendation for a user
 *     description: Typically restricted to staff tooling; requires authentication.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RecommendationRequest'
 *     responses:
 *       201:
 *         description: Recommendation created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Recommendation'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/recommend-to-user', protect, recommendToUser);

/**
 * @openapi
 * /api/recommendations/dismiss:
 *   delete:
 *     tags: [Recommendations]
 *     summary: Dismiss a recommendation by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Recommendation dismissed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/dismiss', protect, dismissRecommendation);

/**
 * @openapi
 * /api/recommendations/generate:
 *   post:
 *     tags: [Recommendations]
 *     summary: Generate recommendations from recent reading history
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Generated recommendations (may be empty)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *                 message:
 *                   type: string
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/generate', protect, generateRecommendations);

/**
 * @openapi
 * /api/recommendations/generate-smart:
 *   post:
 *     tags: [Recommendations]
 *     summary: Generate smart recommendations based on completed books
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Smart recommendation results
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Recommendation'
 *                 message:
 *                   type: string
 *                   nullable: true
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/generate-smart', protect, generateSmartRecommendations);

module.exports = router;

// {
//   "fullname": "Alice Reader",
//   "email": "alice@example.com",
//   "password": "secret123"
// }                                        