const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({});
        console.log(`Total users: ${users.length}`);

        const teams = {};
        users.forEach(u => {
            if (u.teamId) {
                if (!teams[u.teamId]) teams[u.teamId] = { count: 0, tracks: new Set(), name: u.teamId };
                // Note: user.teamId seems to be the Team Name based on checks before, or ObjectId? 
                // User schema says teamId: String.
                teams[u.teamId].count++;
                if (u.track) teams[u.teamId].tracks.add(u.track);
            }
        });

        console.log(`Total teams found in Users: ${Object.keys(teams).length}`);

        // Check tracks per team
        Object.values(teams).forEach(t => {
            if (t.tracks.size > 1) {
                console.log(`Team ${t.name} has mixed tracks: ${[...t.tracks].join(', ')}`);
            }
        });

        const tracks = new Set();
        users.forEach(u => { if (u.track) tracks.add(u.track) });
        console.log('Tracks found:', [...tracks]);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

check();
