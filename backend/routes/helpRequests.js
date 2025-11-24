const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// Auth middleware
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Create help request (participant only)
router.post('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can create help requests' });
        }

        const { description, category, priority } = req.body;

        if (!description) {
            return res.status(400).json({ message: 'Description is required' });
        }

        const helpRequest = new HelpRequest({
            userId: req.user._id,
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
router.get('/', auth, async (req, res) => {
    try {
        if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

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
router.get('/my-requests', auth, async (req, res) => {
    try {
        if (req.user.role !== 'participant') {
            return res.status(403).json({ message: 'Only participants can view their requests' });
        }

        const helpRequests = await HelpRequest.find({ userId: req.user._id })
            .populate('resolvedBy', 'name')
            .sort({ createdAt: -1 });

        res.json({ helpRequests });
    } catch (error) {
        console.error('Get my requests error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Resolve help request (volunteer/admin only)
router.patch('/:id/resolve', auth, async (req, res) => {
    try {
        if (req.user.role !== 'volunteer' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const helpRequest = await HelpRequest.findById(req.params.id);

        if (!helpRequest) {
            return res.status(404).json({ message: 'Help request not found' });
        }

        if (helpRequest.status === 'resolved') {
            return res.status(400).json({ message: 'Request already resolved' });
        }

        helpRequest.status = 'resolved';
        helpRequest.resolvedBy = req.user._id;
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
