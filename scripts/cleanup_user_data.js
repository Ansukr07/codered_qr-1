const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
const envPath = path.join(__dirname, '../.env');
console.log('Loading .env from:', envPath);
dotenv.config({ path: envPath });

// Import models
const User = require('../backend/models/User');
const Transaction = require('../backend/models/Transaction');
const Submission = require('../backend/models/Submission');
const HelpRequest = require('../backend/models/HelpRequest');

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

const cleanup = async () => {
    await connectDB();

    try {
        const userName = "B Suraj";
        console.log(`Searching for user: "${userName}"...`);
        // Using a regex to be a bit more flexible with whitespace if needed, but exact match is preferred if name is exact.
        // User said "B Suraj", assuming exact match.
        const user = await User.findOne({ name: userName });

        if (!user) {
            console.log(`User "${userName}" not found.`);
            // List similar users just in case
            const similar = await User.find({ name: { $regex: userName, $options: 'i' } });
            if (similar.length > 0) {
                console.log('Did you mean one of these?');
                similar.forEach(u => console.log(`- ${u.name} (ID: ${u._id})`));
            }
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (ID: ${user._id})`);

        // Delete Transactions
        const transResult = await Transaction.deleteMany({ userId: user._id });
        console.log(`Deleted ${transResult.deletedCount} transactions (scans/claims).`);

        // Delete Submissions
        const subResult = await Submission.deleteMany({ userId: user._id });
        console.log(`Deleted ${subResult.deletedCount} submissions (tasks).`);

        // Delete HelpRequests
        const helpResult = await HelpRequest.deleteMany({ userId: user._id });
        console.log(`Deleted ${helpResult.deletedCount} help requests.`);

        console.log('Cleanup complete.');
    } catch (error) {
        console.error('Error during cleanup:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

cleanup();
