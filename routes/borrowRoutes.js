const express = require('express');
const router = express.Router();
const {
  borrowBook,
  returnBook,
  getUserBorrowHistory,
  getActiveBorrows
} = require('../controllers/borrowController');
const { protect } = require('../middleware/auth');

/**
 * @openapi
 * /api/borrows/borrow:
 *   post:
 *     tags: [Borrows]
 *     summary: Borrow a book
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BorrowRequest'
 *     responses:
 *       201:
 *         description: Borrow record created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BorrowRecord'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/borrow', protect, borrowBook);

/**
 * @openapi
 * /api/borrows/return/{id}:
 *   put:
 *     tags: [Borrows]
 *     summary: Return a borrowed book
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Borrow record ID
 *     responses:
 *       200:
 *         description: Borrow record updated with return timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BorrowRecord'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/return/:id', protect, returnBook);

/**
 * @openapi
 * /api/borrows/history:
 *   get:
 *     tags: [Borrows]
 *     summary: Retrieve the authenticated user's borrowing history
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All borrow records, including returned books
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
 *                     $ref: '#/components/schemas/BorrowRecord'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/history', protect, getUserBorrowHistory);

/**
 * @openapi
 * /api/borrows/active:
 *   get:
 *     tags: [Borrows]
 *     summary: List currently borrowed books that have not been returned
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Active borrow records
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
 *                     $ref: '#/components/schemas/BorrowRecord'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/active', protect, getActiveBorrows);

module.exports = router;