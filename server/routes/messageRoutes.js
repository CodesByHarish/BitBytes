const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const LostFound = require('../models/LostFound');
const { protect } = require('../middleware/authMiddleware');

// @desc    Get messages for a specific item
// @route   GET /api/messages/:itemId
router.get('/:itemId', protect, async (req, res) => {
    try {
        const item = await LostFound.findOne({ _id: req.params.itemId })
            .populate('reportedBy', 'email')
            .populate('claimant', 'email');

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const isReporter = item.reportedBy?.email === req.user.email;
        const isClaimant = item.claimant?.email === req.user.email;
        const isManagement = req.user.role === 'management';

        if (!isReporter && !isClaimant && !isManagement) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const messages = await Message.find({ lostFoundId: req.params.itemId })
            .populate('sender', 'email')
            .sort({ createdAt: 1 });

        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Send a message
// @route   POST /api/messages/:itemId
router.post('/:itemId', protect, async (req, res) => {
    try {
        const { text } = req.body;
        const item = await LostFound.findOne({ _id: req.params.itemId })
            .populate('reportedBy', 'email')
            .populate('claimant', 'email');

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const isReporter = item.reportedBy?.email === req.user.email;
        const isClaimant = item.claimant?.email === req.user.email;
        const isManagement = req.user.role === 'management';

        if (!isReporter && !isClaimant && !isManagement) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const message = await Message.create({
            lostFoundId: req.params.itemId,
            sender: req.user._id,
            text
        });

        const populatedMessage = await Message.findById(message._id).populate('sender', 'email');
        res.status(201).json(populatedMessage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
