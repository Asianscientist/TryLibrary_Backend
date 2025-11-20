const { Subscription, User } = require('../models');

const normalizeName = (name) => (name ? name.trim() : '');
const normalizeDescription = (description) => (description ? description.trim() : null);

const validatePayload = ({ name, price, duration_days }) => {
  if (!name || !name.trim()) {
    return 'Name is required';
  }

  if (duration_days === undefined || duration_days === null) {
    return 'duration_days is required';
  }

  const parsedDuration = Number(duration_days);
  if (!Number.isInteger(parsedDuration) || parsedDuration < 0) {
    return 'duration_days must be a non-negative integer';
  }

  if (price === undefined || price === null) {
    return 'price is required';
  }

  const parsedPrice = Number(price);
  if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
    return 'price must be a non-negative number';
  }

  return null;
};

const calculateExpirationDate = (durationDays) => {
  if (!durationDays || durationDays <= 0) {
    return null;
  }

  const expiration = new Date();
  expiration.setDate(expiration.getDate() + durationDays);
  return expiration;
};

exports.listSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.findAll({
      order: [
        ['price', 'ASC'],
        ['name', 'ASC']
      ]
    });

    res.json({ success: true, data: subscriptions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.createSubscription = async (req, res) => {
  try {
    const validationError = validatePayload(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, description, price, duration_days } = req.body;

    const subscription = await Subscription.create({
      name: normalizeName(name),
      description: normalizeDescription(description),
      price,
      duration_days
    });

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const validationError = validatePayload({
      name: req.body.name ?? subscription.name,
      price: req.body.price ?? subscription.price,
      duration_days: req.body.duration_days ?? subscription.duration_days
    });

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const { name, description, price, duration_days } = req.body;

    await subscription.update({
      name: name !== undefined ? normalizeName(name) : subscription.name,
      description: description !== undefined ? normalizeDescription(description) : subscription.description,
      price: price !== undefined ? price : subscription.price,
      duration_days: duration_days !== undefined ? duration_days : subscription.duration_days
    });

    res.json({ success: true, data: subscription });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByPk(req.params.id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const userCount = await User.count({ where: { subscription_id: subscription.id } });

    if (userCount > 0) {
      return res.status(400).json({ message: 'Cannot delete a subscription assigned to users' });
    }

    await subscription.destroy();

    res.json({ success: true, message: 'Subscription deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.subscribeUser = async (req, res) => {
  try {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ message: 'subscription_id is required' });
    }

    const subscription = await Subscription.findByPk(subscription_id);

    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const expires_at = calculateExpirationDate(subscription.duration_days);

    await req.user.update({
      subscription_id: subscription.id,
      subscription_expires_at: expires_at
    });

    res.json({
      success: true,
      message: `Successfully subscribed to ${subscription.name}`,
      data: {
        subscription,
        expires_at
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.unsubscribeUser = async (req, res) => {
  try {
    await req.user.update({
      subscription_id: null,
      subscription_expires_at: null
    });

    res.json({
      success: true,
      message: 'Successfully unsubscribed. You are now on the basic plan.'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

