const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');

// Import centralized authentication middleware
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

// Get all resources - Authenticated users only
router.get('/', requireAuth, async (req, res) => {
    try {
        const resources = await Resource.find({});
        res.json({ resources });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create resource (Admin only)
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const { name, totalQuantity, category } = req.body;
        const resource = await Resource.create({
            name,
            totalQuantity,
            distributedQuantity: 0,
            category: category || 'other'
        });

        res.status(201).json({ message: 'Resource created', resource });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
