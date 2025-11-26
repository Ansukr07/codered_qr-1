const mongoose = require('mongoose');

const SeatingSchema = new mongoose.Schema({
    teamId: {
        type: String,
        required: true,
        unique: true
    },
    teamSize: {
        type: Number,
        required: true,
        default: 3
    },
    section: {
        type: String,
        required: true,
        enum: ['left', 'right']
    },
    // Array of seats for all team members
    seats: [{
        seatNumber: Number,
        row: Number,
        column: Number
    }],
    labName: {
        type: String,
        default: 'APJ Abdul Kalam Lab'
    }
}, {
    timestamps: true
});

module.exports = mongoose.models.Seating || mongoose.model('Seating', SeatingSchema);
