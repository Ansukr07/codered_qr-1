const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Resource = require('../models/Resource');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Get all resources
router.get('/', async (req, res) => {
    try {
        const resources = await Resource.find({});
        res.json({ resources });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create resource (Admin only)
router.post('/', async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { name, totalQuantity, type } = req.body;
        const resource = await Resource.create({
            name,
            totalQuantity,
            distributedQuantity: 0,
            type, // 'type' was used in frontend route, but model has 'category'. Let's check model.
            // Frontend route used 'type', but model I converted has 'category'. 
            // Let me check frontend model vs backend model.
            // Frontend Resource model likely had 'category' or 'type'. 
            // In the view_file of Resource.js (backend), it has 'category'.
            // In the view_file of frontend route, it used 'type'.
            // This implies a mismatch or I missed something. 
            // Let's assume 'category' is correct based on my backend model.
            // But wait, if frontend sends 'type', I should map it or fix frontend.
            // For now, I'll use 'category' in backend model and expect 'category' or map 'type' to it.
            category: type || 'other'
        });

        res.status(201).json({ message: 'Resource created', resource });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
