const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const LostFound = require('../models/LostFound');
const { protect } = require('../middleware/authMiddleware');

// @desc    Add a comment
// @route   POST /api/comments
router.post('/', protect, async (req, res) => {
    try {
        const { content, entityId, entityType, parentId } = req.body;

        // Authorization check for LostFound
        if (entityType === 'LostFound') {
            const item = await LostFound.findById(entityId);
            if (!item) return res.status(404).json({ message: 'Item not found' });

            const reporterId = item.reportedBy?._id?.toString() || item.reportedBy?.toString();
            const claimantId = item.claimant?._id?.toString() || item.claimant?.toString();
            const userId = req.user._id.toString();

            const isReporter = reporterId === userId;
            const isClaimant = claimantId === userId;
            const isSubAdmin = req.user.managementRole === 'subadmin';
            const isSuperAdmin = req.user.isAdmin;

            if (!isReporter && !isClaimant && !isSubAdmin && !isSuperAdmin) {
                return res.status(403).json({ message: 'Not authorized to participate in this discussion' });
            }
        }

        const comment = await Comment.create({
            content,
            author: req.user._id,
            entityId,
            entityType,
            parentId: parentId || null
        });

        // Populate author for immediate UI update
        const populatedComment = await Comment.findById(comment._id).populate('author', 'email role managementRole isAdmin');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('ERROR in POST /api/comments:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    Get comments for an entity
// @route   GET /api/comments/:entityType/:entityId
router.get('/:entityType/:entityId', protect, async (req, res) => {
    try {
        const { entityType, entityId } = req.params;

        // Authorization check for LostFound
        if (entityType === 'LostFound') {
            const item = await LostFound.findById(entityId);
            if (!item) return res.status(404).json({ message: 'Item not found' });

            const reporterId = item.reportedBy?._id?.toString() || item.reportedBy?.toString();
            const claimantId = item.claimant?._id?.toString() || item.claimant?.toString();
            const userId = req.user._id.toString();

            const isReporter = reporterId === userId;
            const isClaimant = claimantId === userId;
            const isSubAdmin = req.user.managementRole === 'subadmin';
            const isSuperAdmin = req.user.isAdmin;

            if (!isReporter && !isClaimant && !isSubAdmin && !isSuperAdmin) {
                return res.status(403).json({ message: 'Not authorized to view this discussion' });
            }
        }

        const comments = await Comment.find({ entityId, entityType })
            .populate('author', 'email role managementRole isAdmin')
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        console.error('ERROR in GET /api/comments:', error);
        res.status(500).json({ message: error.message });
    }
});

// @desc    React to a comment
// @route   POST /api/comments/:id/react
router.post('/:id/react', protect, async (req, res) => {
    try {
        const { emoji = '❤️' } = req.body;
        const comment = await Comment.findById(req.params.id);
        if (!comment) return res.status(404).json({ message: 'Comment not found' });

        // Find if this emoji reaction already exists
        let reaction = comment.reactions.find(r => r.emoji === emoji);

        if (!reaction) {
            // New emoji reaction
            comment.reactions.push({ emoji, users: [req.user._id] });
        } else {
            const index = reaction.users.indexOf(req.user._id);
            if (index === -1) {
                // Add user to existing emoji
                reaction.users.push(req.user._id);
            } else {
                // Toggle off (remove user)
                reaction.users.splice(index, 1);
                // Clean up empty emoji groups
                if (reaction.users.length === 0) {
                    comment.reactions = comment.reactions.filter(r => r.emoji !== emoji);
                }
            }
        }

        await comment.save();
        res.json({ reactions: comment.reactions });
    } catch (error) {
        console.error('ERROR in POST /api/comments/:id/react:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
