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
    expiresAt: {
        type: Date,
        default: null // null means never expires
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);
