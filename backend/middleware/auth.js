const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user info to request
 */
const requireAuth = (req, res, next) => {
    try {
        const token = req.cookies.token;

        if (!token) {
            console.log('[AUTH] No token found in cookies');
            return res.status(401).json({
                message: 'Not authenticated. Please log in.'
            });
        }

        // Verify and decode token
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('[AUTH] Token verified for user:', decoded.userId, 'role:', decoded.role);

        // Attach user info to request for downstream use
        req.user = decoded;

        next();
    } catch (error) {
        console.log('[AUTH] Token verification failed:', error.message);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Session expired. Please log in again.'
            });
        }

        return res.status(401).json({
            message: 'Invalid authentication token'
        });
    }
};

module.exports = { requireAuth };
