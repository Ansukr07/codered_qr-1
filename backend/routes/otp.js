const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');
const OTP = require('../models/OTP');

// Generate OTP for participant login
router.post('/generate', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if participant exists with this email
        const participant = await Participant.findOne({ email: email.toLowerCase() });
        if (!participant) {
            return res.status(404).json({ message: 'No participant found with this email' });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing OTPs for this email
        await OTP.updateMany(
            { email: email.toLowerCase(), isUsed: false },
            { isUsed: true }
        );

        // Create new OTP
        await OTP.create({
            email: email.toLowerCase(),
            otp: otpCode,
            expiresAt,
        });

        // In production, send email here using nodemailer, sendgrid, etc.
        // For now, we'll return it (remove this in production!)
        console.log(`OTP for ${email}: ${otpCode}`);

        res.json({
            message: 'OTP sent to your email',
            // Remove this in production - only for development
            otp: process.env.NODE_ENV === 'development' ? otpCode : undefined
        });
    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Verify OTP and login participant
router.post('/verify', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Find valid OTP
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            otp,
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Find participant
        const participant = await Participant.findOne({ email: email.toLowerCase() });
        if (!participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        // Mark email as verified if not already
        if (!participant.isEmailVerified) {
            participant.isEmailVerified = true;
            await participant.save();
        }

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        const token = jwt.sign(
            {
                userId: participant._id,
                role: 'participant',
                name: participant.name,
                email: participant.email
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

        res.json({
            message: 'Login successful',
            user: {
                name: participant.name,
                role: 'participant',
                email: participant.email,
                participantId: participant.participantId
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

