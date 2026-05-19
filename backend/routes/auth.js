const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Participant = require('../models/Participant');
const Volunteer = require('../models/Volunteer');
const Admin = require('../models/Admin');
const supabase = require('../config/supabase');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, teamId } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Name, email and password are required' });
        }

        const normalizedEmail = String(email).toLowerCase().trim();

        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const qrCode = uuidv4();

        // Self-registration is locked to the `participant` role to prevent
        // privilege escalation via the request body. Admins/volunteers must be
        // created by an authenticated admin via the create-user endpoint.
        const user = await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: 'participant',
            teamId,
            qrCode,
        });

        // Never echo password hash back.
        const { password: _pw, ...safeUser } = user.toObject();
        res.status(201).json({ message: 'User created successfully', user: safeUser });
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

        // Hardcoded volunteer login (no database required)
        const VOLUNTEER_EMAIL = 'vol@vol.in';
        const VOLUNTEER_PASSWORD = 'volcom@1999';
        const VOLUNTEER_USER_ID = 'volunteer-stock-user';
        
        if (email.toLowerCase() === VOLUNTEER_EMAIL && password === VOLUNTEER_PASSWORD) {
            // Allow login if role is volunteer or not specified
            if (!role || role === 'volunteer') {
                const token = jwt.sign(
                    { 
                        userId: VOLUNTEER_USER_ID, 
                        role: 'volunteer', 
                        name: 'Volunteer User', 
                        email: VOLUNTEER_EMAIL 
                    },
                    JWT_SECRET,
                    { expiresIn: '1d' }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000, // 1 day
                    path: '/',
                });

                return res.json({
                    message: 'Login successful',
                    user: {
                        name: 'Volunteer User',
                        role: 'volunteer',
                        email: VOLUNTEER_EMAIL
                    }
                });
            }
        }

        let user;
        let userRole;

        // Allowed admin emails
        const ALLOWED_ADMIN_EMAILS = ['ecell@bmsit.in', 'milangs4606@gmail.com'];

        // Check based on role parameter or try all
        if (role === 'admin') {
            // Check if email is in whitelist for admin
            const emailLower = email.toLowerCase();
            if (!ALLOWED_ADMIN_EMAILS.includes(emailLower)) {
                return res.status(403).json({ message: 'Access denied. This email is not authorized for admin access.' });
            }
            user = await Admin.findOne({ email: emailLower });
            userRole = 'admin';
        } else if (role === 'volunteer') {
            user = await Volunteer.findOne({ email: email.toLowerCase() });
            userRole = 'volunteer';
        } else {
            // Try admin first, then volunteer
            const emailLower = email.toLowerCase();
            if (ALLOWED_ADMIN_EMAILS.includes(emailLower)) {
                user = await Admin.findOne({ email: emailLower });
                if (user) {
                    userRole = 'admin';
                }
            }
            if (!user) {
                user = await Volunteer.findOne({ email: emailLower });
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
        let userData;

        // Find user based on role
        if (decoded.role === 'admin') {
            user = await Admin.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            userData = {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: decoded.role,
            };
            if (user.teamId) {
                userData.teamId = user.teamId;
            }
        } else if (decoded.role === 'volunteer') {
            // Check if it's the hardcoded volunteer user
            if (decoded.userId === 'volunteer-stock-user') {
                userData = {
                    userId: 'volunteer-stock-user',
                    name: 'Volunteer User',
                    email: 'vol@vol.in',
                    role: 'volunteer',
                };
            } else {
                // Regular volunteer from database
                user = await Volunteer.findById(decoded.userId).select('-password');
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                userData = {
                    userId: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: decoded.role,
                };
                if (user.qrCode) {
                    userData.qrCode = user.qrCode;
                }
                if (user.teamId) {
                    userData.teamId = user.teamId;
                }
            }
        } else if (decoded.role === 'participant') {
            // Use Supabase for participants
            if (supabase) {
                const { data: participant, error } = await supabase
                    .from('participants')
                    .select('*')
                    .eq('id', decoded.userId)
                    .single();

                if (error || !participant) {
                    console.error('Error fetching participant from Supabase:', error);
                    return res.status(404).json({ message: 'Participant not found' });
                }

                userData = {
                    userId: participant.id,
                    name: participant.name,
                    email: participant.email,
                    role: decoded.role,
                };

                if (participant.qr_code) {
                    userData.qrCode = participant.qr_code;
                }
                if (participant.team_id) {
                    userData.teamId = participant.team_id;
                }
                if (participant.participant_id) {
                    userData.participantId = participant.participant_id;
                }
            } else {
                // Fallback to MongoDB if Supabase not configured
                user = await Participant.findById(decoded.userId);
                if (!user) {
                    return res.status(404).json({ message: 'User not found' });
                }
                userData = {
                    userId: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: decoded.role,
                };
                if (user.qrCode) {
                    userData.qrCode = user.qrCode;
                }
                if (user.teamId) {
                    userData.teamId = user.teamId;
                }
                if (user.participantId) {
                    userData.participantId = user.participantId;
                }
            }
        } else {
            // Fallback to old User model for backward compatibility
            user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            userData = {
                userId: user._id.toString(),
                name: user.name,
                email: user.email,
                role: decoded.role,
            };
            if (user.teamId) {
                userData.teamId = user.teamId;
            }
        }

        res.json({ user: userData });
    } catch (error) {
        console.error('Error in /me endpoint:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

// Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out successfully' });
});

module.exports = router;
