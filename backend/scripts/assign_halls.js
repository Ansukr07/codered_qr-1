const mongoose = require('mongoose');
require('dotenv').config();
const User = require('../models/User');

async function assign() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Get all users with teams
        const users = await User.find({ teamId: { $ne: null } });

        // Group by Team
        const teams = {};
        users.forEach(u => {
            if (!teams[u.teamId]) {
                teams[u.teamId] = {
                    name: u.teamId,
                    track: u.track, // Assuming all members have same track. If mixed, we might need logic.
                    members: []
                };
            }
            teams[u.teamId].members.push(u);
            // Update track if missing (sometimes only one member has it?)
            if (u.track && !teams[u.teamId].track) teams[u.teamId].track = u.track;
        });

        const teamList = Object.values(teams);

        // Separate by Track
        const crTeams = teamList.filter(t => t.track === 'CR');
        const cruTeams = teamList.filter(t => t.track === 'CRU');
        const otherTeams = teamList.filter(t => t.track !== 'CR' && t.track !== 'CRU');

        console.log(`CR Teams: ${crTeams.length}`);
        console.log(`CRU Teams: ${cruTeams.length}`);
        console.log(`Other Teams: ${otherTeams.length}`);

        // Define Assignments
        const assignments = []; // { teamName, hall, seat }

        // Assign 'CR' to "Main Hall"
        crTeams.forEach((t, i) => {
            assignments.push({
                teamName: t.name,
                hall: 'Main Hall',
                seatNumber: `M-T${i + 1}`
            });
        });

        // Assign 'CRU' - First 17 to "Small Hall 1", Rest to "Small Hall 2"
        cruTeams.forEach((t, i) => {
            if (i < 17) {
                assignments.push({
                    teamName: t.name,
                    hall: 'Small Hall 1',
                    seatNumber: `S1-T${i + 1}`
                });
            } else {
                assignments.push({
                    teamName: t.name,
                    hall: 'Small Hall 2',
                    seatNumber: `S2-T${(i - 17) + 1}`
                });
            }
        });

        console.log(`Total Assignments prepared: ${assignments.length}`);

        // Update DB
        for (const assign of assignments) {
            // Update all users of this team
            const res = await User.updateMany(
                { teamId: assign.teamName },
                {
                    $set: {
                        hall: assign.hall,
                        seatNumber: assign.seatNumber
                    }
                }
            );
            // console.log(`Assigned ${assign.teamName} to ${assign.hall} ${assign.seatNumber}`);
        }

        console.log('Database updated successfully.');

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

assign();
