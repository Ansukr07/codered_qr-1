const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function check() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // Fetch a few users to see ALL fields, bypassing schema if necessary by using strict: false or just checking ._doc
        // But find({}) usually returns what's in schema.
        // Let's use the native driver collection to see raw data if Mongoose hides it.
        const usersCollection = mongoose.connection.collection('users');
        const rawUsers = await usersCollection.find({}).limit(5).toArray();

        console.log('--- Raw User Samples ---');
        rawUsers.forEach(u => console.log(JSON.stringify(u, null, 2)));

        const allUsers = await usersCollection.find({}).toArray();
        const halls = new Set();
        const seats = new Set();

        let hasHall = 0;
        let hasSeat = 0;

        allUsers.forEach(u => {
            if (u.hall) {
                halls.add(u.hall);
                hasHall++;
            }
            if (u.seatNumber) {
                seats.add(u.seatNumber);
                hasSeat++;
            }
        });

        console.log(`\nTotal Users: ${allUsers.length}`);
        console.log(`Users with 'hall': ${hasHall}`);
        console.log(`Users with 'seatNumber': ${hasSeat}`);
        console.log('Unique Halls:', [...halls]);
        console.log('Sample Seat Numbers:', [...seats].slice(0, 5));

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

check();
