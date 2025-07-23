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
            // Check if user has admin or publisher privileges
            if (!req.user || (!req.user.admin && !req.user.publisher)) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Publisher privileges required to publish events'
                });
            }

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

    static getSocketStats(req, res) {
        try {
            const io = req.app.get('io');

            if (!io) {
                return res.status(500).json({ error: 'Socket.io not available' });
            }

            const stats = {
                totalConnections: io.engine.clientsCount,
                connectedSockets: [],
                rooms: {},
                timestamp: new Date().toISOString()
            };

            // Bağlı socketlerin detaylarını topla
            io.sockets.sockets.forEach((socket, socketId) => {
                const socketInfo = {
                    id: socketId,
                    userId: socket.user?.sub || 'anonymous',
                    userName: socket.user?.name || 'Unknown',
                    isAdmin: socket.user?.admin || false,
                    authorizedTables: socket.tables || [],
                    connectedAt: socket.handshake.time,
                    connectedSince: new Date() - new Date(socket.handshake.time),
                    address: socket.handshake.address,
                    userAgent: socket.handshake.headers['user-agent'],
                    rooms: Array.from(socket.rooms).filter(room => room !== socketId)
                };

                stats.connectedSockets.push(socketInfo);
            });

            // Odaların detaylarını topla
            Object.entries(io.sockets.adapter.rooms).forEach(([roomName, roomData]) => {
                // Socket ID'leri olan odaları filtrele (bunlar otomatik oluşturulan kişisel odalar)
                if (!io.sockets.sockets.has(roomName)) {
                    stats.rooms[roomName] = {
                        name: roomName,
                        memberCount: roomData.size,
                        members: Array.from(roomData).map(socketId => {
                            const socket = io.sockets.sockets.get(socketId);
                            return {
                                socketId: socketId,
                                userId: socket?.user?.sub || 'anonymous',
                                userName: socket?.user?.name || 'Unknown',
                                joinedAt: socket?.handshake.time
                            };
                        })
                    };
                }
            });

            res.json(stats);
        } catch (error) {
            logger.error('Socket stats retrieval failed:', error);
            res.status(500).json({ error: 'Failed to get socket statistics' });
        }
    }
}

module.exports = ApiController;