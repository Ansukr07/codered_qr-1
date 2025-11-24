/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if authenticated user has required role(s)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (should be called after requireAuth)
        if (!req.user) {
            return res.status(401).json({
                message: 'Not authenticated. Authentication required before authorization.'
            });
        }

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden. Insufficient permissions to access this resource.',
                requiredRole: allowedRoles.length === 1 ? allowedRoles[0] : allowedRoles,
                yourRole: req.user.role
            });
        }

        next();
    };
};

module.exports = { requireRole };
