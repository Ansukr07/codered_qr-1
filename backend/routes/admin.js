const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Get overall statistics
router.get('/stats', verifyAdmin, async (req, res) => {
    try {
        const resources = await Resource.find({});
        const participants = await User.find({ role: 'participant' });
        const totalTransactions = await Transaction.countDocuments();

        const stats = {
            totalResources: resources.length,
            totalParticipants: participants.length,
            totalDistributed: resources.reduce((sum, r) => sum + r.distributedQuantity, 0),
            totalCapacity: resources.reduce((sum, r) => sum + r.totalQuantity, 0),
            totalTransactions,
            resources: resources.map(r => ({
                _id: r._id,
                name: r.name,
                totalQuantity: r.totalQuantity,
                distributedQuantity: r.distributedQuantity,
                remaining: r.totalQuantity - r.distributedQuantity,
                category: r.category
            }))
        };

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get participants for a specific resource
router.get('/resource/:id/participants', verifyAdmin, async (req, res) => {
    try {
        const resourceId = req.params.id;
        const resource = await Resource.findById(resourceId);

        if (!resource) {
            return res.status(404).json({ message: 'Resource not found' });
        }

        // Get all participants who claimed this resource
        const transactions = await Transaction.find({ resourceId })
            .populate('userId', 'name email teamId qrCode')
            .populate('volunteerId', 'name')
            .sort({ timestamp: -1 });

        // Get all participants
        const allParticipants = await User.find({ role: 'participant' });

        // Determine who has and hasn't claimed
        const claimedUserIds = transactions.map(t => t.userId._id.toString());
        const completed = transactions.map(t => ({
            name: t.userId.name,
            email: t.userId.email,
            teamId: t.userId.teamId,
            timestamp: t.timestamp,
            volunteer: t.volunteerId.name
        }));

        const remaining = allParticipants
            .filter(p => !claimedUserIds.includes(p._id.toString()))
            .map(p => ({
                name: p.name,
                email: p.email,
                teamId: p.teamId,
                qrCode: p.qrCode
            }));

        res.json({
            resource: {
                name: resource.name,
                totalQuantity: resource.totalQuantity,
                distributedQuantity: resource.distributedQuantity
            },
            completed,
            remaining
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all participants
router.get('/participants', verifyAdmin, async (req, res) => {
    try {
        const participants = await User.find({ role: 'participant' })
            .select('-password')
            .sort({ createdAt: -1 });

        // Get transaction count for each participant
        const participantsWithStats = await Promise.all(
            participants.map(async (p) => {
                const transactionCount = await Transaction.countDocuments({ userId: p._id });
                return {
                    _id: p._id,
                    name: p.name,
                    email: p.email,
                    teamId: p.teamId,
                    qrCode: p.qrCode,
                    resourcesClaimed: transactionCount,
                    createdAt: p.createdAt
                };
            })
        );

        res.json({ participants: participantsWithStats });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get all users (with optional role filter)
router.get('/users', verifyAdmin, async (req, res) => {
    try {
        const { role } = req.query;
        const filter = role ? { role } : {};

        const users = await User.find(filter)
            .select('-password')
            .sort({ createdAt: -1 });

        res.json({ users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
