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
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
        required: true
    },
    claimant: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
        default: null
    },
    claimMessage: {
        type: String,
        default: null
    },
    category: {
        type: String,
        enum: ['electronics', 'id-cards', 'books', 'clothing', 'others'],
        default: 'others'
    },
    isApproved: {
        type: Boolean,
        default: false
    },
    isResolutionRequested: {
        type: Boolean,
        default: false
    },
    hostel: {
        type: String
    },
    block: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LostFound', lostFoundSchema);
