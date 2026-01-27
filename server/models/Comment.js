const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: [true, 'Comment content is required'],
        trim: true
    },
    author: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    entityType: {
        type: String,
        enum: ['Complaint', 'Announcement', 'LostFound'],
        required: true
    },
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null // null means it's a top-level comment
    },
    reactions: [{
        emoji: { type: String, default: '❤️' },
        users: [{ type: mongoose.Schema.Types.Mixed, ref: 'User' }]
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Comment', commentSchema);
