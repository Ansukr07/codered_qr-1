require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../backend/models/User');
const fs = require('fs');
const path = require('path');

const exportParticipants = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const participants = await User.find({ role: 'participant' }).select('name teamId qrCode track -_id').sort({ teamId: 1 });

        console.log(`Found ${participants.length} participants.`);

        const headers = ['Name', 'Team ID', 'Track', 'QR Code'];
        const csvContent = [
            headers.join(','),
            ...participants.map(p => {
                // Escape fields if they contain commas
                const name = `"${p.name}"`;
                const team = `"${p.teamId || ''}"`;
                const track = `"${p.track || ''}"`;
                const code = `"${p.qrCode}"`;
                // Construct full URL if needed, but user asked for "qr codes", usually implies the value. 
                // I will provide the raw code AND a generated URL column just in case.
                const url = `"https://example.com/verify?id=${p.qrCode}"`;
                return `${name},${team},${track},${code},${url}`;
            })
        ].join('\n');

        // Add URL header
        const finalCsv = csvContent.replace('QR Code', 'QR Code,Verification URL');

        const outputPath = path.join(__dirname, 'participants_qr_export.csv');
        fs.writeFileSync(outputPath, finalCsv);

        console.log(`Export successful! Data written to: ${outputPath}`);

        process.exit(0);
    } catch (error) {
        console.error('Export failed:', error);
        process.exit(1);
    }
};

exportParticipants();
