const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { sendOTPEmail } = require('../config/email');

// Check if Supabase is configured
if (!supabase) {
    console.error('⚠️  Supabase is not configured. OTP routes will not work.');
}

// Generate OTP for participant login
router.post('/generate', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ message: 'Supabase is not configured. Please check your environment variables.' });
        }

        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Check if participant exists with this email in Supabase
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (participantError || !participant) {
            return res.status(404).json({ message: 'No participant found with this email' });
        }

        // Generate 6-digit OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Invalidate any existing OTPs for this email
        await supabase
            .from('otps')
            .update({ is_used: true })
            .eq('email', email.toLowerCase())
            .eq('is_used', false);

        // Create new OTP in Supabase
        const { error: otpError } = await supabase
            .from('otps')
            .insert({
                email: email.toLowerCase(),
                otp: otpCode,
                expires_at: expiresAt.toISOString(),
                is_used: false
            });

        if (otpError) {
            console.error('Error creating OTP:', otpError);
            return res.status(500).json({ message: 'Failed to generate OTP' });
        }

        // Send OTP via email
        const emailResult = await sendOTPEmail(email, otpCode, participant.name);
        
        // In development, also return OTP in response for testing
        const response = {
            message: emailResult.success 
                ? 'OTP sent to your email' 
                : 'OTP generated (email failed, check console)',
        };

        // Only include OTP in response for development
        if (process.env.NODE_ENV === 'development') {
            response.otp = otpCode;
        }

        res.json(response);
    } catch (error) {
        console.error('OTP generation error:', error);
        res.status(500).json({ message: error.message });
    }
});

// Verify OTP and login participant
router.post('/verify', async (req, res) => {
    try {
        if (!supabase) {
            return res.status(500).json({ message: 'Supabase is not configured. Please check your environment variables.' });
        }

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP are required' });
        }

        // Find valid OTP in Supabase
        const { data: otpRecord, error: otpError } = await supabase
            .from('otps')
            .select('*')
            .eq('email', email.toLowerCase())
            .eq('otp', otp)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString())
            .single();

        if (otpError || !otpRecord) {
            return res.status(401).json({ message: 'Invalid or expired OTP' });
        }

        // Find participant in Supabase
        const { data: participant, error: participantError } = await supabase
            .from('participants')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (participantError || !participant) {
            return res.status(404).json({ message: 'Participant not found' });
        }

        // Mark OTP as used
        await supabase
            .from('otps')
            .update({ is_used: true })
            .eq('id', otpRecord.id);

        // Mark email as verified if not already
        if (!participant.is_email_verified) {
            await supabase
                .from('participants')
                .update({ is_email_verified: true })
                .eq('id', participant.id);
        }

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

        const token = jwt.sign(
            {
                userId: participant.id,
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
                participantId: participant.participant_id
            }
        });
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;

