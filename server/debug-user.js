const mongoose = require('mongoose');
const User = require('./models/User');
const dotenv = require('dotenv');

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Force update rahul to caretaker
        await User.findOneAndUpdate(
            { email: 'rahul1406@gmail.com' },
            {
                managementRole: 'caretaker',
                staffSpecialization: 'plumbing',
                isAdmin: false
            }
        );
        console.log('Forced rahul1406@gmail.com to caretaker (plumbing)');

        const users = await User.find({ role: 'management' });
        console.log(`Found ${users.length} management users:`);
        users.forEach(user => {
            console.log(JSON.stringify({
                email: user.email,
                role: user.role,
                isAdmin: user.isAdmin,
                managementRole: user.managementRole,
                staffSpecialization: user.staffSpecialization,
                isApproved: user.isApproved
            }, null, 2));
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
};

checkUser();
