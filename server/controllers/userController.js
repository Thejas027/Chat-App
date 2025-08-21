const User = require('../models/User');

const userController = {};

// Get all users, except the current user
userController.getUsers = async (req, res) => {
  try {
    // Fetch all users except the logged-in user
    const users = await User.find({ _id: { $ne: req.user.id } }).select('-password');
    res.json({ success: true, data: { users } });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get current user's profile
userController.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update current user's profile (name, avatar)
userController.updateProfile = async (req, res) => {
  try {
    const { fullName, avatar } = req.body; // avatar is URL from /api/files/avatar upload
    const updates = {};
    if (typeof fullName === 'string' && fullName.trim()) updates.fullName = fullName.trim();
    if (typeof avatar === 'string') updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = userController;