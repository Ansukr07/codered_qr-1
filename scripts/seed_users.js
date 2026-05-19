const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../backend/models/User');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

const seedUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Admin
        const adminEmail = 'demo@admin.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Demo Admin',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
                qrCode: 'ADMIN-001'
            });
            console.log('Created admin user');
        } else {
            console.log('Admin user already exists');
        }

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
