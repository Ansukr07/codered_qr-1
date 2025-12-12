const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Resource = require('../models/Resource');
const Transaction = require('../models/Transaction');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Get resource tracking status - for volunteers to see who claimed what
router.get('/resource-status/:resourceId', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const { resourceId } = req.params;
        const { search } = req.query;

        console.log(`Fetching resource status for resourceId: ${resourceId}`);

        // Get the resource
        const resource = await Resource.findById(resourceId);
        if (!resource) {
            console.log('Resource not found');
            return res.status(404).json({ message: 'Resource not found' });
        }
        console.log('Resource found:', resource.name);

        // Get all participants
        let allParticipants = await User.find({ role: 'participant' }).select('name email teamId qrCode');
        console.log(`Found ${allParticipants.length} total participants`);

        // Apply search filter if provided
        if (search) {
            const searchLower = search.toLowerCase();
            allParticipants = allParticipants.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.email.toLowerCase().includes(searchLower) ||
                (p.teamId && p.teamId.toLowerCase().includes(searchLower))
            );
            console.log(`After search filter: ${allParticipants.length} participants`);
        }

        // Get all transactions for this resource
        const transactions = await Transaction.find({ resourceId })
            .populate('userId', 'name email teamId')
            .populate('volunteerId', 'name')
            .sort({ timestamp: -1 });
        console.log(`Found ${transactions.length} transactions for this resource`);

        // Check if this is coffee (allows multiple claims)
        const isCoffee = resource.category === 'coffee' || resource.name.toLowerCase().includes('coffee');
        const maxClaims = isCoffee ? 3 : 1;

        // Create a map of userId -> transactions and count claims
        const transactionMap = new Map();
        const claimCountMap = new Map();
        
        transactions.forEach(t => {
            if (t.userId && t.action === 'claim') {
                const userId = t.userId._id.toString();
                
                // Count claims for each user
                claimCountMap.set(userId, (claimCountMap.get(userId) || 0) + 1);
                
                // Store the most recent transaction
                if (!transactionMap.has(userId)) {
                    transactionMap.set(userId, t);
                } else {
                    const existing = transactionMap.get(userId);
                    if (new Date(t.timestamp) > new Date(existing.timestamp)) {
                        transactionMap.set(userId, t);
                    }
                }
            }
        });

        // Separate participants into completed and pending
        const completed = [];
        const pending = [];

        allParticipants.forEach(participant => {
            const participantId = participant._id.toString();
            const transaction = transactionMap.get(participantId);
            const claimCount = claimCountMap.get(participantId) || 0;

            if (transaction && claimCount > 0) {
                completed.push({
                    _id: participant._id,
                    name: participant.name,
                    email: participant.email,
                    teamId: participant.teamId,
                    timestamp: transaction.timestamp,
                    volunteer: transaction.volunteerId ? transaction.volunteerId.name : 'Unknown',
                    claimCount: claimCount,
                    maxClaims: maxClaims
                });
            } else {
                pending.push({
                    _id: participant._id,
                    name: participant.name,
                    email: participant.email,
                    teamId: participant.teamId,
                    qrCode: participant.qrCode,
                    claimCount: 0,
                    maxClaims: maxClaims
                });
            }
        });

        // Calculate statistics
        const stats = {
            total: allParticipants.length,
            completed: completed.length,
            pending: pending.length
        };

        console.log('Stats:', stats);
        console.log(`Returning ${completed.length} completed and ${pending.length} pending`);

        res.json({
            resource: {
                _id: resource._id,
                name: resource.name,
                category: resource.category
            },
            stats,
            completed,
            pending
        });

    } catch (error) {
        console.error('Resource status error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Get all resources (for dropdown)
router.get('/resources', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        console.log('Fetching resources for volunteer...');
        const resources = await Resource.find({}).select('name category totalQuantity');

        // Get participant counts for each resource
        const resourcesWithCounts = await Promise.all(resources.map(async (resource) => {
            const count = await Transaction.countDocuments({
                resourceId: resource._id,
                action: 'claim'
            });

            return {
                _id: resource._id,
                name: resource.name,
                category: resource.category,
                participantCount: count,
                totalQuantity: resource.totalQuantity
            };
        }));

        console.log(`Found ${resourcesWithCounts.length} resources with counts:`, resourcesWithCounts);
        res.json({ resources: resourcesWithCounts });
    } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
