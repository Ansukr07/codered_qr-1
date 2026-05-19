const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../backend/models/User');
const Transaction = require('../backend/models/Transaction');
const HelpRequest = require('../backend/models/HelpRequest');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const clearParticipants = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        // Find all participants
        const participants = await User.find({ role: 'participant' });
        const participantIds = participants.map(user => user._id);

        console.log(`Found ${participants.length} participants to remove.`);

        if (participants.length > 0) {
            // Delete related HelpRequests
            const helpResult = await HelpRequest.deleteMany({ userId: { $in: participantIds } });
            console.log(`Deleted ${helpResult.deletedCount} help requests.`);

            // Delete related Transactions
            const txResult = await Transaction.deleteMany({ userId: { $in: participantIds } });
            console.log(`Deleted ${txResult.deletedCount} transactions.`);

            // Delete the Users
            const userResult = await User.deleteMany({ _id: { $in: participantIds } });
            console.log(`Deleted ${userResult.deletedCount} participant users.`);
        } else {
            console.log('No participants found to delete.');
        }

        console.log('Cleanup complete.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing participants:', error);
        process.exit(1);
    }
};

clearParticipants();
