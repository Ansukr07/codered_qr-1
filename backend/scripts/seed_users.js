const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User'); // Adjust path if necessary
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Note: Admin users are now managed separately using the Admin model
        // Run backend/scripts/update_admin_users.js to create/update admin users
        console.log('Note: Admin users should be created using backend/scripts/update_admin_users.js');

        // Volunteer
        const volunteerEmail = 'volunteer@demo.com';
        const existingVolunteer = await User.findOne({ email: volunteerEmail });
        if (!existingVolunteer) {
            const hashedPassword = await bcrypt.hash('volunteer123', 10);
            await User.create({
                name: 'Demo Volunteer',
                email: volunteerEmail,
                password: hashedPassword,
                role: 'volunteer',
                qrCode: 'VOLUNTEER-001'
            });
            console.log('Created volunteer user');
        } else {
            console.log('Volunteer user already exists');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error seeding users:', error);
        process.exit(1);
    }
};

seedUsers();
