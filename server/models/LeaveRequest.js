const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['leave', 'outpass'],
        required: true
    },
    fromDate: {
        type: Date,
        required: true
    },
    toDate: {
        type: Date,
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    contactNumber: {
        type: String,
        required: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    status: {
        type: String,
        enum: ['draft', 'submitted', 'approved', 'rejected', 'checkedOut', 'checkedIn', 'closed', 'cancelled'],
        default: 'submitted' // Creating directly as submitted for now, draft can be added if we implement a save feature
    },
    remarks: {
        type: String,
        default: ''
    },
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
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    actionDate: {
        type: Date
    },
    checkoutTime: {
        type: Date
    },
    checkinTime: {
        type: Date
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
