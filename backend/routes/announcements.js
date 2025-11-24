const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Announcement = require('../models/Announcement');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify token and get user role
const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};

// Middleware to verify admin access
const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }
        next();
    });
};

// Create Announcement (Admin only)
router.post('/', verifyAdmin, async (req, res) => {
    try {
        const { title, message, priority, audience } = req.body;
        const announcement = await Announcement.create({
            title,
            message,
            priority,
            audience
        });
        res.status(201).json({ message: 'Announcement created', announcement });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get Announcements (Filtered by audience)
router.get('/', verifyToken, async (req, res) => {
    try {
        const { role } = req.user;
        let query = {};

        if (role === 'admin') {
            // Admin sees all announcements
            query = {};
        } else if (role === 'volunteer') {
            // Volunteers see 'all' and 'volunteers'
            query = { audience: { $in: ['all', 'volunteers'] } };
        } else if (role === 'participant') {
            // Participants see 'all' and 'participants'
            query = { audience: { $in: ['all', 'participants'] } };
        }

        const announcements = await Announcement.find(query).sort({ createdAt: -1 });
        res.json({ announcements });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
