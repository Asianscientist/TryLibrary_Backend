const express = require('express');
const router = express.Router();

const {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  subscribeUser,
  unsubscribeUser
} = require('../controllers/subscriptionController');

const { protect, requireAdmin } = require('../middleware/auth');

/**
 * @openapi
 * /api/subscriptions:
 *   get:
 *     tags: [Subscriptions]
 *     summary: List available subscription plans
 *     responses:
 *       200:
 *         description: Array of subscription plans
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
 *                     $ref: '#/components/schemas/Subscription'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', listSubscriptions);

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Retrieve a subscription plan by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Subscription details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getSubscription);

/**
 * @openapi
 * /api/subscriptions:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Create a subscription plan
 *     description: Requires admin privileges.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SubscriptionRequest'
 *     responses:
 *       201:
 *         description: Subscription created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', protect, requireAdmin, createSubscription);

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   put:
 *     tags: [Subscriptions]
 *     summary: Update a subscription plan
 *     description: Requires admin privileges.
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
 *             $ref: '#/components/schemas/SubscriptionRequest'
 *     responses:
 *       200:
 *         description: Updated subscription
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
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
router.put('/:id', protect, requireAdmin, updateSubscription);

/**
 * @openapi
 * /api/subscriptions/{id}:
 *   delete:
 *     tags: [Subscriptions]
 *     summary: Delete a subscription plan
 *     description: Requires admin privileges.
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
 *         description: Subscription deleted
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
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', protect, requireAdmin, deleteSubscription);

/**
 * @openapi
 * /api/subscriptions/actions/subscribe:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Subscribe the authenticated user to a plan
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpgradeSubscriptionRequest'
 *     responses:
 *       200:
 *         description: Subscription activated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscription:
 *                       $ref: '#/components/schemas/Subscription'
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/actions/subscribe', protect, subscribeUser);

/**
 * @openapi
 * /api/subscriptions/actions/unsubscribe:
 *   post:
 *     tags: [Subscriptions]
 *     summary: Remove the authenticated user's active subscription
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User successfully unsubscribed
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/actions/unsubscribe', protect, unsubscribeUser);

module.exports = router;


