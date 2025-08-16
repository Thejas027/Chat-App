const express = require('express');
const router = express.Router();
const { User } = require('../models');
const auth = require('../middleware/auth');
const userController = require('../controllers/userController');

// Apply authentication middleware
router.use(auth.authenticate);

// GET /api/users - Get all users (for testing/user discovery)
router.get('/', userController.getUsers);

// GET /api/users/me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .lean();
    
    res.json({
      success: true,
      data: user
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user info'
    });
  }
});

module.exports = router;
