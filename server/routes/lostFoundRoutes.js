const express = require('express');
const router = express.Router();
const LostFound = require('../models/LostFound');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all lost/found items
// @route   GET /api/lost-found
router.get('/', protect, async (req, res) => {
    try {
        const items = await LostFound.find()
            .populate('reportedBy', 'email')
            .populate('claimant', 'email')
            .sort({ createdAt: -1 });
        res.json(items);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Report new item
// @route   POST /api/lost-found
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, type, location, date, media } = req.body;

        const item = await LostFound.create({
            title,
            description,
            type,
            location,
            date: date || new Date(),
            media: media || [],
            reportedBy: req.user.id,
            hostel: req.user.hostel,
            block: req.user.block
        });

        res.status(201).json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Submit a claim for a found item
// @route   PUT /api/lost-found/:id/claim
router.put('/:id/claim', protect, async (req, res) => {
    try {
        const { claimMessage } = req.body;
        const item = await LostFound.findById(req.params.id);

        if (!item) return res.status(404).json({ message: 'Item not found' });
        if (item.type !== 'found') return res.status(400).json({ message: 'Only found items can be claimed' });
        if (item.status !== 'open') return res.status(400).json({ message: 'Item is not available for claim' });

        item.claimant = req.user.id;
        item.claimMessage = claimMessage;
        item.moderationStatus = 'pending';
        item.status = 'claimed';

        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Moderate a claim (Admin/Caretaker)
// @route   PUT /api/lost-found/:id/moderate
router.put('/:id/moderate', protect, authorize('management'), async (req, res) => {
    try {
        const { action } = req.body; // 'approve' or 'reject'
        const item = await LostFound.findById(req.params.id);

        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (action === 'approve') {
            item.moderationStatus = 'approved';
            item.status = 'resolved';
        } else if (action === 'reject') {
            item.moderationStatus = 'rejected';
            item.status = 'open';
            item.claimant = null;
            item.claimMessage = null;
        }

        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete item
// @route   DELETE /api/lost-found/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        const item = await LostFound.findById(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        // Only reporter or admin can delete
        if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'management') {
            return res.status(403).json({ message: 'Not authorized to delete this item' });
        }

        await LostFound.findByIdAndDelete(req.params.id);
        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
