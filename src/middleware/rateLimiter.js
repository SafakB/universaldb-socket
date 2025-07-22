const config = require('../config/server');
const logger = require('../utils/logger');

class RateLimiter {
    constructor() {
        this.clients = new Map();
        this.cleanup();
    }

    check(userId, limit = config.rateLimit.maxRequests) {
        const now = Date.now();
        const windowStart = now - config.rateLimit.windowMs;

        if (!this.clients.has(userId)) {
            this.clients.set(userId, []);
        }

        const requests = this.clients.get(userId);
        const validRequests = requests.filter(time => time > windowStart);

        if (validRequests.length >= limit) {
            logger.warn(`Rate limit exceeded for user: ${userId}`);
            return false;
        }

        validRequests.push(now);
        this.clients.set(userId, validRequests);
        return true;
    }

    cleanup() {
        setInterval(() => {
            const now = Date.now();
            const windowStart = now - config.rateLimit.windowMs;

            for (const [userId, requests] of this.clients.entries()) {
                const validRequests = requests.filter(time => time > windowStart);
                if (validRequests.length === 0) {
                    this.clients.delete(userId);
                } else {
                    this.clients.set(userId, validRequests);
                }
            }
        }, config.rateLimit.windowMs);
    }
}

module.exports = new RateLimiter();