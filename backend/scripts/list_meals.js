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

const listMeals = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Find resources that look like meals
        const meals = await Resource.find({
            $or: [
                { category: 'food' },
                { name: { $regex: /Breakfast|Lunch|Dinner|Snack/i } }
            ]
        });

        console.log('\nFound Meal Resources:');
        meals.forEach(m => {
            console.log(`- ${m.name} (Category: ${m.category}, Qty: ${m.totalQuantity})`);
        });

        if (meals.length === 0) {
            console.log('No meals found.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

listMeals();
