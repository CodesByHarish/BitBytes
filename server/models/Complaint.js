const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        enum: ['plumbing', 'electrical', 'cleanliness', 'internet', 'furniture', 'other'],
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'emergency'],
        default: 'medium'
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    media: [{
        type: String // URLs or pointers to files
    }],
    isPublic: {
        type: Boolean,
        default: false
    },
    // Auto-tagged location details
    hostel: {
        type: String,
        required: true
    },
    block: {
        type: String,
        required: true
    },
    roomNumber: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['reported', 'assigned', 'in-progress', 'resolved', 'closed', 'merged'],
        default: 'reported'
    },
    // Merging Support
    mergedInto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint',
        default: null
    },
    mergedIssues: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Complaint'
    }],
    caretaker: {
        type: String,
        default: null
    },
    caretakerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    timeline: [{
        status: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: String
    }],
    upvotes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

// Add initial timeline entry before saving new complaint
complaintSchema.pre('save', async function () {
    if (this.isNew && this.timeline.length === 0) {
        this.timeline.push({
            status: 'reported',
            timestamp: new Date(),
            updatedBy: this.student,
            comment: 'Complaint reported'
        });
    }
});

module.exports = mongoose.model('Complaint', complaintSchema);
