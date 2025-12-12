require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}

const Resource = require('../models/Resource');

const removeSweets = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✓ Connected');

        const searchTerms = ['mithai', 'rasgulla'];
        const regex = new RegExp(searchTerms.join('|'), 'i');

        // Find them first
        const toDelete = await Resource.find({ name: regex });

        if (toDelete.length === 0) {
            console.log('No matching resources found to delete.');
        } else {
            console.log('Found resources to delete:');
            toDelete.forEach(r => console.log(`- ${r.name} (Qty: ${r.totalQuantity})`));

            const result = await Resource.deleteMany({ name: regex });
            console.log(`\n✓ Deleted ${result.deletedCount} resources successfully.`);
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

removeSweets();
