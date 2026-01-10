const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);

// Approval Routes (Admin Only)
const { getPendingUsers, approveUser } = require('../controllers/auth.controller');
const { authorize } = require('../middleware/auth.middleware');

router.get('/pending', protect, authorize('admin'), getPendingUsers);
router.put('/approve/:id', protect, authorize('admin'), approveUser);

module.exports = router;
