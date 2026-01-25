const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const makeAdmin = async () => {
    try {
        const email = process.argv[2];

        if (!email) {
            console.log('Please provide an email address');
            console.log('Usage: node makeAdmin.js <email>');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User not found with email: ${email}`);
            process.exit(1);
        }

        if (user.isAdmin) {
            console.log(`User ${email} is already an admin`);
            process.exit(0);
        }

        user.isAdmin = true;
        user.isApproved = true; // Admins are automatically approved
        await user.save();

        console.log(`Successfully promoted ${email} to Admin`);
        process.exit(0);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

makeAdmin();
