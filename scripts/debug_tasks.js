const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const Task = require('../backend/models/Task');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

const formatOutput = (tasks) => {
    console.log(JSON.stringify(tasks.map(t => ({
        _id: t._id,
        title: t.title,
        requiresProof: t.requiresProof
    })), null, 2));
}

const listTasks = async () => {
    await connectDB();
    try {
        const tasks = await Task.find({});
        console.log('--- ALL TASKS ---');
        formatOutput(tasks);

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

listTasks();
