# MySQL Socket Event Server

MySQL veritabanı değişikliklerini gerçek zamanlı olarak istemcilere ileten, **Express.js** ve **Socket.io** tabanlı event server'ı. JWT authentication ve hiyerarşik kanal yapısı ile güvenli ve ölçeklenebilir real-time veri iletimi sağlar.

## 🚀 Özellikler

- **🔐 JWT Authentication:** Token tabanlı güvenli bağlantı ve yetkilendirme
- **📡 Gerçek Zamanlı Event Publishing:** Veritabanı değişiklikleri (insert, update, delete) anında iletilir
- **🏗️ Hiyerarşik Kanal Yapısı:** Tablolar, işlemler ve kayıt ID'lerine göre esnek dinleme
- **🏠 Room (Oda) Mantığı:** İstemciler sadece abone oldukları kanaldaki eventleri alır
- **🎨 Modern Web UI:** Bootstrap 5 ile responsive tasarım ve JSON syntax highlighting
- **🛡️ CORS Desteği:** Güvenli ve özelleştirilebilir cross-origin bağlantılar
- **📊 Tablo Bazlı Yetkilendirme:** Kullanıcılar sadece yetkili oldukları tabloları dinleyebilir

## 📋 Gereksinimler

- Node.js (v16+ önerilir)
- npm veya yarn

## ⚡ Hızlı Başlangıç

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd mysql-socket
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Yapılandırın
```bash
cp .env.example .env
# .env dosyasını kendi yapılandırmanızla düzenleyin
```

### 4. Sunucuyu Başlatın
```bash
# Geliştirme modu (otomatik yeniden başlatma)
npm run dev

# Üretim modu
npm start
```

### 5. Web Arayüzünü Açın
`emit.html` dosyasını tarayıcınızda açın veya: http://localhost:3000/emit.html


## 📁 Proje Yapısı

```
mysql-socket/
├── src/
│   ├── app.js                    # Ana uygulama sınıfı
│   ├── config/
│   │   ├── server.js             # Sunucu yapılandırması
│   │   └── jwt.js                # JWT yapılandırması
│   ├── controllers/
│   │   ├── socketController.js   # Socket.io kontrolcüsü
│   │   └── apiController.js      # REST API kontrolcüsü
│   ├── middleware/
│   │   ├── auth.js               # Kimlik doğrulama middleware
│   │   ├── rateLimiter.js        # Hız sınırlama middleware
│   │   └── errorHandler.js       # Hata yönetimi middleware
│   ├── services/
│   │   ├── eventService.js       # Event yayınlama servisi
│   │   └── socketService.js      # Socket yönetim servisi
│   ├── utils/
│   │   ├── logger.js             # Loglama yardımcısı
│   │   └── validator.js          # Veri doğrulama yardımcısı
│   └── routes/
│       └── api.js                # API rotaları
├── public/
│   ├── index.html                # Ana web arayüzü
│   ├── css/
│   │   └── style.css             # CSS stilleri
│   └── js/
│       └── client.js             # İstemci JavaScript kütüphanesi
├── server.js                     # Ana giriş noktası
├── package.json                  # Proje bağımlılıkları
├── .env.example                  # Ortam değişkenleri örneği
├── .gitignore                    # Git ignore dosyası
└── README.md                     # Bu dosya
```


## 🔧 Kurulum ve Yapılandırma

### Bağımlılıklar
```json
{
  "dependencies": {
    "express": "^5.1.0",
    "jsonwebtoken": "^9.0.2",
    "socket.io": "^4.8.1"
  }
}
```

### JWT Yapılandırması
Production ortamında `JWT_SECRET` değerini environment variable olarak ayarlayın:
```bash
export JWT_SECRET="your-super-secret-key"
```

## 📡 Kanal Yapısı ve Event Sistemi

### Hiyerarşik Kanal Adları

| Kanal Formatı | Açıklama | Örnek |
|---------------|----------|-------|
| `db` | Tüm veritabanı değişiklikleri | Tüm eventler |
| `db.[table]` | Belirli bir tablo | `db.users` |
| `db.[table].[action]` | Tablo + işlem türü | `db.users.insert` |
| `db.[table].[action].[id]` | Tablo + işlem + kayıt ID | `db.users.update.123` |
| `db.[table].*.[id]` | Tablo + kayıt ID (tüm işlemler) | `db.users.*.123` |
| `db.*.[action]` | Tüm tablolar + belirli işlem | `db.*.delete` |

### Wildcard Desteği
```javascript
// Tüm tablolarda insert işlemlerini dinle
socket.emit('subscribe', 'db.*.insert');

// Users tablosundaki tüm işlemleri dinle
socket.emit('subscribe', 'db.users');

// Belirli bir kaydın tüm değişikliklerini dinle
socket.emit('subscribe', 'db.products.*.456');
```

## 📨 Event Formatı

### dbChange Event Yapısı
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

### Desteklenen İşlem Türleri
- `insert` - Yeni kayıt ekleme
- `update` - Mevcut kayıt güncelleme
- `delete` - Kayıt silme

## 🔐 Güvenlik ve Authentication

### JWT Token Yapısı
```json
{
  "sub": "user_id",
  "name": "User Name",
  "tables": "users,products,orders",
  "iat": 1642248000,
  "exp": 1642251600
}
```

### Bağlantı Örneği
```javascript
const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token-here'
  }
});
```

## 💻 İstemci Kullanımı

### Kanal Dinleme
```javascript
// Kanala abone ol
socket.emit('subscribe', 'db.users.update', (joinedChannels) => {
  console.log('Abone olunan kanallar:', joinedChannels);
});

// Event dinle
socket.on('db.users.update', (data) => {
  console.log('User güncellendi:', data);
});
```

### Event Gönderme
```javascript
const changeData = {
  timestamp: new Date().toISOString(),
  table: 'users',
  action: 'insert',
  record: {
    id: 456,
    name: 'Jane Smith',
    email: 'jane@example.com'
  }
};

socket.emit('dbChange', changeData);
```

## 🎨 Web Arayüzü

### Özellikler
- **Emit Paneli:** Event gönderme formu
- **Dinleme Paneli:** Kanal aboneliği ve canlı event görüntüleme
- **JSON Syntax Highlighting:** Renkli ve okunabilir JSON formatı
- **Responsive Tasarım:** Bootstrap 5 ile mobil uyumlu
- **Real-time Updates:** Anlık event akışı

### Desteklenen Tablolar
- `pages` - Sayfa yönetimi
- `categories` - Kategori sistemi
- `users` - Kullanıcı yönetimi
- `products` - Ürün kataloğu
- `orders` - Sipariş takibi
- `comments` - Yorum sistemi

## 🔧 API Referansı

### Socket Events

#### İstemci → Sunucu
- `subscribe(channel, callback)` - Kanala abone ol
- `dbChange(data)` - Veritabanı değişikliği bildir

#### Sunucu → İstemci
- `db.*` - Hiyerarşik event kanalları
- `error` - Hata mesajları

### HTTP Endpoints
- `GET /` - Sunucu durumu kontrolü

## 🚀 Production Deployment

### Environment Variables
```bash
PORT=3000
JWT_SECRET=your-production-secret-key
NODE_ENV=production
```

### PM2 ile Çalıştırma
```bash
npm install -g pm2
pm2 start server.js --name mysql-socket-server
```

### Docker Desteği
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## 📊 Performans ve Ölçekleme

### Önerilen Yapılandırma
- **Redis Adapter:** Horizontal scaling için
- **Load Balancer:** Multiple instance desteği
- **Connection Pooling:** Veritabanı bağlantı optimizasyonu
- **Rate Limiting:** DDoS koruması

### Monitoring
```javascript
// Bağlantı sayısı takibi
io.engine.clientsCount

// Room bilgileri
io.sockets.adapter.rooms
```

## 🛠️ Geliştirme

### Debug Modu
```bash
DEBUG=socket.io:* node server.js
```

### Test Komutları
```bash
# Unit testler
npm test

# Coverage raporu
npm run coverage

# Linting
npm run lint
```

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🆘 Destek

- **Issues:** GitHub Issues sayfasını kullanın
- **Dokümantasyon:** [Wiki sayfası](wiki-link)
- **Örnekler:** `examples/` klasörüne bakın

---

**Geliştirici:** Şafak Bahçe
**Versiyon:** 0.0.1