import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';

/**
 * Middleware to require a valid JWT token.
 * Populates req.user with the decoded token payload.
 */
export const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided', code: 'UNAUTHORIZED' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.error('[AUTH] Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token', code: 'UNAUTHORIZED' });
    }
};

/**
 * Middleware to require admin privileges.
 * Must be used AFTER requireAuth.
 */
export const requireAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    }
    next();
};
