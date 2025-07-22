# 📡 API Örnekleri ve Kullanım Senaryoları

## 📋 İçindekiler

1. [Temel Bağlantı](#temel-bağlantı)
2. [Kanal Abonelikleri](#kanal-abonelikleri)
3. [Event Gönderme](#event-gönderme)
4. [Hata Yönetimi](#hata-yönetimi)
5. [İleri Seviye Kullanım](#ileri-seviye-kullanım)
6. [Platform Örnekleri](#platform-örnekleri)
7. [Best Practices](#best-practices)

---

## 🔌 Temel Bağlantı

### Node.js İstemci
```javascript
const io = require('socket.io-client');

// Temel bağlantı
const socket = io('http://localhost:3000', {
    auth: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    forceNew: true
});

// Bağlantı event'leri
socket.on('connect', () => {
    console.log('✅ Sunucuya bağlandı:', socket.id);
});

socket.on('disconnect', (reason) => {
    console.log('❌ Bağlantı kesildi:', reason);
});

socket.on('connect_error', (error) => {
    console.error('🚫 Bağlantı hatası:', error.message);
});
```

### Browser İstemci
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
            console.log('Bağlantı kuruldu');
        });
    </script>
</body>
</html>
```

### Python İstemci
```python
import socketio
import json

# Socket.io client oluştur
sio = socketio.Client()

# Bağlantı event'leri
@sio.event
def connect():
    print('Sunucuya bağlandı')
    
@sio.event
def disconnect():
    print('Bağlantı kesildi')

# JWT token ile bağlan
sio.connect('http://localhost:3000', 
           auth={'token': 'your-jwt-token'})
```

---

## 📺 Kanal Abonelikleri

### Basit Kanal Dinleme
```javascript
// Tüm veritabanı değişikliklerini dinle
socket.emit('subscribe', 'db');
socket.on('db', (data) => {
    console.log('DB değişikliği:', data);
});

// Belirli tablo dinleme
socket.emit('subscribe', 'db.users');
socket.on('db.users', (data) => {
    console.log('Users tablosu değişti:', data);
});

// Belirli işlem dinleme
socket.emit('subscribe', 'db.products.insert');
socket.on('db.products.insert', (data) => {
    console.log('Yeni ürün eklendi:', data.record);
});
```

### Wildcard Kullanımı
```javascript
// Tüm tablolarda insert işlemlerini dinle
socket.emit('subscribe', 'db.*.insert');
socket.on('db.*.insert', (data) => {
    console.log(`${data.table} tablosuna yeni kayıt:`, data.record);
});

// Belirli kaydın tüm değişikliklerini dinle
socket.emit('subscribe', 'db.users.*.123');
socket.on('db.users.*.123', (data) => {
    console.log('Kullanıcı 123 güncellendi:', data);
});
```

### Çoklu Kanal Aboneliği
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

### Dinamik Abonelik Yönetimi
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
            console.log(`✅ Abone olundu: ${channel}`);
        }
    }
    
    unsubscribe(channel) {
        if (this.subscriptions.has(channel)) {
            this.socket.emit('unsubscribe', channel);
            this.socket.off(channel);
            this.subscriptions.delete(channel);
            console.log(`❌ Abonelik iptal edildi: ${channel}`);
        }
    }
    
    unsubscribeAll() {
        this.subscriptions.forEach(channel => {
            this.unsubscribe(channel);
        });
    }
}

// Kullanım
const channelManager = new ChannelManager(socket);
channelManager.subscribe('db.users', (data) => {
    console.log('User event:', data);
});
```

---

## 📤 Event Gönderme

### Harici Sistemlerden Admin JWT ile Event Gönderme

#### CodeIgniter Örneği
```php
<?php
// JWT token oluşturma (admin yetkili)
$payload = [
    'sub' => 'codeigniter_system',
    'name' => 'CodeIgniter App',
    'admin' => true,
    'iat' => time(),
    'exp' => time() + 3600 // 1 saat
];

$jwt = JWT::encode($payload, $secret_key, 'HS256');

// Socket.io bağlantısı ve event gönderme
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

#### Laravel Örneği
```php
<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Admin JWT oluşturma
$payload = [
    'sub' => 'laravel_api',
    'name' => 'Laravel Application',
    'admin' => true,
    'iat' => time(),
    'exp' => time() + 3600
];

$jwt = JWT::encode($payload, config('app.jwt_secret'), 'HS256');

// HTTP POST ile event gönderme
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

#### Node.js Mikroservis Örneği
```javascript
const jwt = require('jsonwebtoken');
const io = require('socket.io-client');

// Admin JWT oluşturma
const adminToken = jwt.sign({
    sub: 'microservice_orders',
    name: 'Orders Microservice',
    admin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
}, process.env.JWT_SECRET);

// Socket bağlantısı
const socket = io('http://localhost:3001', {
    auth: { token: adminToken }
});

socket.on('connect', () => {
    console.log('Mikroservis bağlandı');
    
    // DB değişiklik eventi gönder
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

### Basit Event Gönderme
```javascript
// Yeni kullanıcı ekleme eventi
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

// Kullanıcı güncelleme eventi
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

// Kullanıcı silme eventi
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

// Kullanım
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

### Batch Event Gönderme
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

// Kullanım
const batchSender = new BatchEventSender(socket);

// Çoklu event ekleme
for (let i = 0; i < 100; i++) {
    batchSender.addEvent({
        table: 'logs',
        action: 'insert',
        record: { id: i, message: `Log ${i}` }
    });
}
```

---

## ⚠️ Hata Yönetimi

### Kapsamlı Hata Yakalama
```javascript
class SocketErrorHandler {
    constructor(socket) {
        this.socket = socket;
        this.setupErrorHandlers();
    }
    
    setupErrorHandlers() {
        // Genel hata yakalama
        this.socket.on('error', (error) => {
            console.error('Socket hatası:', error);
            this.handleError('SOCKET_ERROR', error);
        });
        
        // Bağlantı hataları
        this.socket.on('connect_error', (error) => {
            console.error('Bağlantı hatası:', error);
            this.handleError('CONNECTION_ERROR', error);
        });
        
        // Kimlik doğrulama hataları
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                console.error('Sunucu tarafından bağlantı kesildi');
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
                console.log('Bilinmeyen hata türü:', type);
        }
    }
    
    retryConnection() {
        setTimeout(() => {
            if (!this.socket.connected) {
                console.log('Yeniden bağlanmaya çalışılıyor...');
                this.socket.connect();
            }
        }, 5000);
    }
    
    scheduleReconnect() {
        // Exponential backoff ile yeniden bağlanma
        let retryCount = 0;
        const maxRetries = 5;
        
        const reconnect = () => {
            if (retryCount < maxRetries && !this.socket.connected) {
                const delay = Math.pow(2, retryCount) * 1000;
                console.log(`${delay}ms sonra yeniden bağlanılacak (${retryCount + 1}/${maxRetries})`);
                
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
        // Token yenileme veya kullanıcıyı login sayfasına yönlendirme
        console.log('Token yenilenmesi gerekebilir');
    }
}

// Kullanım
const errorHandler = new SocketErrorHandler(socket);
```

### Event Validation
```javascript
class EventValidator {
    static validate(event) {
        const errors = [];
        
        // Zorunlu alanlar
        if (!event.timestamp) errors.push('timestamp gerekli');
        if (!event.table) errors.push('table gerekli');
        if (!event.action) errors.push('action gerekli');
        
        // Action validation
        const validActions = ['insert', 'update', 'delete'];
        if (event.action && !validActions.includes(event.action)) {
            errors.push('action insert, update veya delete olmalı');
        }
        
        // Timestamp validation
        if (event.timestamp && isNaN(Date.parse(event.timestamp))) {
            errors.push('timestamp geçerli bir ISO 8601 tarihi olmalı');
        }
        
        // Record validation
        if (event.record && typeof event.record !== 'object') {
            errors.push('record bir object olmalı');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// Kullanım
function sendEvent(socket, event) {
    const validation = EventValidator.validate(event);
    
    if (!validation.isValid) {
        console.error('Event validation hatası:', validation.errors);
        return false;
    }
    
    socket.emit('dbChange', event);
    return true;
}
```

---

## 🚀 İleri Seviye Kullanım

### Connection Pool Yönetimi
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
                // En eski bağlantıyı kapat
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
        const timeout = 30 * 60 * 1000; // 30 dakika
        
        for (const [userId, connection] of this.pools) {
            if (now - connection.lastUsed > timeout) {
                this.closeConnection(userId);
            }
        }
    }
    
    getTokenForUser(userId) {
        // Token alma mantığı
        return localStorage.getItem(`token_${userId}`);
    }
}

// Kullanım
const socketPool = new SocketPool('http://localhost:3000');
const userSocket = socketPool.getConnection('user123');

// Periyodik temizlik
setInterval(() => socketPool.cleanup(), 5 * 60 * 1000);
```

### Event Filtering ve Transformation
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
            // Filtreleme
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

// Kullanım
const processor = new EventProcessor(socket);

// Sadece belirli kullanıcıların eventlerini filtrele
processor.addFilter(data => {
    return data.record && data.record.user_id === currentUserId;
});

// Timestamp'i yerel zamana çevir
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

### Metrics ve Monitoring
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
        // Bağlantı zamanını kaydet
        this.socket.on('connect', () => {
            this.metrics.connectionTime = Date.now();
            this.metrics.lastActivity = Date.now();
        });
        
        // Gelen eventleri say
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
        
        // Giden eventleri say
        const originalEmit = this.socket.emit.bind(this.socket);
        this.socket.emit = (event, ...args) => {
            if (event === 'dbChange') {
                this.metrics.eventsSent++;
                this.metrics.lastActivity = Date.now();
            }
            return originalEmit(event, ...args);
        };
        
        // Hataları say
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

// Kullanım
const metrics = new SocketMetrics(socket);

// Periyodik rapor
setInterval(() => {
    console.log('Socket Metrics:', metrics.getMetrics());
}, 30000);
```

---

## 🌐 Platform Örnekleri

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

// Kullanım
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

### 1. Bağlantı Yönetimi
```javascript
// ✅ İyi
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
            console.log('Bağlantı kuruldu');
        });
        
        this.socket.on('disconnect', (reason) => {
            if (reason === 'io server disconnect') {
                // Sunucu bağlantıyı kesti, yeniden bağlanma
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

// ❌ Kötü
const socket = io('http://localhost:3000'); // Token yok, hata yönetimi yok
```

### 2. Event Handling
```javascript
// ✅ İyi
class EventHandler {
    constructor(socket) {
        this.socket = socket;
        this.handlers = new Map();
    }
    
    on(channel, handler) {
        // Duplicate handler kontrolü
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

// ❌ Kötü
socket.on('db.users', handler1);
socket.on('db.users', handler2); // Duplicate handler
// Cleanup yok
```

### 3. Error Handling
```javascript
// ✅ İyi
function safeEmit(socket, event, data) {
    try {
        if (!socket.connected) {
            throw new Error('Socket bağlı değil');
        }
        
        const validation = validateEventData(data);
        if (!validation.isValid) {
            throw new Error(`Validation hatası: ${validation.errors.join(', ')}`);
        }
        
        socket.emit(event, data);
        return { success: true };
    } catch (error) {
        console.error('Event gönderme hatası:', error);
        return { success: false, error: error.message };
    }
}

// ❌ Kötü
socket.emit('dbChange', data); // Hata kontrolü yok
```

### 4. Memory Management
```javascript
// ✅ İyi
class SocketManager {
    constructor() {
        this.sockets = new Map();
        this.cleanup = this.cleanup.bind(this);
        
        // Sayfa kapatılırken temizlik
        window.addEventListener('beforeunload', this.cleanup);
    }
    
    addSocket(id, socket) {
        // Eski socket'i temizle
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

// ❌ Kötü
const sockets = []; // Memory leak riski
sockets.push(io('http://localhost:3000'));
// Temizlik yok
```

### 5. Performance Optimization
```javascript
// ✅ İyi - Throttling
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

// ❌ Kötü - Çok sık emit
setInterval(() => {
    socket.emit('dbChange', data); // Her 10ms'de bir
}, 10);
```

---

**Bu API referansı projenin tüm özelliklerini kapsamlı olarak göstermektedir. Gerçek projelerinizde bu örnekleri temel alarak kendi ihtiyaçlarınıza göre uyarlayabilirsiniz.**