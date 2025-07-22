# 📡 API Examples and Usage Scenarios

## 📋 Table of Contents

1. [Basic Connection](#basic-connection)
2. [Channel Subscriptions](#channel-subscriptions)
3. [Event Sending](#event-sending)
4. [Error Management](#error-management)
5. [Advanced Usage](#advanced-usage)
6. [Platform Examples](#platform-examples)
7. [Best Practices](#best-practices)

---

## 🔌 Basic Connection

### Node.js Client
```javascript
const io = require('socket.io-client');

// Basic connection
const socket = io('http://localhost:3000', {
    auth: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
});

// Connection events
socket.on('connect', () => {
    console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Connection lost:', reason);
});

socket.on('connect_error', (error) => {
    console.error('🚫 Connection error:', error.message);
});
```

### Browser Client
```html
<!DOCTYPE html>
<html>
<head>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
    <script>
        const socket = io('http://localhost:3000', {
            auth: {
                token: localStorage.getItem('jwt_token')
            }
        });
        
        socket.on('connect', () => {
            console.log('Connection established');
        });
    </script>
</body>
</html>
```

### Python Client
```python
import socketio
import json

# Create Socket.io client
sio = socketio.Client()

# Connection events
@sio.event
def connect():
    print('Connected to server')
    
@sio.event
def disconnect():
    print('Connection lost')

# Connect with JWT token
sio.connect('http://localhost:3000', 
           auth={'token': 'your-jwt-token'})
```

---

## 📺 Channel Subscriptions

### Simple Channel Listening
```javascript
// Listen to all database changes
socket.emit('subscribe', 'db');
socket.on('db', (data) => {
    console.log('DB change:', data);
});

// Listen to specific table
socket.emit('subscribe', 'db.users');
socket.on('db.users', (data) => {
    console.log('Users table changed:', data);
});

// Listen to specific operation
socket.emit('subscribe', 'db.products.insert');
socket.on('db.products.insert', (data) => {
    console.log('New product added:', data.record);
});
```

### Wildcard Usage
```javascript
// Listen to insert operations on all tables
socket.emit('subscribe', 'db.*.insert');
socket.on('db.*.insert', (data) => {
    console.log(`New record in ${data.table} table:`, data.record);
});

// Listen to all changes for specific record
socket.emit('subscribe', 'db.users.*.123');
socket.on('db.users.*.123', (data) => {
    console.log('User 123 updated:', data);
});
```

### Multiple Channel Subscription
```javascript
const channels = [
    'db.users.insert',
    'db.users.update',
    'db.products.insert',
    'db.orders.insert'
];

channels.forEach(channel => {
    socket.emit('subscribe', channel);
    socket.on(channel, (data) => {
        handleEvent(channel, data);
    });
});

function handleEvent(channel, data) {
    const [, table, action] = channel.split('.');
    console.log(`${table} - ${action}:`, data.record);
}
```

### Dynamic Subscription Management
```javascript
class ChannelManager {
    constructor(socket) {
        this.socket = socket;
        this.subscriptions = new Set();
    }
    
    subscribe(channel, handler) {
        if (!this.subscriptions.has(channel)) {
            this.socket.emit('subscribe', channel);
            this.socket.on(channel, handler);
            this.subscriptions.add(channel);
            console.log(`✅ Subscribed to: ${channel}`);
        }
    }
    
    unsubscribe(channel) {
        if (this.subscriptions.has(channel)) {
            this.socket.emit('unsubscribe', channel);
            this.socket.off(channel);
            this.subscriptions.delete(channel);
            console.log(`❌ Unsubscribed from: ${channel}`);
        }
    }
    
    unsubscribeAll() {
        this.subscriptions.forEach(channel => {
            this.unsubscribe(channel);
        });
    }
}

// Usage
const channelManager = new ChannelManager(socket);
channelManager.subscribe('db.users', (data) => {
    console.log('User event:', data);
});
```

---

## 📤 Event Sending

### Sending Events from External Systems with Admin JWT

#### CodeIgniter Example
```php
<?php
// JWT token creation (admin privileges)
$payload = [
    'sub' => 'codeigniter_system',
    'name' => 'CodeIgniter App',
    'admin' => true,
    'iat' => time(),
    'exp' => time() + 3600 // 1 hour
];

$jwt = JWT::encode($payload, $secret_key, 'HS256');

// Socket.io connection and event sending
$client = new SocketIOClient('http://localhost:3001', [
    'auth' => ['token' => $jwt]
]);

$client->emit('dbChange', [
    'timestamp' => date('c'),
    'table' => 'users',
    'action' => 'insert',
    'record' => ['id' => 123, 'name' => 'John Doe']
]);
?>
```

#### Laravel Example
```php
<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Admin JWT creation
$payload = [
    'sub' => 'laravel_api',
    'name' => 'Laravel Application',
    'admin' => true,
    'iat' => time(),
    'exp' => time() + 3600
];

$jwt = JWT::encode($payload, config('app.jwt_secret'), 'HS256');

// Event sending via HTTP POST
$response = Http::withHeaders([
    'Authorization' => 'Bearer ' . $jwt,
    'Content-Type' => 'application/json'
])->post('http://localhost:3001/api/dbchange', [
    'timestamp' => now()->toISOString(),
    'table' => 'products',
    'action' => 'update',
    'record' => ['id' => 456, 'price' => 99.99]
]);
?>
```

#### Node.js Microservice Example
```javascript
const jwt = require('jsonwebtoken');
const io = require('socket.io-client');

// Admin JWT creation
const adminToken = jwt.sign({
    sub: 'microservice_orders',
    name: 'Orders Microservice',
    admin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
}, process.env.JWT_SECRET);

// Socket connection
const socket = io('http://localhost:3001', {
    auth: { token: adminToken }
});

socket.on('connect', () => {
    console.log('Microservice connected');
    
    // Send DB change event
    socket.emit('dbChange', {
        timestamp: new Date().toISOString(),
        table: 'orders',
        action: 'insert',
        record: {
            id: 789,
            user_id: 123,
            total: 299.99,
            status: 'pending'
        }
    });
});
```

### Simple Event Sending
```javascript
// New user addition event
socket.emit('dbChange', {
    timestamp: new Date().toISOString(),
    table: 'users',
    action: 'insert',
    record: {
        id: 123,
        name: 'John Doe',
        email: 'john@example.com',
        created_at: new Date().toISOString()
    }
});

// User update event
socket.emit('dbChange', {
    timestamp: new Date().toISOString(),
    table: 'users',
    action: 'update',
    record: {
        id: 123,
        name: 'John Smith',
        email: 'john.smith@example.com',
        updated_at: new Date().toISOString()
    }
});

// User deletion event
socket.emit('dbChange', {
    timestamp: new Date().toISOString(),
    table: 'users',
    action: 'delete',
    record: {
        id: 123
    }
});
```

### Event Builder Pattern
```javascript
class EventBuilder {
    constructor() {
        this.event = {
            timestamp: new Date().toISOString()
        };
    }
    
    table(tableName) {
        this.event.table = tableName;
        return this;
    }
    
    action(actionType) {
        this.event.action = actionType;
        return this;
    }
    
    record(recordData) {
        this.event.record = recordData;
        return this;
    }
    
    build() {
        return this.event;
    }
    
    emit(socket) {
        socket.emit('dbChange', this.build());
        return this;
    }
}

// Usage
new EventBuilder()
    .table('products')
    .action('insert')
    .record({
        id: 456,
        name: 'Yeni Ürün',
        price: 99.99,
        category_id: 1
    })
    .emit(socket);
```

### Batch Event Sending
```javascript
class BatchEventSender {
    constructor(socket, batchSize = 10, interval = 1000) {
        this.socket = socket;
        this.batchSize = batchSize;
        this.interval = interval;
        this.queue = [];
        this.timer = null;
    }
    
    addEvent(event) {
        this.queue.push({
            ...event,
            timestamp: new Date().toISOString()
        });
        
        if (this.queue.length >= this.batchSize) {
            this.flush();
        } else if (!this.timer) {
            this.timer = setTimeout(() => this.flush(), this.interval);
        }
    }
    
    flush() {
        if (this.queue.length > 0) {
            this.queue.forEach(event => {
                this.socket.emit('dbChange', event);
            });
            this.queue = [];
        }
        
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
    }
}

// Usage
const batchSender = new BatchEventSender(socket);

// Adding multiple events
for (let i = 0; i < 100; i++) {
    batchSender.addEvent({
        table: 'logs',
        action: 'insert',
        record: { id: i, message: `Log ${i}` }
    });
}
```

---

## ⚠️ Error Management

### Comprehensive Error Handling
```javascript
class SocketErrorHandler {
    constructor(socket) {
        this.socket = socket;
        this.setupErrorHandlers();
    }
    
    setupErrorHandlers() {
        // General error handling
        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.handleError('SOCKET_ERROR', error);
        });
        
        // Connection errors
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.handleError('CONNECTION_ERROR', error);
        });
        
        // Authentication errors
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                console.error('Connection terminated by server');
                this.handleError('SERVER_DISCONNECT', reason);
            }
        });
    }
    
    handleError(type, error) {
        switch (type) {
            case 'SOCKET_ERROR':
                this.retryConnection();
                break;
            case 'CONNECTION_ERROR':
                this.scheduleReconnect();
                break;
            case 'SERVER_DISCONNECT':
                this.handleServerDisconnect();
                break;
            default:
                console.log('Unknown error type:', type);
        }
    }
    
    retryConnection() {
        setTimeout(() => {
            if (!this.socket.connected) {
                console.log('Attempting to reconnect...');
                this.socket.connect();
            }
        }, 5000);
    }
    
    scheduleReconnect() {
        // Reconnection with exponential backoff
        let retryCount = 0;
        const maxRetries = 5;
        
        const reconnect = () => {
            if (retryCount < maxRetries && !this.socket.connected) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`Reconnecting in ${delay}ms (${retryCount + 1}/${maxRetries})`);
                
                setTimeout(() => {
                    this.socket.connect();
                    retryCount++;
                    reconnect();
                }, delay);
            }
        };
        
        reconnect();
    }
    
    handleServerDisconnect() {
        // Token refresh or redirect user to login page
        console.log('Token refresh may be required');
    }
}

// Usage
const errorHandler = new SocketErrorHandler(socket);
```

### Event Validation
```javascript
class EventValidator {
    static validate(event) {
        const errors = [];
        
        // Required fields
        if (!event.timestamp) errors.push('timestamp is required');
        if (!event.table) errors.push('table is required');
        if (!event.action) errors.push('action is required');
        
        // Action validation
        const validActions = ['insert', 'update', 'delete'];
        if (event.action && !validActions.includes(event.action)) {
            errors.push('action must be insert, update or delete');
        }
        
        // Timestamp validation
        if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
            errors.push('timestamp must be a valid ISO 8601 date');
        }
        
        // Record validation
        if (event.record && typeof event.record !== 'object') {
            errors.push('record must be an object');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Usage
function sendEvent(socket, event) {
    const validation = EventValidator.validate(event);
    
    if (!validation.isValid) {
        console.error('Event validation error:', validation.errors);
        return false;
    }
    
    socket.emit('dbChange', event);
    return true;
}
```

---

## 🚀 Advanced Usage

### Connection Pool Management
```javascript
class SocketPool {
    constructor(url, options = {}) {
        this.url = url;
        this.options = options;
        this.pools = new Map();
        this.maxConnections = options.maxConnections || 5;
    }
    
    getConnection(userId) {
        if (!this.pools.has(userId)) {
            if (this.pools.size >= this.maxConnections) {
                // Close oldest connection
                const oldestUser = this.pools.keys().next().value;
                this.closeConnection(oldestUser);
            }
            
            const socket = io(this.url, {
                ...this.options,
                auth: { token: this.getTokenForUser(userId) }
            });
            
            this.pools.set(userId, {
                socket,
                lastUsed: Date.now(),
                subscriptions: new Set()
            });
        }
        
        this.pools.get(userId).lastUsed = Date.now();
        return this.pools.get(userId).socket;
    }
    
    closeConnection(userId) {
        const connection = this.pools.get(userId);
        if (connection) {
            connection.socket.disconnect();
            this.pools.delete(userId);
        }
    }
    
    cleanup() {
        const now = Date.now();
        const timeout = 30 * 60 * 1000; // 30 minutes
        
        for (const [userId, connection] of this.pools) {
            if (now - connection.lastUsed > timeout) {
                this.closeConnection(userId);
            }
        }
    }
    
    getTokenForUser(userId) {
        // Token retrieval logic
        return localStorage.getItem(`token_${userId}`);
    }
}

// Usage
const socketPool = new SocketPool('http://localhost:3000');
const userSocket = socketPool.getConnection('user123');

// Periodic cleanup
setInterval(() => socketPool.cleanup(), 5 * 60 * 1000);
```

### Event Filtering and Transformation
```javascript
class EventProcessor {
    constructor(socket) {
        this.socket = socket;
        this.filters = [];
        this.transformers = [];
    }
    
    addFilter(filterFn) {
        this.filters.push(filterFn);
        return this;
    }
    
    addTransformer(transformFn) {
        this.transformers.push(transformFn);
        return this;
    }
    
    subscribe(channel, handler) {
        this.socket.emit('subscribe', channel);
        this.socket.on(channel, (data) => {
            // Filtering
            const shouldProcess = this.filters.every(filter => filter(data));
            if (!shouldProcess) return;
            
            // Transformation
            let processedData = data;
            this.transformers.forEach(transformer => {
                processedData = transformer(processedData);
            });
            
            handler(processedData);
        });
    }
}

// Usage
const processor = new EventProcessor(socket);

// Filter events for specific users only
processor.addFilter(data => {
    return data.record && data.record.user_id === currentUserId;
});

// Convert timestamp to local time
processor.addTransformer(data => {
    return {
        ...data,
        localTimestamp: new Date(data.timestamp).toLocaleString()
    };
});

processor.subscribe('db.orders', (data) => {
    console.log('Filtered and transformed order:', data);
});
```

### Metrics and Monitoring
```javascript
class SocketMetrics {
    constructor(socket) {
        this.socket = socket;
        this.metrics = {
            eventsReceived: 0,
            eventsSent: 0,
            errors: 0,
            connectionTime: null,
            lastActivity: null
        };
        
        this.setupMetrics();
    }
    
    setupMetrics() {
        // Record connection time
        this.socket.on('connect', () => {
            this.metrics.connectionTime = Date.now();
            this.metrics.lastActivity = Date.now();
        });
        
        // Count incoming events
        const originalOn = this.socket.on.bind(this.socket);
        this.socket.on = (event, handler) => {
            return originalOn(event, (...args) => {
                if (event.startsWith('db.')) {
                    this.metrics.eventsReceived++;
                    this.metrics.lastActivity = Date.now();
                }
                return handler(...args);
            });
        };
        
        // Count outgoing events
        const originalEmit = this.socket.emit.bind(this.socket);
        this.socket.emit = (event, ...args) => {
            if (event === 'dbChange') {
                this.metrics.eventsSent++;
                this.metrics.lastActivity = Date.now();
            }
            return originalEmit(event, ...args);
        };
        
        // Count errors
        this.socket.on('error', () => {
            this.metrics.errors++;
        });
    }
    
    getMetrics() {
        return {
            ...this.metrics,
            uptime: this.metrics.connectionTime ? 
                Date.now() - this.metrics.connectionTime : 0,
            isActive: this.metrics.lastActivity ? 
                Date.now() - this.metrics.lastActivity < 60000 : false
        };
    }
    
    reset() {
        this.metrics = {
            eventsReceived: 0,
            eventsSent: 0,
            errors: 0,
            connectionTime: Date.now(),
            lastActivity: Date.now()
        };
    }
}

// Usage
const metrics = new SocketMetrics(socket);

// Periodic reporting
setInterval(() => {
    console.log('Socket Metrics:', metrics.getMetrics());
}, 30000);
```

---

## 🌐 Platform Examples

### React Hook
```jsx
import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';

export function useSocket(url, token) {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        if (!token) return;
        
        const newSocket = io(url, {
            auth: { token }
        });
        
        newSocket.on('connect', () => {
            setConnected(true);
            setError(null);
        });
        
        newSocket.on('disconnect', () => {
            setConnected(false);
        });
        
        newSocket.on('error', (err) => {
            setError(err.message);
        });
        
        setSocket(newSocket);
        
        return () => {
            newSocket.disconnect();
        };
    }, [url, token]);
    
    const subscribe = useCallback((channel, handler) => {
        if (socket && connected) {
            socket.emit('subscribe', channel);
            socket.on(channel, handler);
        }
    }, [socket, connected]);
    
    const emit = useCallback((event, data) => {
        if (socket && connected) {
            socket.emit(event, data);
        }
    }, [socket, connected]);
    
    return { socket, connected, error, subscribe, emit };
}

// Usage
function UserComponent() {
    const { subscribe, emit, connected } = useSocket(
        'http://localhost:3000',
        localStorage.getItem('jwt')
    );
    
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        if (connected) {
            subscribe('db.users', (data) => {
                if (data.action === 'insert') {
                    setUsers(prev => [...prev, data.record]);
                }
            });
        }
    }, [connected, subscribe]);
    
    const addUser = () => {
        emit('dbChange', {
            timestamp: new Date().toISOString(),
            table: 'users',
            action: 'insert',
            record: { name: 'New User' }
        });
    };
    
    return (
        <div>
            <button onClick={addUser} disabled={!connected}>
                Add User
            </button>
            {users.map(user => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
```

### Vue.js Composable
```javascript
// composables/useSocket.js
import { ref, onMounted, onUnmounted } from 'vue';
import io from 'socket.io-client';

export function useSocket(url, token) {
    const socket = ref(null);
    const connected = ref(false);
    const error = ref(null);
    
    onMounted(() => {
        if (!token) return;
        
        socket.value = io(url, {
            auth: { token }
        });
        
        socket.value.on('connect', () => {
            connected.value = true;
            error.value = null;
        });
        
        socket.value.on('disconnect', () => {
            connected.value = false;
        });
        
        socket.value.on('error', (err) => {
            error.value = err.message;
        });
    });
    
    onUnmounted(() => {
        if (socket.value) {
            socket.value.disconnect();
        }
    });
    
    const subscribe = (channel, handler) => {
        if (socket.value && connected.value) {
            socket.value.emit('subscribe', channel);
            socket.value.on(channel, handler);
        }
    };
    
    const emit = (event, data) => {
        if (socket.value && connected.value) {
            socket.value.emit(event, data);
        }
    };
    
    return {
        socket,
        connected,
        error,
        subscribe,
        emit
    };
}
```

### Angular Service
```typescript
// socket.service.ts
import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import io, { Socket } from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private connected$ = new BehaviorSubject<boolean>(false);
  
  constructor() {}
  
  connect(url: string, token: string): void {
    this.socket = io(url, {
      auth: { token }
    });
    
    this.socket.on('connect', () => {
      this.connected$.next(true);
    });
    
    this.socket.on('disconnect', () => {
      this.connected$.next(false);
    });
  }
  
  subscribe(channel: string): Observable<any> {
    return new Observable(observer => {
      this.socket.emit('subscribe', channel);
      this.socket.on(channel, (data: any) => {
        observer.next(data);
      });
      
      return () => {
        this.socket.off(channel);
      };
    });
  }
  
  emit(event: string, data: any): void {
    if (this.socket && this.connected$.value) {
      this.socket.emit(event, data);
    }
  }
  
  get isConnected(): Observable<boolean> {
    return this.connected$.asObservable();
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

---

## ✅ Best Practices

### 1. Connection Management
```javascript
// ✅ Good
class ConnectionManager {
    constructor(url, token) {
        this.url = url;
        this.token = token;
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect() {
        if (this.socket?.connected) return;
        
        this.socket = io(this.url, {
            auth: { token: this.token },
            timeout: 20000,
            forceNew: true
        });
        
        this.setupEventHandlers();
    }
    
    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.reconnectAttempts = 0;
            console.log('Connection established');
        });
        
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                // Server disconnected, reconnect
                this.reconnect();
            }
        });
    }
    
    reconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, Math.pow(2, this.reconnectAttempts) * 1000);
        }
    }
}

// ❌ Bad
const socket = io('http://localhost:3000'); // No token, no error handling
```

### 2. Event Handling
```javascript
// ✅ Good
class EventHandler {
    constructor(socket) {
        this.socket = socket;
        this.handlers = new Map();
    }
    
    on(channel, handler) {
        // Duplicate handler check
        if (this.handlers.has(channel)) {
            this.socket.off(channel, this.handlers.get(channel));
        }
        
        this.handlers.set(channel, handler);
        this.socket.on(channel, handler);
    }
    
    off(channel) {
        if (this.handlers.has(channel)) {
            this.socket.off(channel, this.handlers.get(channel));
            this.handlers.delete(channel);
        }
    }
    
    cleanup() {
        this.handlers.forEach((handler, channel) => {
            this.socket.off(channel, handler);
        });
        this.handlers.clear();
    }
}

// ❌ Bad
socket.on('db.users', handler1);
socket.on('db.users', handler2); // Duplicate handler
// No cleanup
```

### 3. Error Handling
```javascript
// ✅ Good
function safeEmit(socket, event, data) {
    try {
        if (!socket.connected) {
            throw new Error('Socket not connected');
        }
        
        const validation = validateEventData(data);
        if (!validation.isValid) {
            throw new Error(`Validation error: ${validation.errors.join(', ')}`);
        }
        
        socket.emit(event, data);
        return { success: true };
    } catch (error) {
        console.error('Event sending error:', error);
        return { success: false, error: error.message };
    }
}

// ❌ Bad
socket.emit('dbChange', data); // No error checking
```

### 4. Memory Management
```javascript
// ✅ Good
class SocketManager {
    constructor() {
        this.sockets = new Map();
        this.cleanup = this.cleanup.bind(this);
        
        // Cleanup when page closes
        window.addEventListener('beforeunload', this.cleanup);
    }
    
    addSocket(id, socket) {
        // Clean up old socket
        if (this.sockets.has(id)) {
            this.removeSocket(id);
        }
        
        this.sockets.set(id, socket);
    }
    
    removeSocket(id) {
        const socket = this.sockets.get(id);
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
            this.sockets.delete(id);
        }
    }
    
    cleanup() {
        this.sockets.forEach((socket, id) => {
            this.removeSocket(id);
        });
    }
}

// ❌ Bad
const sockets = []; // Memory leak risk
sockets.push(io('http://localhost:3000'));
// No cleanup
```

### 5. Performance Optimization
```javascript
// ✅ Good - Throttling
function createThrottledEmitter(socket, delay = 100) {
    let lastEmit = 0;
    let pending = null;
    
    return function(event, data) {
        const now = Date.now();
        
        if (now - lastEmit >= delay) {
            socket.emit(event, data);
            lastEmit = now;
        } else {
            if (pending) clearTimeout(pending);
            pending = setTimeout(() => {
                socket.emit(event, data);
                lastEmit = Date.now();
                pending = null;
            }, delay - (now - lastEmit));
        }
    };
}

// ❌ Bad - Too frequent emit
setInterval(() => {
    socket.emit('dbChange', data); // Every 10ms
}, 10);
```

---

**This API reference comprehensively demonstrates all features of the project. You can adapt these examples to your own needs in your real projects.**