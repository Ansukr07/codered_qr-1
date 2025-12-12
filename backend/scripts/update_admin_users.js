/**
 * Script to update/create admin users with new password and allowed emails
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local first, then .env as fallback
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');

if (fs.existsSync(envLocalPath)) {
    dotenv.config({ path: envLocalPath });
    console.log('Loaded .env.local');
} else if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    console.log('Loaded .env');
} else {
    dotenv.config();
}

const Admin = require('../models/Admin');

async function updateAdminUsers() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        const NEW_PASSWORD = 'ecell@codered30';
        const ALLOWED_EMAILS = [
            { email: 'ecell@bmsit.in', name: 'E-Cell Admin' },
            { email: 'milangs4606@gmail.com', name: 'Milang Admin' }
        ];

        console.log('='.repeat(80));
        console.log('UPDATING/CREATING ADMIN USERS');
        console.log('='.repeat(80));
        console.log('');

        // Hash the new password
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
        console.log('New password hashed successfully\n');

        // Update or create each allowed admin
        for (const adminData of ALLOWED_EMAILS) {
            const emailLower = adminData.email.toLowerCase();
            console.log(`Processing: ${emailLower}`);

            let admin = await Admin.findOne({ email: emailLower });

            if (admin) {
                // Update existing admin
                console.log(`  Found existing admin: ${admin.name}`);
                admin.password = hashedPassword;
                admin.name = adminData.name;
                await admin.save();
                console.log(`  ✅ Updated admin: ${adminData.name} (${emailLower})`);
            } else {
                // Create new admin
                admin = await Admin.create({
                    name: adminData.name,
                    email: emailLower,
                    password: hashedPassword
                });
                console.log(`  ✅ Created new admin: ${adminData.name} (${emailLower})`);
            }
            console.log('');
        }

        // Remove any admin users that are not in the allowed list
        console.log('='.repeat(80));
        console.log('REMOVING UNAUTHORIZED ADMIN USERS');
        console.log('='.repeat(80));
        console.log('');

        const allAdmins = await Admin.find({});
        const allowedEmails = ALLOWED_EMAILS.map(a => a.email.toLowerCase());

        let removedCount = 0;
        for (const admin of allAdmins) {
            if (!allowedEmails.includes(admin.email.toLowerCase())) {
                console.log(`  Removing unauthorized admin: ${admin.name} (${admin.email})`);
                await Admin.deleteOne({ _id: admin._id });
                removedCount++;
            }
        }

        if (removedCount === 0) {
            console.log('  ✅ No unauthorized admins found');
        } else {
            console.log(`  ✅ Removed ${removedCount} unauthorized admin(s)`);
        }
        console.log('');

        // Final verification
        console.log('='.repeat(80));
        console.log('FINAL VERIFICATION');
        console.log('='.repeat(80));
        console.log('');

        const finalAdmins = await Admin.find({}).select('name email');
        console.log(`Total admin users: ${finalAdmins.length}\n`);
        finalAdmins.forEach((admin, index) => {
            console.log(`${index + 1}. ${admin.name}`);
            console.log(`   Email: ${admin.email}`);
            console.log('');
        });

        await mongoose.disconnect();
        console.log('✅ Update completed!');
        console.log('');
        console.log('Admin credentials:');
        console.log(`  Password: ${NEW_PASSWORD}`);
        console.log(`  Allowed emails: ${ALLOWED_EMAILS.map(a => a.email).join(', ')}`);
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

updateAdminUsers();


