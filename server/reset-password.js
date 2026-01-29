const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const resetPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const user = await User.findOne({ email: 'rahul1406@gmail.com' });
        if (user) {
            user.password = 'password123';
            await user.save();
            console.log('Password reset successfully for rahul1406@gmail.com');
        } else {
            console.log('User not found');
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

resetPassword();
