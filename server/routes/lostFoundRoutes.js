const express = require('express');
const router = express.Router();
const LostFound = require('../models/LostFound');
const { protect, authorize } = require('../middleware/authMiddleware');

// @desc    Get all lost/found items
// @route   GET /api/lost-found
router.get('/', protect, async (req, res) => {
    try {
        const query = {};

        // Students only see approved items
        if (req.user.role === 'student') {
            query.isApproved = true;
        }

        const items = await LostFound.find(query)
            .populate('reportedBy', '_id email')
            .populate('claimant', '_id email')
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
        const { title, description, type, category, location, date, media } = req.body;

        const item = await LostFound.create({
            title,
            description,
            type,
            category: category || 'others',
            location,
            date: date || new Date(),
            media: media || [],
            reportedBy: req.user.id,
            hostel: req.user.hostel,
            block: req.user.block,
            isApproved: req.user.role === 'management' // Auto-approve if management posts
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
        console.log(`Claim Attempt - Item: ${req.params.id}, Claimant: ${req.user._id}`);

        const item = await LostFound.findById(req.params.id);

        if (!item) {
            console.log('Claim Error: Item not found');
            return res.status(404).json({ message: 'Item not found' });
        }

        console.log(`Item Found - Type: ${item.type}, Status: ${item.status}, Reporter: ${item.reportedBy}`);

        if (item.status !== 'open') {
            console.log(`Claim Error: Item status is ${item.status}, not 'open'`);
            return res.status(400).json({ message: 'Item is not available' });
        }

        if (item.reportedBy.toString() === req.user._id.toString()) {
            console.log('Claim Error: Self-claim attempted');
            return res.status(400).json({ message: 'You cannot claim your own item' });
        }

        const userId = req.user._id || req.user.id;
        const updatedItem = await LostFound.findByIdAndUpdate(
            req.params.id,
            {
                claimant: userId,
                status: 'claimed',
                isResolutionRequested: false
            },
            { new: true, runValidators: false }
        );

        if (!updatedItem) {
            console.log('Claim Error: Update failed, item not found after check');
            return res.status(404).json({ message: 'Update failed, item not found' });
        }

        console.log('Item claimed successfully, chat now available');
        res.json(updatedItem);
    } catch (error) {
        console.error('Claim Error - Exception:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Moderate a claim (Admin/Caretaker)
// @route   PUT /api/lost-found/:id/moderate
router.put('/:id/moderate', protect, authorize('management'), async (req, res) => {
    try {
        const { action } = req.body; // 'approve_post', 'reject_post', 'approve_claim', 'reject_claim'
        const item = await LostFound.findById(req.params.id);

        if (!item) return res.status(404).json({ message: 'Item not found' });

        if (action === 'approve_post') {
            item.isApproved = true;
        } else if (action === 'reject_post') {
            await LostFound.findByIdAndDelete(req.params.id);
            return res.json({ message: 'Post rejected and deleted' });
        } else if (action === 'approve_claim') {
            item.status = 'resolved';
            item.isResolutionRequested = false;
        } else if (action === 'reject_claim') {
            item.status = 'open';
            item.claimant = null;
            item.isResolutionRequested = false;
        }
        await item.save();
        res.json(item);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Request final resolution for an item
router.put('/:id/request-resolution', protect, async (req, res) => {
    try {
        const item = await LostFound.findById(req.params.id)
            .populate('reportedBy', 'email')
            .populate('claimant', 'email');

        if (!item) return res.status(404).json({ message: 'Item not found' });

        const isReporter = item.reportedBy?.email === req.user.email;
        const isClaimant = item.claimant?.email === req.user.email;

        if (!isReporter && !isClaimant) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        item.isResolutionRequested = true;
        await item.save();
        res.json({ message: 'Resolution request sent to management', item });
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
