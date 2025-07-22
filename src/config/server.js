require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    socketio: {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
            methods: ['GET', 'POST'],
            credentials: true
        },
        pingTimeout: 60000,
        pingInterval: 25000
    },
    rateLimit: {
        windowMs: process.env.RATE_LIMIT_WINDOW_MS || 60000,
        maxRequests: process.env.RATE_LIMIT_MAX_REQUESTS || 100
    }
};