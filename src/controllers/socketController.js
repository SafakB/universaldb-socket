const EventService = require('../services/eventService');
const SocketService = require('../services/socketService');
const rateLimiter = require('../middleware/rateLimiter');
const logger = require('../utils/logger');

class SocketController {
    static initializeSocket(io) {
        io.on('connection', (socket) => {
            SocketService.handleConnection(socket);

            // dbChange event handler
            socket.on('dbChange', (data) => {
                this.handleDbChange(io, socket, data);
            });
        });
    }

    static handleDbChange(io, socket, data) {
        try {
            const userId = socket.user?.sub || 'anonymous';
            // Rate limiting check (admin users bypass rate limiting)
            if (!socket.user.admin && !rateLimiter.check(userId, 5)) {
                socket.emit('error', { message: 'Rate limit exceeded for dbChange events' });
                return;
            }

            // Publish the event
            const result = EventService.publishDbChange(io, data);

            // Send confirmation to sender
            socket.emit('dbChangeAck', {
                success: true,
                eventsPublished: result.eventsPublished,
                timestamp: new Date().toISOString()
            });

            logger.info(`dbChange processed by ${socket.id}: ${data.table}.${data.action}`);
        } catch (error) {
            logger.error('dbChange error:', error);
            socket.emit('error', {
                message: 'Failed to process dbChange event',
                details: error.message
            });
        }
    }
}

module.exports = SocketController;