const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Participant = require('../models/Participant');
const Volunteer = require('../models/Volunteer');
const Admin = require('../models/Admin');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role, teamId } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const qrCode = uuidv4();

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || 'participant',
            teamId,
            qrCode,
        });

        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Login - for Admin and Volunteer (email + password)
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        let user;
        let userRole;

        // Check based on role parameter or try all
        if (role === 'admin') {
            user = await Admin.findOne({ email: email.toLowerCase() });
            userRole = 'admin';
        } else if (role === 'volunteer') {
            user = await Volunteer.findOne({ email: email.toLowerCase() });
            userRole = 'volunteer';
        } else {
            // Try admin first, then volunteer
            user = await Admin.findOne({ email: email.toLowerCase() });
            if (user) {
                userRole = 'admin';
            } else {
                user = await Volunteer.findOne({ email: email.toLowerCase() });
                if (user) {
                    userRole = 'volunteer';
                }
            }
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: userRole, name: user.name, email: user.email },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            path: '/',
        });

        res.json({
            message: 'Login successful',
            user: {
                name: user.name,
                role: userRole,
                email: user.email
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Me (Get Current User)
router.get('/me', async (req, res) => {
    const token = req.cookies.token;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        let user;

        // Find user based on role
        if (decoded.role === 'admin') {
            user = await Admin.findById(decoded.userId).select('-password');
        } else if (decoded.role === 'volunteer') {
            user = await Volunteer.findById(decoded.userId).select('-password');
        } else if (decoded.role === 'participant') {
            user = await Participant.findById(decoded.userId);
        } else {
            // Fallback to old User model for backward compatibility
            user = await User.findById(decoded.userId).select('-password');
        }

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const userData = {
            userId: user._id,
            name: user.name,
            email: user.email,
            role: decoded.role,
        };

        // Add role-specific fields
        if (decoded.role === 'participant' && user.qrCode) {
            userData.qrCode = user.qrCode;
            userData.teamId = user.teamId;
            userData.participantId = user.participantId;
        } else if (decoded.role === 'volunteer' && user.qrCode) {
            userData.qrCode = user.qrCode;
        } else if (user.teamId) {
            userData.teamId = user.teamId;
        }

        res.json({ user: userData });
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
