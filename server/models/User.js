const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        enum: ['student', 'management'],
        required: true
    },
    // Student-specific fields
    hostel: {
        type: String,
        required: function () { return this.role === 'student'; }
    },
    block: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
        required: function () { return this.role === 'student'; }
    },
    roomNumber: {
        type: String,
        required: function () { return this.role === 'student'; }
    },
    // Management-specific fields
    isApproved: {
        type: Boolean,
        default: function () { return this.role === 'student' ? true : false; }
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    managementRole: {
        type: String,
        enum: ['admin', 'subadmin', 'caretaker', null],
        default: null
    },
    staffSpecialization: {
        type: String,
        enum: ['plumbing', 'electrical', 'cleanliness', 'internet', 'furniture', 'other'],
        default: null
    },
    refreshToken: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
