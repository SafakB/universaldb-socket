# MySQL Socket Event Server

A **Express.js** and **Socket.io** based event server that delivers MySQL database changes to clients in real-time. Provides secure and scalable real-time data transmission with JWT authentication and hierarchical channel structure.

## 🚀 Features

- **🔐 JWT Authentication:** Token-based secure connection and authorization
- **📡 Real-Time Event Publishing:** Database changes (insert, update, delete) are transmitted instantly
- **🏗️ Hierarchical Channel Structure:** Flexible listening based on tables, operations, and record IDs
- **🏠 Room Logic:** Clients only receive events from channels they subscribe to
- **🎨 Modern Web UI:** Responsive design with Bootstrap 5 and JSON syntax highlighting
- **🛡️ CORS Support:** Secure and customizable cross-origin connections
- **📊 Table-Based Authorization:** Users can only listen to tables they have permission for

## 📋 Requirements

- Node.js (v16+ recommended)
- npm or yarn

## ⚡ Quick Start

### 1. Clone the Project
```bash
git clone <repository-url>
cd universaldb-socket
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
```bash
cp .env.example .env
# Edit the .env file with your configuration
```

### 4. Start the Server
```bash
# Development mode (auto-restart)
npm run dev

# Production mode
npm start
```

### 5. Open the Web Playground
Visit link in your browser: http://localhost:3001/

### 6. Open the Monitoring Sockets and Rooms
Visit link in your browser: http://localhost:3001/monitor.html


## 📁 Project Structure

```
universaldb-socket/
├── src/
│   ├── app.js                    # Main application class
│   ├── config/
│   │   ├── server.js             # Server configuration
│   │   └── jwt.js                # JWT configuration
│   ├── controllers/
│   │   ├── socketController.js   # Socket.io controller
│   │   └── apiController.js      # REST API controller
│   ├── middleware/
│   │   ├── auth.js               # Authentication middleware
│   │   ├── rateLimiter.js        # Rate limiting middleware
│   │   └── errorHandler.js       # Error handling middleware
│   ├── services/
│   │   ├── eventService.js       # Event publishing service
│   │   └── socketService.js      # Socket management service
│   ├── utils/
│   │   ├── logger.js             # Logging utility
│   │   └── validator.js          # Data validation utility
│   └── routes/
│       └── api.js                # API routes
├── public/
│   ├── index.html                # Main web interface
│   ├── monitor.html              # Monitoring web interface
│   ├── css/
│   │   └── style.css             # CSS styles
│   └── js/
│       └── client.js             # Client JavaScript library
├── server.js                     # Main entry point
├── package.json                  # Project dependencies
├── .env.example                  # Environment variables example
├── .gitignore                    # Git ignore file
└── README.md                     # This file
```


## 🔧 Installation and Configuration

### Dependencies
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.8.1"
  }
}
```

### JWT Configuration
Set the `JWT_SECRET` value as an environment variable in production:
```bash
export JWT_SECRET="your-super-secret-key"
```

## 📡 Channel Structure and Event System

### Hierarchical Channel Names

| Channel Format | Description | Example |
|---------------|----------|-------|
| `db` | All database changes | All events |
| `db.[table]` | Specific table | `db.users` |
| `db.[table].[action]` | Table + operation type | `db.users.insert` |
| `db.[table].[action].[id]` | Table + operation + record ID | `db.users.update.123` |
| `db.[table].*.[id]` | Table + record ID (all operations) | `db.users.*.123` |
| `db.*.[action]` | All tables + specific operation | `db.*.delete` |

### Wildcard Support
```javascript
// Listen to insert operations in all tables
socket.emit('subscribe', 'db.*.insert');

// Listen to all operations in users table
socket.emit('subscribe', 'db.users');

// Listen to all changes of a specific record
socket.emit('subscribe', 'db.products.*.456');
```

## 📨 Event Format

### dbChange Event Structure
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "table": "users",
  "action": "update",
  "record": {
    "id": 123,
    "name": "John Doe",
    "email": "john@example.com",
    "updated_at": "2024-01-15T10:30:45.123Z"
  }
}
```

### Supported Operation Types
- `insert` - Adding new record
- `update` - Updating existing record
- `delete` - Deleting record

## 🔐 Security and Authentication

### JWT Token Structure

#### 1. User JWT Token (For Socket Connections)

JWT token structure used for Socket.io connections:

```json
{
  "sub": "user_id",
  "name": "User Name",
  "tables": "users,products,orders",
  "iat": 1753215601,
  "exp": 1753219201
}
```

**Token Fields:**
- `sub`: User ID (string)
- `name`: User name (string)
- `tables`: Accessible tables (comma-separated string)
- `iat`: Token creation time (Unix timestamp)
- `exp`: Token expiration time (Unix timestamp)

#### 2. Admin JWT Token (For External Systems)

Admin or Publisher JWT token structure used for DB change requests from external systems (CodeIgniter, Laravel, Node.js etc.):

```json
{
  "sub": "admin_id",
  "name": "Admin Name",
  "admin": true,
  "publisher": false,
  "iat": 1753215601,
  "exp": 1753219201
}
```

**Token Fields:**
- `sub`: Unique identifier of admin system (string)
- `name`: Display name of admin system (string)
- `admin`: Admin privilege (boolen)
- `publisher`: Publisher privilege (boolen)
- `iat`: Token creation time (Unix timestamp)
- `exp`: Token expiration time (Unix timestamp)

**Authorization System:**
- **User JWT:** Access only to tables specified in `tables` field
- **Admin JWT:** Full access to all tables, bypasses rate limiter
- **Publisher JWT:** Access to publish events with rate limiter, but not to subscribe to channels
- Empty `tables` field grants no table access

### Connection Example
```javascript
const io = require('socket.io-client');
const jwt = require('jsonwebtoken');

// Create JWT token
const token = jwt.sign({
  sub: 'user123',
  name: 'John Doe',
  tables: ['users', 'posts']
}, 'your-secret-key');

// Socket connection
const socket = io('http://localhost:3001', {
  auth: {
    token: token
  }
});
```

## 🌐 API Endpoints

### POST /api/events
Event sending endpoint

**Request Body:**
```json
{
    "timestamp":"2024-01-15T10:30:00.000Z",
    "action":"update",
    "table":"pages",
    "record":{
      "id":12,
      "title":"Test"
    }
}
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Response:**
```json
{
    "success": true,
    "message": "Event published successfully",
    "eventsPublished": 6,
    "timestamp": "2025-07-23T09:03:45.261Z"
}
```
```

## 💻 Client Usage

### JavaScript (Browser/Node.js)

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: 'your-jwt-token' }
});

// Subscribe to channel
socket.emit('subscribe', 'db.users.insert');

// Listen to events
socket.on('dbChange', (data) => {
  console.log('Database change:', data);
});

// Check connection status
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});
```

### Python Client

```python
import socketio
import jwt
import json

# Create JWT token
token = jwt.encode({
    'sub': 'user123',
    'name': 'Python Client',
    'tables': ['users', 'orders']
}, 'your-secret-key', algorithm='HS256')

# Socket.io client
sio = socketio.Client()

@sio.event
def connect():
    print('Connected to server')
    # Subscribe to channel
    sio.emit('subscribe', 'db.users')

@sio.event
def dbChange(data):
    print('Database change received:', json.dumps(data, indent=2))

@sio.event
def disconnect():
    print('Disconnected from server')

# Connect
sio.connect('http://localhost:3001', auth={'token': token})
sio.wait()
```

### Channel Listening
```javascript
// Subscribe to channel
socket.emit('subscribe', 'db.users.update', (joinedChannels) => {
  console.log('Subscribed channels:', joinedChannels);
});

// Listen to events
socket.on('db.users.update', (data) => {
  console.log('User updated:', data);
});
```

### Event Sending
```javascript
const changeData = {
  table: 'users',
  action: 'update',
  data: {
    id: 123,
    name: 'John Updated',
    email: 'john.updated@example.com'
  },
  timestamp: new Date().toISOString()
};

// Send via Socket
socket.emit('dbChange', changeData);

// Send via HTTP API
fetch('http://localhost:3001/api/events', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${jwtToken}`
  },
  body: JSON.stringify(changeData)
});
```

## 🔧 Configuration

### Environment Variables

```bash
# .env file
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=*
LOG_LEVEL=info
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

### Server Configuration

```javascript
// src/config/server.js
module.exports = {
  port: process.env.PORT || 3001,
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100
  }
};
```

## 🎨 Web Interface

### Features
- **Emit Panel:** Event sending form
- **Listening Panel:** Channel subscription and live event display
- **JSON Syntax Highlighting:** Colorful and readable JSON format
- **Responsive Design:** Mobile-friendly with Bootstrap 5
- **Real-time Updates:** Instant event streaming

### Supported Tables
- `pages` - Page management
- `categories` - Category system
- `users` - User management
- `products` - Product catalog
- `orders` - Order tracking
- `comments` - Comment system

## 🔧 API Reference

### Socket Events

#### Client → Server
- `subscribe(channel, callback)` - Subscribe to channel
- `dbChange(data)` - Report database change

#### Server → Client
- `db.*` - Hierarchical event channels
- `error` - Error messages

### HTTP Endpoints
- `GET /` - Server status check

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3001
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

### Running with PM2
```bash
npm install -g pm2
pm2 start server.js --name universaldb-socket-server
```

### Docker Support
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3001
CMD ["node", "server.js"]
```

## 📊 Performance and Scaling

### Recommended Configuration
- **Redis Adapter:** For horizontal scaling
- **Load Balancer:** Multiple instance support
- **Connection Pooling:** Database connection optimization
- **Rate Limiting:** DDoS protection

### Monitoring
```javascript
// Connection count tracking
io.engine.clientsCount

// Room information
io.sockets.adapter.rooms
```

## 🛠️ Development

### Debug Mode
```bash
DEBUG=socket.io:* node server.js
```

### Test Commands
```bash
# Unit tests
npm test

# Coverage report
npm run coverage

# Linting
npm run lint
```

## 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - See the [LICENSE](LICENSE) file for details.

## 📚 Developer Documentation

### For Beginners
- **[Quick Start Guide](QUICK_START.md)** - Get the project running in 5 minutes
- **[Developer Guide](DEVELOPER_GUIDE.md)** - Comprehensive developer documentation
- **[API Examples](API_EXAMPLES.md)** - Detailed usage examples and best practices

### Important Files
- `http://localhost:3001/index.html` - Test interface and example usage (public/index.html)
- `http://localhost:3001/monitor.html` - Monitor interface and example usage (public/monitor.html)
- `.env.example` - Environment variables template
- `src/` - Main source code

## 🆘 Support

- **Issues:** Use GitHub Issues page
- **Developer Guide:** [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
- **API Examples:** [API_EXAMPLES.md](API_EXAMPLES.md)
- **Quick Start:** [QUICK_START.md](QUICK_START.md)

---

**Developer:** Şafak Bahçe
**Version:** 1.0.0