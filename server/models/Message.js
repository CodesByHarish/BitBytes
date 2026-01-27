const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    lostFoundId: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'LostFound',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.Mixed,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
