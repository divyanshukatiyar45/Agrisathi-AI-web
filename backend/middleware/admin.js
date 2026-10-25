const User = require('../models/User');

// Sirf admin role wale user ko aage jaane deta hai (auth ke baad lagta hai)
module.exports = async function admin(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('role');
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};