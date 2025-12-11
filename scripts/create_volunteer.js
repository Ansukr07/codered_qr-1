/**
 * Script to create a volunteer with hardcoded credentials
 * Email: vol@vol.in
 * Password: vol@123
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

const Volunteer = require('../models/Volunteer');

async function createVolunteer() {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI is not defined in .env file.');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB\n');

        const email = 'vol@vol.in';
        const password = 'vol@123';
        const name = 'Volunteer User';

        // Check if volunteer already exists
        const existingVolunteer = await Volunteer.findOne({ email: email.toLowerCase() });
        
        if (existingVolunteer) {
            console.log('✓ Volunteer already exists with email:', email);
            console.log('Updating password...');
            
            const hashedPassword = await bcrypt.hash(password, 10);
            existingVolunteer.password = hashedPassword;
            existingVolunteer.name = name;
            await existingVolunteer.save();
            
            console.log('✓ Volunteer password updated successfully');
        } else {
            console.log('Creating new volunteer...');
            
            const hashedPassword = await bcrypt.hash(password, 10);
            const qrCode = `VOL-${Date.now()}`;
            
            const volunteer = await Volunteer.create({
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                qrCode,
            });
            
            console.log('✓ Volunteer created successfully:');
            console.log('  Email:', email);
            console.log('  Password:', password);
            console.log('  QR Code:', qrCode);
        }

        await mongoose.disconnect();
        console.log('\n✓ Done!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

createVolunteer();

