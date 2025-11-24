const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Create Announcement (Admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
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

// Get Announcements (Filtered by audience) - All authenticated users
router.get('/', requireAuth, async (req, res) => {
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
