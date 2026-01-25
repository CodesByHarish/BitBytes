const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all active announcements
// @route   GET /api/announcements
router.get('/', protect, async (req, res) => {
    try {
        const announcements = await Announcement.find({
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        }).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create an announcement (Management only)
// @route   POST /api/announcements
router.post('/', protect, authorize('management'), async (req, res) => {
    try {
        const { text, priority, expiresAt } = req.body;
        const announcement = await Announcement.create({
            text,
            priority,
            expiresAt,
            createdBy: req.user.id
        });
        res.status(201).json(announcement);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete an announcement (Management only)
// @route   DELETE /api/announcements/:id
router.delete('/:id', protect, authorize('management'), async (req, res) => {
    try {
        await Announcement.findByIdAndDelete(req.params.id);
        res.json({ message: 'Announcement deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
