const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

const User = require('../backend/models/User');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error('Failed to connect to MongoDB:', err.message);
        process.exit(1);
    }
};

const addDemoParticipant = async () => {
    await connectDB();

    const userData = {
        name: "Ansu",
        qrCode: "DEMO",
        role: "participant",
        teamId: "DEMO_TEAM",
        track: "DEMO"
    };

    try {
        // Check if exists
        let user = await User.findOne({ qrCode: userData.qrCode });
        if (user) {
            console.log('User with code DEMO already exists. Updating...');
            user.name = userData.name;
            user.teamId = userData.teamId;
            user.track = userData.track;
            await user.save();
            console.log('User updated:', user);
        } else {
            console.log('Creating new demo user...');
            user = await User.create(userData);
            console.log('User created:', user);
        }
    } catch (error) {
        console.error('Error adding demo user:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

addDemoParticipant();
