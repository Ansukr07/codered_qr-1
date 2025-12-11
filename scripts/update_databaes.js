const mongoose = require('mongoose');
const User = require('../models/User');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const updates = [
    { team: "Databaes", name: "Ayushman sharma", track: "CR", code: "CR-T38-P05" },
    { team: "Databaes", name: "Obana Pujar", track: "CR", code: "CR-T38-P06" },
    { team: "Databaes", name: "Parinitha V", track: "CR", code: "CR-T38-P07" },
    { team: "Databaes", name: "Gayatri P", track: "CR", code: "CR-T38-P08" },
];

const updateDatabaes = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        for (const user of updates) {
            // Update or Insert based on QR Code
            const result = await User.findOneAndUpdate(
                { qrCode: user.code },
                {
                    name: user.name,
                    teamId: user.team,
                    qrCode: user.code,
                    role: 'participant',
                    track: user.track
                },
                { upsert: true, new: true }
            );
            console.log(`Updated/Inserted: ${result.name} (${result.qrCode})`);
        }

        console.log('Update completed');
        mongoose.connection.close();
    } catch (error) {
        console.error('Update failed:', error);
        process.exit(1);
    }
};

updateDatabaes();
