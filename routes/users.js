const express = require('express');
const {
  getUserProfile,
  updateProfile,
  getFarmers
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/farmers', getFarmers);
router.get('/profile/:id', getUserProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
