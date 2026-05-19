const mongoose = require('mongoose');
const XLSX = require('xlsx');
require('dotenv').config();
const path = require('path');
const User = require('../backend/models/User');

async function exportToExcel() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const users = await User.find({ hall: { $exists: true, $ne: null } });
        console.log(`Found ${users.length} users with assigned halls.`);

        // Users might be individual members. We probably want Teams per seat.
        // Assuming seatNumber is unique per Team.

        // Group by Hall -> Seat -> Team
        const halls = {};

        users.forEach(u => {
            const hallName = u.hall || 'Unknown Hall';
            if (!halls[hallName]) halls[hallName] = {};

            const seat = u.seatNumber || 'Unassigned';
            // We need to resolve Team Name.
            // u.teamId is likely the Team Name based on previous investigation, 
            // OR we might need to look it up if it's an ID.
            // But User model says teamId: String. Previous scripts showed teamId as "4DIRECTION", etc.
            const teamName = u.teamId || 'No Team';

            if (!halls[hallName][seat]) {
                halls[hallName][seat] = {
                    team: teamName,
                    members: [],
                    track: u.track
                };
            }
            halls[hallName][seat].members.push(u.name);
        });

        const wb = XLSX.utils.book_new();

        for (const [hallName, seats] of Object.entries(halls)) {
            const data = [];
            // Sort by seat number if possible
            const sortedSeats = Object.keys(seats).sort((a, b) => {
                // Try to sort naturally: M-T1, M-T2... M-T10
                const numA = parseInt(a.replace(/\D/g, '')) || 0;
                const numB = parseInt(b.replace(/\D/g, '')) || 0;
                return numA - numB;
            });

            sortedSeats.forEach(seatKey => {
                const info = seats[seatKey];
                data.push({
                    "Seat Number": seatKey,
                    "Team Name": info.team,
                    "Track": info.track,
                    "Members": info.members.join(', ')
                });
            });

            // Create Sheet
            // Sheet names can't be too long or contain invalid chars
            const safeSheetName = hallName.replace(/[\[\]\*\?\/\\\:]/g, "").substring(0, 31);
            const ws = XLSX.utils.json_to_sheet(data);

            // Adjust column widths
            const colWidths = [
                { wch: 15 }, // Seat
                { wch: 30 }, // Team
                { wch: 10 }, // Track
                { wch: 50 }, // Members
            ];
            ws['!cols'] = colWidths;

            XLSX.utils.book_append_sheet(wb, ws, safeSheetName);
        }

        const outputPath = path.resolve(__dirname, '../../seating_arrangements.xlsx');
        XLSX.writeFile(wb, outputPath);
        console.log(`Excel file written to: ${outputPath}`);

    } catch (e) {
        console.error(e);
    } finally {
        mongoose.disconnect();
    }
}

exportToExcel();
