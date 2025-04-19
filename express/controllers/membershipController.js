const User = require('../models/userModel');

// Get current user's membership status (requires auth middleware to set req.user)
exports.getStatus = async (req, res) => {
  try {
    // Find the user in the database (to get latest info)
    const user = await User.findById(req.user.userId).select('email userName role plan');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Return user membership info
    return res.json({
      success: true,
      data: {
        email: user.email,
        userName: user.userName,
        role: user.role,
        plan: user.plan
      }
    });
  } catch (err) {
    console.error('Error fetching membership status:', err);
    return res.status(500).json({ success: false, message: 'Server error retrieving membership status' });
  }
};
