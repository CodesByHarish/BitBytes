const mongoose = require('mongoose');

const lostFoundSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Item title is required'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Description is required'],
        trim: true
    },
    type: {
        type: String,
        enum: ['lost', 'found'],
        required: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['open', 'claimed', 'resolved'],
        default: 'open'
    },
    media: [{
        type: String // URLs to images
    }],
    reportedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    claimant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    claimMessage: {
        type: String,
        default: null
    },
    moderationStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    hostel: {
        type: String,
        required: true
    },
    block: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LostFound', lostFoundSchema);
