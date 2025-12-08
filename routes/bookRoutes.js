const express = require('express');
const router = express.Router();
const {
  getAllBooks,
  getBook,
  createBook,
  updateBook,
  deleteBook,
  updateReadingProgress,
  getBookStatus,
  getBookPage
} = require('../controllers/bookController');
const { protect, requireAdmin } = require('../middleware/auth');
const { bookValidation, validate } = require('../middleware/validation');
const upload = require('../config/multer');

/**
 * @openapi
 * /api/books:
 *   get:
 *     tags: [Books]
 *     summary: List books with optional filters
 *     description: Returns a paginated list of books. Premium books are filtered out for users without an active subscription.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by title or author
 *       - in: query
 *         name: genre
 *         schema:
 *           type: integer
 *         description: Filter by genre ID
 *       - in: query
 *         name: premium
 *         schema:
 *           type: boolean
 *         description: Explicitly include/exclude premium books
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of books
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
 *                     $ref: '#/components/schemas/Book'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', protect, getAllBooks);

/**
 * @openapi
 * /api/books/{id}:
 *   get:
 *     tags: [Books]
 *     summary: Retrieve a single book by ID
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Requested book
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', protect, getBook);

/**
 * @openapi
 * /api/books:
 *   post:
 *     tags: [Books]
 *     summary: Upload and create a new book with cover image
 *     description: Create a new book by uploading a book file and optional cover image. Requires admin privileges. Book content is processed asynchronously in the background.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - bookFile
 *             properties:
 *               title:
 *                 type: string
 *                 description: Book title
 *                 example: "The Great Gatsby"
 *               author_name:
 *                 type: string
 *                 description: Author name
 *                 example: "F. Scott Fitzgerald"
 *               description:
 *                 type: string
 *                 description: Book description or summary
 *                 example: "A classic American novel about the Jazz Age"
 *               genre_id:
 *                 type: integer
 *                 description: Genre ID (must exist in database)
 *                 example: 1
 *               publication_year:
 *                 type: integer
 *                 description: Year of publication
 *                 example: 1925
 *               is_premium:
 *                 type: boolean
 *                 description: Whether this is a premium book (subscription required)
 *                 default: false
 *               bookFile:
 *                 type: string
 *                 format: binary
 *                 description: Book file (PDF, EPUB, DOCX, etc.)
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Cover image file (optional)
 *     responses:
 *       201:
 *         description: Book created successfully and queued for background processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Book uploaded successfully. Processing in background."
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     title:
 *                       type: string
 *                     author_name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     genre_id:
 *                       type: integer
 *                     publication_year:
 *                       type: integer
 *                     file_url:
 *                       type: string
 *                       description: Path to stored book file
 *                     cover_url:
 *                       type: string
 *                       description: Path to stored cover image
 *                     is_premium:
 *                       type: boolean
 *                     processing_status:
 *                       type: string
 *                       enum: [pending, processing, completed, failed]
 *                       example: "pending"
 *                     file_format:
 *                       type: string
 *                       example: "pdf"
 *                     file_size:
 *                       type: integer
 *                       description: File size in bytes
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Forbidden - Admin access required
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/',
  protect,
  requireAdmin,
  upload.fields([
    { name: 'bookFile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 }
  ]),
  createBook
);


/**
 * @openapi
 * /api/books/{id}:
 *   put:
 *     tags: [Books]
 *     summary: Update an existing book
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookRequest'
 *     responses:
 *       200:
 *         description: Updated book details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Book'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */

router.put('/:id', protect, requireAdmin, updateBook);

/**
 * @openapi
 * /api/books/{id}:
 *   delete:
 *     tags: [Books]
 *     summary: Delete a book
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Book deleted confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', protect, requireAdmin, deleteBook);

/**
 * @openapi
 * /api/books/{id}/progress:
 *   post:
 *     tags: [Books]
 *     summary: Update reading progress for a specific book
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReadingProgressRequest'
 *     responses:
 *       200:
 *         description: Reading progress saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/ReadingHistory'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/progress', protect, updateReadingProgress);
router.get('/:id/status', protect, requireAdmin, getBookStatus);
router.get('/:id/pages/:pageNumber', protect, getBookPage);

module.exports = router;