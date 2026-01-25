const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// Valid roles for authorizing middleware: 'management' is required
// Additionally, we check req.user.isAdmin inside the handler for extra security if needed
// or we can rely on the fact that only management users can be admins

// @desc    Get all pending management users
// @route   GET /api/admin/pending
router.get('/pending', protect, authorize('management'), async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const pendingUsers = await User.find({
            role: 'management',
            isApproved: false
        }).select('-password');

        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Approve a management user
// @route   PUT /api/admin/approve/:id
router.put('/approve/:id', protect, authorize('management'), async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isApproved = true;
        await user.save();

        res.json({ message: 'User approved successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
