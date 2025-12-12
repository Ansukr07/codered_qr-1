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

const updateMeals = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update Breakfast, Lunch, Dinner to 267
        // Also update category to 'food' for consistency if needed, but user just said 'count'
        // Targeting by name regex as seen in list_meals output
        const result = await Resource.updateMany(
            {
                $or: [
                    { category: 'food' },
                    { name: { $regex: /Breakfast|Lunch|Dinner|Snack/i } }
                ]
            },
            {
                $set: { totalQuantity: 267 }
            }
        );

        console.log(`✓ Updated ${result.modifiedCount} meal resources to 267.`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

updateMeals();
