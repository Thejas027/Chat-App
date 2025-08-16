const User = require('../models/User');

const userController = {};

// Get all users, except the current user
userController.getUsers = async (req, res) => {
  try {
    // Fetch all users except the logged-in user
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = userController;