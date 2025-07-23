# MySQL Socket Event Server - Developer Guide

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture and Design](#architecture-and-design)
3. [Installation and Configuration](#installation-and-configuration)
4. [Project Structure](#project-structure)
5. [Core Components](#core-components)
6. [API Reference](#api-reference)
7. [Security](#security)
8. [Development Process](#development-process)
9. [Testing and Debug](#testing-and-debug)
10. [Deployment](#deployment)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

### What It Does
MySQL Socket Event Server is a Node.js application that delivers database changes (insert, update, delete) to clients in real-time via WebSocket connections.

### Core Features
- **Real-time Event Broadcasting**: Database changes are delivered instantly
- **JWT Authentication**: Token-based secure authentication
- **Hierarchical Channel System**: Flexible channel structure for targeted listening
- **Table-based Authorization**: Users can only listen to tables they are authorized for
- **Rate Limiting**: DDoS protection and resource management
- **Modern Web UI**: Ready-to-use interface for testing and development

### Technology Stack
- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.io
- **Authentication**: JSON Web Tokens (JWT)
- **Frontend**: Vanilla JavaScript, Bootstrap 5

---

## 🏗️ Architecture and Design

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │   Mobile App    │    │   Backend API   │
│                 │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │   MySQL Socket Server    │
                    │                           │
                    │  ┌─────────────────────┐  │
                    │  │   Socket.io Layer   │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │   Express.js API    │  │
                    │  └─────────────────────┘  │
                    │  ┌─────────────────────┐  │
                    │  │   JWT Auth Layer    │  │
                    │  └─────────────────────┘  │
                    └───────────────────────────┘
```

### Channel Hierarchy

```
db (root)
├── db.users
│   ├── db.users.insert
│   ├── db.users.update
│   │   └── db.users.update.123
│   └── db.users.delete
│       └── db.users.delete.456
├── db.products
│   └── db.products.*
│       └── db.products.*.789
└── db.*.insert (wildcard)
```

### Data Flow

1. **Event Generation**: Application detects database change
2. **Event Publishing**: `dbChange` event is sent to Socket.io
3. **Channel Resolution**: Event is distributed to hierarchical channels
4. **Authorization Check**: User permissions are checked
5. **Event Delivery**: Event is delivered to authorized clients

---

## ⚙️ Installation and Configuration

### System Requirements
- Node.js v16+ (recommended v18+)
- npm v8+ or yarn v1.22+
- 512MB+ RAM
- 100MB+ disk space

### Step-by-Step Installation

#### 1. Download Project
```bash
git clone <repository-url>
cd universaldb-socket
```

#### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

#### 3. Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` file:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration (IMPORTANT: Change in production!)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

#### 4. Start Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

#### 5. Test
- Open `http://localhost:3001` in browser
- Use `http://localhost:3001/index.html` file for testing
- Visit `http://localhost:3001/monitor.html` for monitoring


---

## 📁 Project Structure

```
universaldb-socket/
├── src/                          # Main source code
│   ├── app.js                    # Main application class
│   ├── config/                   # Configuration files
│   │   ├── server.js             # Server settings
│   │   └── jwt.js                # JWT configuration
│   ├── controllers/              # Business logic controllers
│   │   ├── socketController.js   # Socket.io event handlers
│   │   └── apiController.js      # REST API handlers
│   ├── middleware/               # Middleware
│   │   ├── auth.js               # Authentication
│   │   ├── rateLimiter.js        # Rate limiting
│   │   └── errorHandler.js       # Error handling
│   ├── services/                 # Business logic services
│   │   ├── eventService.js       # Event publishing
│   │   └── socketService.js      # Socket management
│   ├── utils/                    # Utility tools
│   │   ├── logger.js             # Logging
│   │   └── validator.js          # Data validation
│   └── routes/                   # API routes
│       └── api.js                # REST endpoints
├── public/                       # Static files
│   ├── index.html                # Main page
│   ├── monitor.html              # Monitoring page
│   ├── css/
│   └── js/
├── server.js                     # Application entry point
├── package.json                  # Project metadata
├── .env.example                  # Environment variables template

└── README.md                     # Project documentation
```

---

## 🔧 Core Components

### 1. Application Class (`src/app.js`)
Main application class. Configures Express.js and Socket.io.

```javascript
class Application {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server, config.socketio);
    }
    
    start() {
        this.server.listen(config.port);
    }
}
```

**Responsibilities:**
- Express.js middleware setup
- Socket.io configuration
- Route definitions
- Error handling
- Graceful shutdown

### 2. Socket Controller (`src/controllers/socketController.js`)
Manages Socket.io events.

```javascript
class SocketController {
    static handleDbChange(io, socket, data) {
        // Rate limiting
        // Event validation
        // Event publishing
        // Response sending
    }
}
```

**Responsibilities:**
- Processing `dbChange` events
- Rate limiting control
- Event validation
- Response sending

### 3. Event Service (`src/services/eventService.js`)
Manages event publishing logic.

```javascript
class EventService {
    static publishDbChange(io, data) {
        const events = this.generateEventChannels(table, action, record);
        events.forEach(({ channel, eventName }) => {
            io.to(channel).emit(eventName, data);
        });
    }
}
```

**Responsibilities:**
- Hierarchical channel creation
- Event distribution
- Validation

### 4. Socket Service (`src/services/socketService.js`)
Socket connection management and channel subscriptions.

```javascript
class SocketService {
    static handleSubscribe(socket, data) {
        const authorizedChannels = this.getAuthorizedChannels(socket, channel);
        authorizedChannels.forEach(ch => socket.join(ch));
    }
}
```

**Responsibilities:**
- Socket connection management
- Channel subscription operations
- Authorization control
- Wildcard pattern resolution

### 5. Auth Middleware (`src/middleware/auth.js`)
JWT-based authentication.

```javascript
class AuthMiddleware {
    static socketAuth(socket, next) {
        const token = socket.handshake.auth?.token;
        const decoded = jwt.verify(token, jwtConfig.secret);
        socket.user = decoded;
        socket.tables = decoded.tables ? decoded.tables.split(',') : [];
    }
}
```

**Responsibilities:**
- JWT token validation
- Adding user information to socket
- Extracting table permissions

---

## 📡 API Reference

### Socket.io Events

#### Client → Server

##### `dbChange`
Database change notification.

```javascript
socket.emit('dbChange', {
    timestamp: '2024-01-15T10:30:45.123Z',
    table: 'users',
    action: 'update',
    record: {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com'
    }
});
```

**Parameters:**
- `timestamp` (string): ISO 8601 format
- `table` (string): Table name
- `action` (string): 'insert', 'update', 'delete'
- `record` (object): Record data

##### `subscribe`
Subscribe to channel.

```javascript
socket.emit('subscribe', 'db.users.update', (authorizedChannels) => {
    console.log('Subscribed channels:', authorizedChannels);
});
```

**Parameters:**
- `channel` (string): Channel name
- `callback` (function): Success callback

##### `unsubscribe`
Unsubscribe from channel.

```javascript
socket.emit('unsubscribe', 'db.users.update');
```

#### Server → Client

##### `db.*` (Hierarchical Events)
Database change notifications.

```javascript
socket.on('db.users.update', (data) => {
    console.log('User updated:', data);
});
```

##### `subscribed`
Subscription success notification.

```javascript
socket.on('subscribed', (data) => {
    console.log('Subscribed:', data.authorizedChannels);
});
```

##### `error`
Error notification.

```javascript
socket.on('error', (error) => {
    console.error('Socket error:', error.message);
});
```

### Channel Formats

| Format | Description | Example |
|--------|-------------|----------|
| `db` | All changes | All events |
| `db.[table]` | Table-based | `db.users` |
| `db.[table].[action]` | Table + action | `db.users.insert` |
| `db.[table].[action].[id]` | Specific record | `db.users.update.123` |
| `db.[table].*.[id]` | Record-based (all actions) | `db.users.*.123` |
| `db.*.[action]` | Action-based (all tables) | `db.*.delete` |

---

## 🔐 Güvenlik

### JWT Token Structure

#### 1. User JWT Token (Socket Connections)

```json
{
  "sub": "user_id",           // User ID
  "name": "User Name",        // User name
  "tables": "table1,table2",  // Accessible tables (comma-separated)
  "iat": 1640995200,           // Token creation time
  "exp": 1640998800            // Token expiration time
}
```

**Field Descriptions:**
- `sub`: User's unique identifier
- `name`: User's display name
- `tables`: List of tables the user can access
- `iat`: Token creation time (Unix timestamp)
- `exp`: Token expiration time (Unix timestamp)

#### 2. Admin JWT Token (External Systems)

For DB change requests from external systems:

```json
{
  "sub": "admin_id",          // Admin system ID
  "name": "Admin Name",       // Admin system name
  "admin": true,              // Admin privilege
  "iat": 1753215601,          // Token creation time
  "exp": 1753219201           // Token expiration time
}
```

**Usage Scenarios:**
- DB change notifications from CodeIgniter applications
- Real-time updates from Laravel API
- Event sending from Node.js microservices
- Data synchronization from other backend systems

### Security Measures

#### 1. JWT Secret Security
```bash
# Must change in production!
export JWT_SECRET="$(openssl rand -base64 32)"
```

#### 2. CORS Configuration
```javascript
// config/server.js
socketio: {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
        methods: ['GET', 'POST'],
        credentials: true
    }
}
```

#### 3. Rate Limiting
```javascript
// middleware/rateLimiter.js
const limits = new Map();

class RateLimiter {
    static check(userId, maxRequests) {
        // Implementation
    }
}
```

#### 4. Input Validation
```javascript
// utils/validator.js
static validateEventData(data) {
    // Timestamp validation
    // Table name validation
    // Action validation
    // Record validation
}
```

---

## 🛠️ Development Process

### Development Environment Setup

#### 1. Required Tools
```bash
# Node.js version manager
nvm install 18
nvm use 18

# Global tools
npm install -g nodemon eslint prettier
```

#### 2. IDE Configuration
**VS Code Extensions:**
- ES6 String HTML
- Prettier
- ESLint
- Node.js Extension Pack

#### 3. Git Hooks
```bash
# Pre-commit hook
npm run lint
npm run format
```

### Code Standards

#### 1. ESLint Configuration
```json
{
  "extends": ["eslint:recommended"],
  "env": {
    "node": true,
    "es2021": true
  },
  "rules": {
    "indent": ["error", 4],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

#### 2. Prettier Configuration
```json
{
  "tabWidth": 4,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 3. Naming Conventions
- **Classes**: PascalCase (`EventService`)
- **Functions**: camelCase (`handleDbChange`)
- **Constants**: UPPER_SNAKE_CASE (`JWT_SECRET`)
- **Files**: camelCase (`socketController.js`)

### Adding New Features

#### 1. Adding Event Handler
```javascript
// src/controllers/socketController.js
static handleNewEvent(io, socket, data) {
    try {
        // Validation
        // Business logic
        // Response
    } catch (error) {
        // Error handling
    }
}
```

#### 2. Adding Middleware
```javascript
// src/middleware/newMiddleware.js
class NewMiddleware {
    static process(req, res, next) {
        // Implementation
        next();
    }
}
```

#### 3. Adding Service
```javascript
// src/services/newService.js
class NewService {
    static processData(data) {
        // Implementation
    }
}
```

---

## 🧪 Testing and Debug

### Testing Strategy

#### 1. Unit Tests
```javascript
// tests/services/eventService.test.js
const EventService = require('../../src/services/eventService');

describe('EventService', () => {
    test('should generate correct channels', () => {
        const channels = EventService.generateEventChannels('users', 'update', {id: 123});
        expect(channels).toContain('db.users.update.123');
    });
});
```

#### 2. Integration Tests
```javascript
// tests/integration/socket.test.js
const io = require('socket.io-client');

describe('Socket Integration', () => {
    test('should authenticate with valid token', (done) => {
        const socket = io('http://localhost:3001', {
            auth: { token: validToken }
        });
        socket.on('connect', done);
    });
});
```

### Debug Techniques

#### 1. Logging
```javascript
// src/utils/logger.js
const logger = require('./logger');

logger.info('Connection established', { socketId: socket.id });
logger.error('Authentication failed', { error: error.message });
logger.debug('Event data', { data });
```

#### 2. Socket.io Debug
```bash
# All Socket.io debug information
DEBUG=socket.io:* node server.js

# Server debug only
DEBUG=socket.io:server node server.js
```

#### 3. Chrome DevTools
```javascript
// In browser console
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.onAny((event, ...args) => console.log(event, args));
```

### Testing Tools

#### 1. Using Emit.html
- Open `http://localhost:3001/index.html`
- Update JWT token
- Perform event sending and listening tests

#### 2. Postman/Insomnia
```javascript
// WebSocket connection test
const socket = new WebSocket('ws://localhost:3001/socket.io/?EIO=4&transport=websocket');
```

#### 3. Node.js Test Script
```javascript
// test-client.js
const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
    auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
    console.log('Connected');
    socket.emit('subscribe', 'db.users');
});
```

---

## 🚀 Deployment

### Production Preparation

#### 1. Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

#### 2. PM2 Configuration
```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'universaldb-socket-server',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3001
        }
    }]
};
```

#### 3. Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

USER node

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  universaldb-socket:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

### Monitoring and Logging

#### 1. Health Check Endpoint
```javascript
// src/routes/api.js
router.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});
```

#### 2. Metrics Collection
```javascript
// src/utils/metrics.js
class Metrics {
    static trackConnection(socketId) {
        // Implementation
    }
    
    static trackEvent(eventType) {
        // Implementation
    }
}
```

---

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Connection Issues

**Issue**: Cannot establish socket connection
```
Error: xhr poll error
```

**Solution**:
```javascript
// Check CORS settings
// config/server.js
socketio: {
    cors: {
        origin: "*", // For development
        methods: ["GET", "POST"]
    }
}
```

#### 2. Authentication Issues

**Issue**: JWT token invalid
```
Error: Invalid authentication token
```

**Solution**:
```javascript
// Check the token
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log(decoded);
```

#### 3. Event Delivery Issues

**Issue**: Events are not being delivered

**Debug Steps**:
```javascript
// 1. Check socket rooms
console.log(io.sockets.adapter.rooms);

// 2. Check user permissions
console.log(socket.tables);

// 3. Check channel authorization
const authorized = SocketService.isAuthorizedForChannel(socket, channel);
console.log('Authorized:', authorized);
```

#### 4. Performance Issues

**Issue**: Slow response times

**Optimization**:
```javascript
// 1. Check rate limiting settings
// 2. Reduce event payload size
// 3. Clean up unnecessary channel subscriptions
// 4. Check for memory leaks
```

### Debug Commands

```bash
# Detailed logging
DEBUG=* npm run dev

# Socket.io specific
DEBUG=socket.io:* npm run dev

# Memory usage monitoring
node --inspect server.js

# Performance profiling
node --prof server.js
```

### Log Analysis

```bash
# Filter error logs
grep "ERROR" logs/app.log

# Count connection logs
grep "Socket connected" logs/app.log | wc -l

# Find rate limit violations
grep "Rate limit exceeded" logs/app.log
```

---

## 📚 Additional Resources

### Documentation
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Development Tools
- [Postman](https://www.postman.com/) - API testing
- [Socket.io Client Tool](https://amritb.github.io/socketio-client-tool/) - WebSocket testing
- [JWT Debugger](https://jwt.io/#debugger-io) - Token debugging

### Monitoring Tools
- [PM2 Monitoring](https://pm2.keymetrics.io/)
- [New Relic](https://newrelic.com/)
- [DataDog](https://www.datadoghq.com/)

---

**Last Updated**: 2024-01-15  
**Version**: 1.0.0  
**Developer**: Şafak Bahçe

> This documentation is prepared for developers new to the project. You can use the GitHub Issues page for your questions.