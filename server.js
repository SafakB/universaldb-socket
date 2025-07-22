require('dotenv').config();

const Application = require('./src/app');
const logger = require('./src/utils/logger');

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start the application
try {
    const app = new Application();
    app.start();
} catch (error) {
    logger.error('Failed to start application:', error);
    process.exit(1);
}
