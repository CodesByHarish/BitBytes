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

// @desc    Approve a management user with role assignment
// @route   PUT /api/admin/approve/:id
router.put('/approve/:id', protect, authorize('management'), async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { managementRole, staffSpecialization } = req.body;
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isApproved = true;
        if (managementRole) user.managementRole = managementRole;
        if (staffSpecialization) user.staffSpecialization = staffSpecialization;

        await user.save();

        res.json({ message: 'User approved successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get all approved management staff
// @route   GET /api/admin/staff
router.get('/staff', protect, authorize('management'), async (req, res) => {
    try {
        // Any approved management user can view staff list now
        const staff = await User.find({
            role: 'management',
            isApproved: true
        }).select('-password');

        res.json(staff);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update staff role and specialization
// @route   PUT /api/admin/staff/:id/role
router.put('/staff/:id/role', protect, authorize('management'), async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }

        const { managementRole, staffSpecialization } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'management') {
            return res.status(404).json({ message: 'Staff member not found' });
        }

        if (managementRole) user.managementRole = managementRole;
        // Specialization is only relevant for caretakers, but we can store it for others too
        user.staffSpecialization = staffSpecialization || null;

        await user.save();
        res.json({ message: 'Staff role updated', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
