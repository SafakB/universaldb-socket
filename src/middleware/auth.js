const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

class AuthMiddleware {
    static socketAuth(socket, next) {
        try {
            const token = socket.handshake.auth?.token;

            if (!token) {
                return next(new Error('Authentication token required'));
            }

            const decoded = jwt.verify(token, jwtConfig.secret);
            socket.user = decoded;
            socket.tables = decoded.tables ? decoded.tables.split(',') : [];
            socket.user.admin = decoded.admin || false;
            socket.user.publisher = decoded.publisher || false;

            logger.info(`User authenticated: ${decoded.sub}`);
            next();
        } catch (error) {
            logger.error('Authentication failed:', error.message);
            next(new Error('Invalid authentication token'));
        }
    }

    static httpAuth(req, res, next) {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '');

            if (!token) {
                return res.status(401).json({ error: 'Authentication token required' });
            }

            const decoded = jwt.verify(token, jwtConfig.secret);
            req.user = decoded;
            next();
        } catch (error) {
            logger.error('HTTP Authentication failed:', error.message);
            res.status(401).json({ error: 'Invalid authentication token' });
        }
    }
}

module.exports = AuthMiddleware;