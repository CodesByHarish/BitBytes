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
    type: {
        type: String,
        enum: ['general', 'hostel', 'block'],
        default: 'general'
    },
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
