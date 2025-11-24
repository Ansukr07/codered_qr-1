const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');

// Get user's transactions - Authenticated users only
router.get('/', requireAuth, async (req, res) => {
    try {
        const userId = req.user.userId; // Set by requireAuth middleware

        const transactions = await Transaction.find({ userId })
            .populate('resourceId', 'name')
            .sort({ timestamp: -1 });

        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
