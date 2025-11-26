const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

router.post('/', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
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
            volunteerId: req.user.userId, // req.user is set by requireAuth middleware
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

router.post('/validate', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { qr_code, resource_id } = req.body;

        const user = await User.findOne({ qrCode: qr_code });
        if (!user) {
            return res.status(404).json({ message: 'Invalid QR Code' });
        }

        const resource = await Resource.findById(resource_id);
        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        const existingTransaction = await Transaction.findOne({
            userId: user._id,
            resourceId: resource._id,
        }).populate('volunteerId', 'name');

        if (existingTransaction) {
            return res.status(200).json({
                status: 'claimed',
                message: `Already claimed: ${resource.name}`,
                member: {
                    name: user.name,
                    teamId: user.teamId,
                    email: user.email
                },
                transaction: {
                    timestamp: existingTransaction.timestamp,
                    volunteerName: existingTransaction.volunteerId ? existingTransaction.volunteerId.name : 'Unknown'
                }
            });
        }

        return res.status(200).json({
            status: 'allowed',
            message: 'Ready to claim',
            member: {
                name: user.name,
                teamId: user.teamId,
                email: user.email
            }
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
