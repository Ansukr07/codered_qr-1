const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...', process.env.MONGODB_URI);
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to Atlas: ${error.message}`);
        console.log('Attempting to connect to local MongoDB...');
        try {
            const conn = await mongoose.connect('mongodb://localhost:27017/hackathon-platform');
            console.log(`Local MongoDB Connected: ${conn.connection.host}`);
        } catch (localError) {
            console.error(`Error connecting to Local DB: ${localError.message}`);
            process.exit(1);
        }
    }
};

module.exports = connectDB;
