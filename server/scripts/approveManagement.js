const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const approveUser = async () => {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('Please provide an email address');
            console.log('Usage: node approveManagement.js <email>');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found with email: ${email}`);
            process.exit(1);
        }

        if (user.role !== 'management') {
            console.log(`User ${email} is not a management account`);
            process.exit(1);
        }

        if (user.isApproved) {
            console.log(`User ${email} is already approved`);
            process.exit(0);
        }

        user.isApproved = true;
        await user.save();

        console.log(`Successfully approved management user: ${email}`);
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

approveUser();
