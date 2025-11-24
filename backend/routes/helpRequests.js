const express = require('express');
const router = express.Router();
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Create help request (participant only)
router.post('/', requireAuth, requireRole('participant'), async (req, res) => {
    try {
        const { description, category, priority } = req.body;

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        // req.user is set by requireAuth middleware (contains userId from JWT)
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const helpRequest = new HelpRequest({
            userId: user._id,
            description,
            category: category || 'general',
            priority: priority || 'medium'
        });

        await helpRequest.save();

        // Populate user info before sending response
        await helpRequest.populate('userId', 'name email teamId');

        res.status(201).json({
            message: 'Help request created successfully',
            helpRequest
        });
    } catch (error) {
        console.error('Create help request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get all help requests (volunteer/admin only)
router.get('/', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const helpRequests = await HelpRequest.find()
            .populate('userId', 'name email teamId qrCode')
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ helpRequests });
    } catch (error) {
        console.error('Get help requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's own help requests (participant only)
router.get('/my-requests', requireAuth, requireRole('participant'), async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const helpRequests = await HelpRequest.find({ userId: user._id })
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ helpRequests });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resolve help request (volunteer/admin only)
router.patch('/:id/resolve', requireAuth, requireRole('volunteer', 'admin'), async (req, res) => {
    try {
        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (helpRequest.status === 'resolved') {
            return res.status(400).json({ message: 'Request already resolved' });
        }

        helpRequest.status = 'resolved';
        helpRequest.resolvedBy = req.user.userId;
        helpRequest.resolvedAt = new Date();

        await helpRequest.save();
        await helpRequest.populate('userId', 'name email teamId');
        await helpRequest.populate('resolvedBy', 'name');

        res.json({
            message: 'Help request resolved successfully',
            helpRequest
        });
    } catch (error) {
        console.error('Resolve help request error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
