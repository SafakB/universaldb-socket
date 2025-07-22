const express = require('express');
const ApiController = require('../controllers/apiController');
const AuthMiddleware = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/status', ApiController.getStatus);

// Protected routes
router.use(AuthMiddleware.httpAuth);
router.post('/events', ApiController.publishEvent);
router.get('/metrics', ApiController.getMetrics);

module.exports = router;