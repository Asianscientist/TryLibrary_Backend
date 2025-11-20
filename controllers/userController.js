const { User, Subscription, ReadingHistory, Book } = require('../models');

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }

    await user.update({ name, email });

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.upgradeSubscription = async (req, res) => {
  try {
    const { subscription_id } = req.body;

    if (!subscription_id) {
      return res.status(400).json({ message: 'Subscription ID is required' });
    }

    const subscription = await Subscription.findByPk(subscription_id);
    if (!subscription) {
      return res.status(404).json({ message: 'Subscription not found' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + subscription.duration_days);

    await req.user.update({
      subscription_id,
      subscription_expires_at: expiresAt
    });

    // Reload user with subscription details
    await req.user.reload({ include: [{ model: Subscription }] });

    res.json({
      success: true,
      message: 'Subscription upgraded successfully',
      data: {
        subscription: req.user.Subscription,
        subscription_expires_at: req.user.subscription_expires_at
      }
    });
  } catch (error) {
    console.error('Upgrade subscription error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getReadingHistory = async (req, res) => {
  try {
    const history = await ReadingHistory.findAll({
      where: { user_id: req.user.id },
      include: [{ 
        model: Book,
        attributes: ['id', 'title', 'author_name', 'cover_url', 'is_premium']
      }],
      order: [['last_read_at', 'DESC']]
    });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get reading history error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};