const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const query = {
            $or: [
                { expiresAt: null },
                { expiresAt: { $gt: new Date() } }
            ]
        };

        // If user is a student, only show general or their specific hostel/block news
        if (req.user.role === 'student') {
            query.$and = [
                {
                    $or: [
                        { type: 'general' },
                        { type: { $exists: false } },
                        {
                            $and: [
                                { type: 'hostel' },
                                { hostel: req.user.hostel }
                            ]
                        },
                        {
                            $and: [
                                { type: 'block' },
                                {
                                    $or: [
                                        { block: req.user.block },
                                        { targetBlocks: req.user.block }
                                    ]
                                }
                            ]
                        },
                        {
                            $and: [
                                { type: 'role' },
                                { targetRoles: req.user.managementRole || 'student' }
                            ]
                        }
                    ]
                }
            ];
        } else if (req.user.role === 'management') {
            // Management sees all announcements they are allowed to see (usually everything for their hostel or global)
            // Simplified: let management see everything to monitor the system
            // If we want to restrict by hostel, we can add that here
        }

        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.json(announcements);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create an announcement (Management only)
// @route   POST /api/announcements
router.post('/', protect, authorize('management'), async (req, res) => {
    try {
        const { text, priority, expiresAt, deadlineDate, type, category, targetBlocks, targetRoles } = req.body;
        console.log('Creating Announcement - Full Body:', req.body);
        console.log('Targeting Info - Blocks:', targetBlocks, 'Roles:', targetRoles);

        let hostel = req.body.hostel || null;
        let block = req.body.block || null;

        // Only fallback if not using the new targeting fields
        if (['hostel', 'block'].includes(type) && !hostel && (!targetBlocks || targetBlocks.length === 0)) {
            hostel = req.user.hostel || null;
            block = req.user.block || null;
        }

        const announcement = await Announcement.create({
            text,
            priority,
            category: category || 'general',
            expiresAt,
            deadlineDate,
            type: type || 'general',
            hostel,
            block,
            targetBlocks: targetBlocks || [],
            targetRoles: targetRoles || [],
            createdBy: req.user._id
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

// @desc    Toggle upvote on an announcement
// @route   POST /api/announcements/:id/upvote
router.post('/:id/upvote', protect, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);
        if (!announcement) return res.status(404).json({ message: 'Announcement not found' });

        const index = announcement.upvotes.indexOf(req.user._id);
        if (index === -1) {
            announcement.upvotes.push(req.user._id);
        } else {
            announcement.upvotes.splice(index, 1);
        }

        await announcement.save();
        res.json({ upvotes: announcement.upvotes });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
