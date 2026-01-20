import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.util';

// Extend Express Request to include authenticated user
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: 'DRIVER' | 'RESTAURANT' | 'ADMIN';
    };
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'No token provided' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyAccessToken(token);

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware to require specific roles
 */
export const requireRole = (...allowedRoles: Array<'DRIVER' | 'RESTAURANT' | 'ADMIN'>) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({ error: 'Insufficient permissions' });
            return;
        }

        next();
    };
};
