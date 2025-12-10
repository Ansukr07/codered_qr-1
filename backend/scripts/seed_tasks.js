const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Task = require('../models/Task');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const tasks = [
    {
        title: "Team Selfie",
        description: "Take a selfie with your entire team holding your badges.",
        points: 5,
        category: "fun",
        proofType: "image"
    },
    {
        title: "Code Clean",
        description: "Show us your cleanest code snippet from the project.",
        points: 10,
        category: "technical",
        proofType: "image"
    },
    {
        title: "Hydration Check",
        description: "Post a photo of everyone drinking water!",
        points: 3,
        category: "social",
        proofType: "image"
    },
    {
        title: "Mentor Interaction",
        description: "Take a photo discussing your project with a mentor.",
        points: 8,
        category: "technical",
        proofType: "image"
    },
    {
        title: "Nap Time",
        description: "Caught someone sleeping? Share the proof!",
        points: 2,
        category: "fun",
        proofType: "image"
    },
    {
        title: "Working Demo",
        description: "Screenshot of your working prototype.",
        points: 15,
        category: "technical",
        proofType: "image"
    }
];

const seedTasks = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Validating MongoDB Connection...');

        // Check for existing tasks to avoid duplicates
        const existingCount = await Task.countDocuments();
        if (existingCount > 0) {
            console.log(`Found ${existingCount} tasks. Skipping seed.`);
            process.exit(0);
        }

        console.log('Seeding tasks...');
        await Task.insertMany(tasks);
        console.log('Tasks seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding tasks:', error);
        process.exit(1);
    }
};

seedTasks();
