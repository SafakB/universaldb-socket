const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const config = require('./config/server');
const AuthMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const SocketController = require('./controllers/socketController');
const apiRoutes = require('./routes/api');
const logger = require('./utils/logger');

class Application {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, config.socketio);
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocket();
        this.setupErrorHandling();
    }

    setupMiddleware() {
        // Body parsing middleware
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));
        
        // Static files
        this.app.use(express.static(path.join(__dirname, '../public')));
        
        // Store io instance for controllers
        this.app.set('io', this.io);
        
        logger.info('Middleware setup completed');
    }

    setupRoutes() {
        // API routes
        this.app.use('/api', apiRoutes);
        
        // Serve main page
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, '../public/index.html'));
        });
        
        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Route not found' });
        });
        
        logger.info('Routes setup completed');
    }

    setupSocket() {
        // Socket.io authentication middleware
        this.io.use(AuthMiddleware.socketAuth);
        
        // Initialize socket controller
        SocketController.initializeSocket(this.io);
        
        logger.info('Socket.io setup completed');
    }

    setupErrorHandling() {
        this.app.use(errorHandler);
        
        // Graceful shutdown
        process.on('SIGTERM', () => this.shutdown());
        process.on('SIGINT', () => this.shutdown());
        
        logger.info('Error handling setup completed');
    }

    start() {
        this.server.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} in ${config.env} mode`);
        });
    }

    shutdown() {
        logger.info('Shutting down server...');
        this.server.close(() => {
            logger.info('Server shutdown completed');
            process.exit(0);
        });
    }
}

module.exports = Application;