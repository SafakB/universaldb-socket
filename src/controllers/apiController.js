const EventService = require('../services/eventService');
const logger = require('../utils/logger');

class ApiController {
    static getStatus(req, res) {
        try {
            const status = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: process.env.npm_package_version || '1.0.0',
                environment: process.env.NODE_ENV || 'development',
                uptime: process.uptime()
            };

            res.json(status);
        } catch (error) {
            logger.error('Status check failed:', error);
            res.status(500).json({ error: 'Failed to get status' });
        }
    }

    static publishEvent(req, res) {
        try {
            const eventData = req.body;
            const io = req.app.get('io');

            if (!io) {
                return res.status(500).json({ error: 'Socket.io not available' });
            }
            const result = EventService.publishDbChange(io, eventData);

            res.json({
                success: true,
                message: 'Event published successfully',
                eventsPublished: result.eventsPublished,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('API publish event failed:', error);
            res.status(400).json({
                error: 'Failed to publish event',
                details: error.message
            });
        }
    }

    static getMetrics(req, res) {
        try {
            const io = req.app.get('io');
            const metrics = {
                connectedClients: io ? io.engine.clientsCount : 0,
                rooms: io ? Object.keys(io.sockets.adapter.rooms).length : 0,
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                timestamp: new Date().toISOString()
            };

            res.json(metrics);
        } catch (error) {
            logger.error('Metrics retrieval failed:', error);
            res.status(500).json({ error: 'Failed to get metrics' });
        }
    }
}

module.exports = ApiController;