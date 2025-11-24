const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

router.post('/', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'volunteer' && decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { qr_code, resource_id } = req.body;

        const user = await User.findOne({ qrCode: qr_code });
        if (!user) {
            return res.status(404).json({ message: 'Invalid QR Code' });
        }

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        if (resource.distributedQuantity >= resource.totalQuantity) {
            return res.status(400).json({ message: 'Resource out of stock' });
        }

        const existingTransaction = await Transaction.findOne({
            userId: user._id,
            resourceId: resource._id,
        });

        if (existingTransaction) {
            return res.status(400).json({
                message: `Already claimed: ${resource.name}. This resource was already distributed to this participant.`
            });
        }

        resource.distributedQuantity += 1;
        await resource.save();

        const transaction = await Transaction.create({
            userId: user._id,
            resourceId: resource._id,
            volunteerId: decoded.userId,
            action: 'claim',
        });

        res.status(200).json({
            message: 'Scan successful',
            transaction,
            memberName: user.name
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
