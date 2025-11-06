const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/users/profile/:id
// @access  Public
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get farmers by location
// @route   GET /api/users/farmers
// @access  Public
exports.getFarmers = async (req, res) => {
  try {
    const { county, page = 1, limit = 12 } = req.query;

    let query = { role: 'farmer' };

    if (county && county !== 'all') {
      query['profile.location.county'] = new RegExp(county, 'i');
    }

    const farmers = await User.find(query)
      .select('name profile avatar rating totalReviews')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1 });

    const total = await User.countDocuments(query);

    res.json({
      farmers,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
