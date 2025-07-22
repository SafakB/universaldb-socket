# MySQL Socket Event Server - Geliştirici Rehberi

## 📋 İçindekiler

1. [Proje Genel Bakış](#proje-genel-bakış)
2. [Mimari ve Tasarım](#mimari-ve-tasarım)
3. [Kurulum ve Yapılandırma](#kurulum-ve-yapılandırma)
4. [Proje Yapısı](#proje-yapısı)
5. [Temel Bileşenler](#temel-bileşenler)
6. [API Referansı](#api-referansı)
7. [Güvenlik](#güvenlik)
8. [Geliştirme Süreci](#geliştirme-süreci)
9. [Test ve Debug](#test-ve-debug)
10. [Deployment](#deployment)
11. [Sorun Giderme](#sorun-giderme)

---

## 🎯 Proje Genel Bakış

### Ne Yapar?
MySQL Socket Event Server, veritabanı değişikliklerini (insert, update, delete) gerçek zamanlı olarak WebSocket bağlantıları üzerinden istemcilere ileten bir Node.js uygulamasıdır.

### Temel Özellikler
- **Real-time Event Broadcasting**: Veritabanı değişiklikleri anında iletilir
- **JWT Authentication**: Token tabanlı güvenli kimlik doğrulama
- **Hierarchical Channel System**: Esnek kanal yapısı ile hedefli dinleme
- **Table-based Authorization**: Kullanıcılar sadece yetkili oldukları tabloları dinleyebilir
- **Rate Limiting**: DDoS koruması ve kaynak yönetimi
- **Modern Web UI**: Test ve geliştirme için hazır arayüz

### Teknoloji Stack
- **Backend**: Node.js, Express.js
- **WebSocket**: Socket.io
- **Authentication**: JSON Web Tokens (JWT)
- **Frontend**: Vanilla JavaScript, Bootstrap 5

---

## 🏗️ Mimari ve Tasarım

### Sistem Mimarisi

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

### Kanal Hiyerarşisi

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

### Veri Akışı

1. **Event Generation**: Uygulama veritabanı değişikliği tespit eder
2. **Event Publishing**: `dbChange` eventi Socket.io'ya gönderilir
3. **Channel Resolution**: Event, hiyerarşik kanallara dağıtılır
4. **Authorization Check**: Kullanıcı yetkileri kontrol edilir
5. **Event Delivery**: Yetkili istemcilere event iletilir

---

## ⚙️ Kurulum ve Yapılandırma

### Sistem Gereksinimleri
- Node.js v16+ (önerilen v18+)
- npm v8+ veya yarn v1.22+
- 512MB+ RAM
- 100MB+ disk alanı

### Adım Adım Kurulum

#### 1. Projeyi İndirin
```bash
git clone <repository-url>
cd mysql-socket
```

#### 2. Bağımlılıkları Yükleyin
```bash
npm install
# veya
yarn install
```

#### 3. Ortam Değişkenlerini Yapılandırın
```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# JWT Configuration (ÖNEMLİ: Production'da değiştirin!)
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### 4. Sunucuyu Başlatın
```bash
# Geliştirme modu (auto-reload)
npm run dev

# Production modu
npm start
```

#### 5. Test Edin
- Tarayıcıda `http://localhost:3000` adresini açın
- `emit.html` dosyasını kullanarak test edin

---

## 📁 Proje Yapısı

```
mysql-socket/
├── src/                          # Ana kaynak kodları
│   ├── app.js                    # Ana uygulama sınıfı
│   ├── config/                   # Yapılandırma dosyaları
│   │   ├── server.js             # Sunucu ayarları
│   │   └── jwt.js                # JWT yapılandırması
│   ├── controllers/              # İş mantığı kontrolcüleri
│   │   ├── socketController.js   # Socket.io event handlers
│   │   └── apiController.js      # REST API handlers
│   ├── middleware/               # Ara katman yazılımları
│   │   ├── auth.js               # Kimlik doğrulama
│   │   ├── rateLimiter.js        # Hız sınırlama
│   │   └── errorHandler.js       # Hata yönetimi
│   ├── services/                 # İş mantığı servisleri
│   │   ├── eventService.js       # Event yayınlama
│   │   └── socketService.js      # Socket yönetimi
│   ├── utils/                    # Yardımcı araçlar
│   │   ├── logger.js             # Loglama
│   │   └── validator.js          # Veri doğrulama
│   └── routes/                   # API rotaları
│       └── api.js                # REST endpoints
├── public/                       # Statik dosyalar
│   ├── index.html                # Ana sayfa
│   ├── css/
│   └── js/
├── server.js                     # Uygulama giriş noktası
├── package.json                  # Proje meta verileri
├── .env.example                  # Ortam değişkenleri şablonu
├── emit.html                     # Test arayüzü
└── README.md                     # Proje dokümantasyonu
```

---

## 🔧 Temel Bileşenler

### 1. Application Class (`src/app.js`)
Ana uygulama sınıfı. Express.js ve Socket.io'yu yapılandırır.

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

**Sorumlulukları:**
- Express.js middleware kurulumu
- Socket.io yapılandırması
- Route tanımlamaları
- Hata yönetimi
- Graceful shutdown

### 2. Socket Controller (`src/controllers/socketController.js`)
Socket.io event'lerini yönetir.

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

**Sorumlulukları:**
- `dbChange` event'lerini işleme
- Rate limiting kontrolü
- Event validation
- Response gönderimi

### 3. Event Service (`src/services/eventService.js`)
Event yayınlama mantığını yönetir.

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

**Sorumlulukları:**
- Hiyerarşik kanal oluşturma
- Event dağıtımı
- Validation

### 4. Socket Service (`src/services/socketService.js`)
Socket bağlantı yönetimi ve kanal abonelikleri.

```javascript
class SocketService {
    static handleSubscribe(socket, data) {
        const authorizedChannels = this.getAuthorizedChannels(socket, channel);
        authorizedChannels.forEach(ch => socket.join(ch));
    }
}
```

**Sorumlulukları:**
- Socket bağlantı yönetimi
- Kanal abonelik işlemleri
- Yetkilendirme kontrolü
- Wildcard pattern çözümleme

### 5. Auth Middleware (`src/middleware/auth.js`)
JWT tabanlı kimlik doğrulama.

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

**Sorumlulukları:**
- JWT token doğrulama
- Kullanıcı bilgilerini socket'e ekleme
- Tablo yetkileri çıkarma

---

## 📡 API Referansı

### Socket.io Events

#### İstemci → Sunucu

##### `dbChange`
Veritabanı değişikliği bildirimi.

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

**Parametreler:**
- `timestamp` (string): ISO 8601 format
- `table` (string): Tablo adı
- `action` (string): 'insert', 'update', 'delete'
- `record` (object): Kayıt verisi

##### `subscribe`
Kanala abone olma.

```javascript
socket.emit('subscribe', 'db.users.update', (authorizedChannels) => {
    console.log('Abone olunan kanallar:', authorizedChannels);
});
```

**Parametreler:**
- `channel` (string): Kanal adı
- `callback` (function): Başarı callback'i

##### `unsubscribe`
Kanal aboneliğini iptal etme.

```javascript
socket.emit('unsubscribe', 'db.users.update');
```

#### Sunucu → İstemci

##### `db.*` (Hiyerarşik Events)
Veritabanı değişiklik bildirimleri.

```javascript
socket.on('db.users.update', (data) => {
    console.log('User güncellendi:', data);
});
```

##### `subscribed`
Abone olma başarı bildirimi.

```javascript
socket.on('subscribed', (data) => {
    console.log('Abone olundu:', data.authorizedChannels);
});
```

##### `error`
Hata bildirimi.

```javascript
socket.on('error', (error) => {
    console.error('Socket hatası:', error.message);
});
```

### Kanal Formatları

| Format | Açıklama | Örnek |
|--------|----------|-------|
| `db` | Tüm değişiklikler | Tüm eventler |
| `db.[table]` | Tablo bazlı | `db.users` |
| `db.[table].[action]` | Tablo + işlem | `db.users.insert` |
| `db.[table].[action].[id]` | Spesifik kayıt | `db.users.update.123` |
| `db.[table].*.[id]` | Kayıt bazlı (tüm işlemler) | `db.users.*.123` |
| `db.*.[action]` | İşlem bazlı (tüm tablolar) | `db.*.delete` |

---

## 🔐 Güvenlik

### JWT Token Yapısı

#### 1. Kullanıcı JWT Token'ı (Socket Bağlantıları)

```json
{
  "sub": "user_id",           // Kullanıcı ID'si
  "name": "User Name",        // Kullanıcı adı
  "tables": "table1,table2",  // Erişilebilir tablolar (virgülle ayrılmış)
  "iat": 1640995200,           // Token oluşturulma zamanı
  "exp": 1640998800            // Token son kullanma zamanı
}
```

**Alanların Açıklamaları:**
- `sub`: Kullanıcının benzersiz kimliği
- `name`: Kullanıcının görünen adı
- `tables`: Kullanıcının erişebileceği tablo listesi
- `iat`: Token'ın oluşturulma zamanı (Unix timestamp)
- `exp`: Token'ın geçerlilik süresi (Unix timestamp)

#### 2. Admin JWT Token'ı (Harici Sistemler)

Harici sistemlerden DB değişiklik istekleri için:

```json
{
  "sub": "admin_id",          // Admin sistem ID'si
  "name": "Admin Name",       // Admin sistem adı
  "admin": true,              // Admin yetkisi
  "iat": 1753215601,          // Token oluşturulma zamanı
  "exp": 1753219201           // Token son kullanma zamanı
}
```

**Kullanım Senaryoları:**
- CodeIgniter uygulamasından DB değişiklik bildirimi
- Laravel API'sinden real-time güncelleme
- Node.js mikroservislerinden event gönderimi
- Diğer backend sistemlerden veri senkronizasyonu

### Güvenlik Önlemleri

#### 1. JWT Secret Güvenliği
```bash
# Production'da mutlaka değiştirin!
export JWT_SECRET="$(openssl rand -base64 32)"
```

#### 2. CORS Yapılandırması
```javascript
// config/server.js
socketio: {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
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

## 🛠️ Geliştirme Süreci

### Geliştirme Ortamı Kurulumu

#### 1. Gerekli Araçlar
```bash
# Node.js version manager
nvm install 18
nvm use 18

# Global tools
npm install -g nodemon eslint prettier
```

#### 2. IDE Yapılandırması
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

### Kod Standartları

#### 1. ESLint Yapılandırması
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

#### 2. Prettier Yapılandırması
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

### Yeni Özellik Ekleme

#### 1. Event Handler Ekleme
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

#### 2. Middleware Ekleme
```javascript
// src/middleware/newMiddleware.js
class NewMiddleware {
    static process(req, res, next) {
        // Implementation
        next();
    }
}
```

#### 3. Service Ekleme
```javascript
// src/services/newService.js
class NewService {
    static processData(data) {
        // Implementation
    }
}
```

---

## 🧪 Test ve Debug

### Test Stratejisi

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
        const socket = io('http://localhost:3000', {
            auth: { token: validToken }
        });
        socket.on('connect', done);
    });
});
```

### Debug Teknikleri

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
# Tüm Socket.io debug bilgileri
DEBUG=socket.io:* node server.js

# Sadece server debug
DEBUG=socket.io:server node server.js
```

#### 3. Chrome DevTools
```javascript
// Browser console'da
socket.on('connect', () => console.log('Connected'));
socket.on('disconnect', () => console.log('Disconnected'));
socket.onAny((event, ...args) => console.log(event, args));
```

### Test Araçları

#### 1. Emit.html Kullanımı
- `http://localhost:3000/emit.html` adresini açın
- JWT token'ı güncelleyin
- Event gönderme ve dinleme testleri yapın

#### 2. Postman/Insomnia
```javascript
// WebSocket connection test
const socket = new WebSocket('ws://localhost:3000/socket.io/?EIO=4&transport=websocket');
```

#### 3. Node.js Test Script
```javascript
// test-client.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
    auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
    console.log('Connected');
    socket.emit('subscribe', 'db.users');
});
```

---

## 🚀 Deployment

### Production Hazırlığı

#### 1. Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secure-production-secret
CORS_ORIGIN=https://yourdomain.com
LOG_LEVEL=warn
```

#### 2. PM2 Yapılandırması
```javascript
// ecosystem.config.js
module.exports = {
    apps: [{
        name: 'mysql-socket-server',
        script: 'server.js',
        instances: 'max',
        exec_mode: 'cluster',
        env: {
            NODE_ENV: 'development'
        },
        env_production: {
            NODE_ENV: 'production',
            PORT: 3000
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

EXPOSE 3000

USER node

CMD ["node", "server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql-socket:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    restart: unless-stopped
```

### Monitoring ve Logging

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

## 🔍 Sorun Giderme

### Yaygın Sorunlar ve Çözümleri

#### 1. Bağlantı Sorunları

**Sorun**: Socket bağlantısı kurulamıyor
```
Error: xhr poll error
```

**Çözüm**:
```javascript
// CORS ayarlarını kontrol edin
// config/server.js
socketio: {
    cors: {
        origin: "*", // Geliştirme için
        methods: ["GET", "POST"]
    }
}
```

#### 2. Authentication Sorunları

**Sorun**: JWT token geçersiz
```
Error: Invalid authentication token
```

**Çözüm**:
```javascript
// Token'ı kontrol edin
const jwt = require('jsonwebtoken');
const decoded = jwt.verify(token, process.env.JWT_SECRET);
console.log(decoded);
```

#### 3. Event Delivery Sorunları

**Sorun**: Event'ler iletilmiyor

**Debug Adımları**:
```javascript
// 1. Socket room'larını kontrol edin
console.log(io.sockets.adapter.rooms);

// 2. User yetkileri kontrol edin
console.log(socket.tables);

// 3. Channel authorization kontrol edin
const authorized = SocketService.isAuthorizedForChannel(socket, channel);
console.log('Authorized:', authorized);
```

#### 4. Performance Sorunları

**Sorun**: Yavaş response süreleri

**Optimizasyon**:
```javascript
// 1. Rate limiting ayarlarını kontrol edin
// 2. Event payload boyutunu küçültün
// 3. Gereksiz channel subscription'ları temizleyin
// 4. Memory leak kontrolü yapın
```

### Debug Komutları

```bash
# Detaylı logging
DEBUG=* npm run dev

# Socket.io specific
DEBUG=socket.io:* npm run dev

# Memory usage monitoring
node --inspect server.js

# Performance profiling
node --prof server.js
```

### Log Analizi

```bash
# Error log'larını filtrele
grep "ERROR" logs/app.log

# Connection log'larını say
grep "Socket connected" logs/app.log | wc -l

# Rate limit ihlallerini bul
grep "Rate limit exceeded" logs/app.log
```

---

## 📚 Ek Kaynaklar

### Dokümantasyon
- [Socket.io Documentation](https://socket.io/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

### Geliştirme Araçları
- [Postman](https://www.postman.com/) - API testing
- [Socket.io Client Tool](https://amritb.github.io/socketio-client-tool/) - WebSocket testing
- [JWT Debugger](https://jwt.io/#debugger-io) - Token debugging

### Monitoring Tools
- [PM2 Monitoring](https://pm2.keymetrics.io/)
- [New Relic](https://newrelic.com/)
- [DataDog](https://www.datadoghq.com/)

---

**Son Güncelleme**: 2024-01-15  
**Versiyon**: 1.0.0  
**Geliştirici**: Şafak Bahçe

> Bu döküman projeye yeni başlayan geliştiriciler için hazırlanmıştır. Sorularınız için GitHub Issues sayfasını kullanabilirsiniz.