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

const deleteParticipant = async () => {
    await connectDB();

    const targetId = '69369238730d6159866b0f68';

    try {
        console.log(`Searching for user with ID: ${targetId}...`);

        // Find the user first to confirm
        // Note: The provided ID '69369238730d6159866b0f68' might be a typo from the user if it's not a valid ObjectId hex.
        // Standard ObjectId is 24 hex chars. 
        // 69369238730d6159866b0f68 is 24 chars. It seems strictly valid format-wise.

        // However, standard Mongoose/MongoDB might auto-generate IDs that don't start with numbers like '69...' often? 
        // Actually it's just hex, so it's fine.

        // IMPORTANT: If the user provided ID is a string in the DB but not an ObjectId (though schema says ObjectId autogen), 
        // we should filter by _id assuming it casts correctly.

        const user = await User.findById(targetId);

        if (!user) {
            console.log(`User with ID ${targetId} not found.`);
            // Try searching by name "krih" just in case the ID was wrong
            const userByName = await User.findOne({ name: "krih" });
            if (userByName) {
                console.log(`Found a user named "krih" with ID: ${userByName._id}. The ID you provided might be incorrect.`);
            }
            process.exit(1);
        }

        console.log(`Found user: ${user.name} (${user.email})`);

        // Delete Transactions
        const transResult = await Transaction.deleteMany({ userId: user._id });
        console.log(`Deleted ${transResult.deletedCount} transactions.`);

        // Delete Submissions
        const subResult = await Submission.deleteMany({ userId: user._id });
        console.log(`Deleted ${subResult.deletedCount} submissions.`);

        // Delete HelpRequests
        const helpResult = await HelpRequest.deleteMany({ userId: user._id });
        console.log(`Deleted ${helpResult.deletedCount} help requests.`);

        // Delete User
        await User.findByIdAndDelete(targetId);
        console.log(`Deleted User profile.`);

        console.log('Deletion complete.');
    } catch (error) {
        console.error('Error during deletion:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

deleteParticipant();
