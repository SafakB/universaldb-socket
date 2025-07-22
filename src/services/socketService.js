const logger = require('../utils/logger');
const rateLimiter = require('../middleware/rateLimiter');
const Validator = require('../utils/validator');

class SocketService {
    static handleConnection(socket) {
        const userId = socket.user?.sub || 'anonymous';
        logger.info(`Socket connected: ${socket.id} (User: ${userId})`);

        // Subscribe event handler
        socket.on('subscribe', (data) => {
            this.handleSubscribe(socket, data);
        });

        // Unsubscribe event handler
        socket.on('unsubscribe', (data) => {
            this.handleUnsubscribe(socket, data);
        });

        // Disconnect handler
        socket.on('disconnect', () => {
            logger.info(`Socket disconnected: ${socket.id} (User: ${userId})`);
        });
    }

    static handleSubscribe(socket, data) {
        try {
            const userId = socket.user?.sub || 'anonymous';
            
            // Rate limiting check
            if (!rateLimiter.check(userId, 10)) {
                socket.emit('error', { message: 'Rate limit exceeded for subscribe operations' });
                return;
            }

            const { channel } = data;
            
            // Validate channel format
            const validation = Validator.validateChannel(channel);
            if (!validation.isValid) {
                socket.emit('error', { message: validation.error });
                return;
            }

            // Get authorized channels for the requested pattern
            const authorizedChannels = this.getAuthorizedChannels(socket, channel);
            if (authorizedChannels.length === 0) {
                socket.emit('error', { message: 'Not authorized for this channel' });
                return;
            }

            // Join all authorized channels
            authorizedChannels.forEach(ch => {
                socket.join(ch);
            });
            
            socket.emit('subscribed', { 
                channel: channel,
                authorizedChannels: authorizedChannels 
            });
            logger.info(`Socket ${socket.id} subscribed to: ${authorizedChannels.join(', ')}`);
        } catch (error) {
            logger.error('Subscribe error:', error);
            socket.emit('error', { message: 'Failed to subscribe to channel' });
        }
    }

    static handleUnsubscribe(socket, data) {
        try {
            const { channel } = data;
            
            // Eğer wildcard pattern veya genel kanal ise, tüm yetkili kanallardan ayrıl
            const authorizedChannels = this.getAuthorizedChannels(socket, channel);
            
            if (authorizedChannels.length > 0) {
                // Tüm yetkili kanallardan ayrıl
                authorizedChannels.forEach(ch => {
                    socket.leave(ch);
                });
                socket.emit('unsubscribed', { 
                    channel: channel,
                    unsubscribedChannels: authorizedChannels 
                });
                logger.info(`Socket ${socket.id} unsubscribed from: ${authorizedChannels.join(', ')}`);
            } else {
                // Tek kanaldan ayrıl
                socket.leave(channel);
                socket.emit('unsubscribed', { 
                    channel: channel,
                    unsubscribedChannels: [channel] 
                });
                logger.info(`Socket ${socket.id} unsubscribed from: ${channel}`);
            }
        } catch (error) {
            logger.error('Unsubscribe error:', error);
            socket.emit('error', { message: 'Failed to unsubscribe from channel' });
        }
    }

    static getAuthorizedChannels(socket, requestedChannel) {
        const userTables = socket.tables || [];
        const authorizedChannels = [];
        
        // Handle 'db' channel - return all authorized table channels
        if (requestedChannel === 'db') {
            userTables.forEach(table => {
                authorizedChannels.push(`db.${table}`);
            });
            return authorizedChannels;
        }

        // Handle wildcard patterns like 'db.*.insert'
        if (requestedChannel.includes('*')) {
            const parts = requestedChannel.split('.');
            if (parts.length >= 2 && parts[1] === '*') {
                // For patterns like 'db.*.insert' or 'db.*'
                userTables.forEach(table => {
                    const channelPattern = requestedChannel.replace('*', table);
                    authorizedChannels.push(channelPattern);
                });
                return authorizedChannels;
            }
        }

        // Handle specific channels like 'db.pages.insert'
        const channelParts = requestedChannel.split('.');
        if (channelParts.length >= 2) {
            const tableName = channelParts[1];
            if (userTables.includes(tableName)) {
                authorizedChannels.push(requestedChannel);
            }
        }

        return authorizedChannels;
    }

    static isAuthorizedForChannel(socket, channel) {
        const authorizedChannels = this.getAuthorizedChannels(socket, channel);
        return authorizedChannels.length > 0;
    }
}

module.exports = SocketService;