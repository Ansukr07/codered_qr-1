/**
 * Role-Based Access Control (RBAC) Middleware
 * Checks if authenticated user has required role(s)
 */
const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        // Ensure user is authenticated (should be called after requireAuth)
        if (!req.user) {
            console.log('[RBAC] No user in request');
            return res.status(401).json({
                message: 'Not authenticated. Authentication required before authorization.'
            });
        }

        console.log('[RBAC] Checking role:', req.user.role, 'against allowed roles:', allowedRoles);

        // Check if user's role is in allowed roles
        if (!allowedRoles.includes(req.user.role)) {
            console.log('[RBAC] Role check FAILED. User role:', req.user.role, 'Required:', allowedRoles);
            return res.status(403).json({
                message: 'Forbidden. Insufficient permissions to access this resource.',
                requiredRole: allowedRoles.length === 1 ? allowedRoles[0] : allowedRoles,
                yourRole: req.user.role
            });
        }

        console.log('[RBAC] Role check PASSED');
        next();
    };
};

module.exports = { requireRole };
