const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Transaction = require('../models/Transaction');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.get('/', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        const transactions = await Transaction.find({ userId })
            .populate('resourceId', 'name')
            .sort({ timestamp: -1 });

        res.status(200).json({ transactions });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
