const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    category: {
        type: String,
        enum: ['fees', 'cleaning', 'pest-control', 'utility-downtime', 'maintenance', 'general'],
        default: 'general'
    },
    type: {
        type: String,
        enum: ['general', 'hostel', 'block', 'role'],
        default: 'general'
    },
    targetBlocks: [{
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    }],
    targetRoles: [{
        type: String,
        enum: ['student', 'subadmin', 'caretaker']
    }],
    hostel: {
        type: String,
        default: null
    },
    block: {
        type: String,
        default: null
    },
    expiresAt: {
        type: Date,
        default: null // null means never expires
    },
    deadlineDate: {
        type: Date,
        default: null
    },
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
