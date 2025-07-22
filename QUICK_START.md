# 🚀 Hızlı Başlangıç Rehberi

## 5 Dakikada Çalıştır

### 1. Kurulum (2 dakika)
```bash
# Bağımlılıkları yükle
npm install

# Ortam değişkenlerini kopyala
cp .env.example .env

# Sunucuyu başlat
npm run dev
```

### 2. Test Et (3 dakika)
```bash
# Tarayıcıda aç
http://localhost:3000/emit.html
```

**Test Senaryosu:**
1. Sol panelde "users" tablosunu seç
2. "update" işlemini seç
3. "Emit Gönder" butonuna tıkla
4. Sağ panelde "db.users" kanalını dinle
5. Event'in geldiğini gör

---

## 💡 Temel Kullanım Örnekleri

### Örnek 1: Basit Event Dinleme
```javascript
const io = require('socket.io-client');

// Bağlan
const socket = io('http://localhost:3000', {
    auth: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    }
});

// Users tablosundaki tüm değişiklikleri dinle
socket.emit('subscribe', 'db.users');
socket.on('db.users', (data) => {
    console.log('User değişikliği:', data);
});
```

### Örnek 2: Spesifik İşlem Dinleme
```javascript
// Sadece yeni kullanıcı eklemelerini dinle
socket.emit('subscribe', 'db.users.insert');
socket.on('db.users.insert', (data) => {
    console.log('Yeni kullanıcı eklendi:', data.record);
});
```

### Örnek 3: Belirli Kayıt Dinleme
```javascript
// ID'si 123 olan kullanıcının tüm değişikliklerini dinle
socket.emit('subscribe', 'db.users.*.123');
socket.on('db.users.*.123', (data) => {
    console.log('Kullanıcı 123 güncellendi:', data);
});
```

### Örnek 4: Event Gönderme
```javascript
// Veritabanı değişikliği bildir
socket.emit('dbChange', {
    timestamp: new Date().toISOString(),
    table: 'products',
    action: 'insert',
    record: {
        id: 456,
        name: 'Yeni Ürün',
        price: 99.99
    }
});
```

---

## 🎯 Gerçek Dünya Senaryoları

### Senaryo 1: E-ticaret Stok Takibi
```javascript
// Ürün stok değişikliklerini dinle
socket.emit('subscribe', 'db.products.update');
socket.on('db.products.update', (data) => {
    if (data.record.stock < 10) {
        alert(`Düşük stok: ${data.record.name} - ${data.record.stock} adet`);
    }
});
```

### Senaryo 2: Canlı Sipariş Takibi
```javascript
// Yeni siparişleri dinle
socket.emit('subscribe', 'db.orders.insert');
socket.on('db.orders.insert', (data) => {
    updateOrderDashboard(data.record);
    playNotificationSound();
});
```

### Senaryo 3: Kullanıcı Aktivite Monitörü
```javascript
// Tüm kullanıcı aktivitelerini dinle
socket.emit('subscribe', 'db.users');
socket.on('db.users', (data) => {
    logUserActivity({
        action: data.action,
        userId: data.record.id,
        timestamp: data.timestamp
    });
});
```

---

## 🔧 Hızlı Yapılandırma

### 3. JWT Token Oluşturma

#### Kullanıcı Token'ı (Socket Bağlantıları İçin)
```javascript
const jwt = require('jsonwebtoken');

const userToken = jwt.sign({
    sub: 'user_id',
    name: 'User Name',
    tables: 'users,products,orders',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 saat
}, 'your-secret-key');
```

#### Admin Token'ı (Harici Sistemler İçin)
```javascript
const jwt = require('jsonwebtoken');

// Harici sistemlerden DB değişiklik istekleri için
const adminToken = jwt.sign({
    sub: 'external_system_id',
    name: 'External System Name',
    admin: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 saat
}, 'your-secret-key');

// Kullanım örneği
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
    auth: { token: adminToken }
});

socket.on('connect', () => {
    // DB değişiklik eventi gönder
    socket.emit('dbChange', {
        timestamp: new Date().toISOString(),
        table: 'users',
        action: 'insert',
        record: { id: 123, name: 'John Doe' }
    });
});
```

### Hızlı Test Scripti
```javascript
// test.js
const io = require('socket.io-client');

const socket = io('http://localhost:3000', {
    auth: { token: 'your-token-here' }
});

socket.on('connect', () => {
    console.log('✅ Bağlantı başarılı');
    
    // Test event gönder
    socket.emit('dbChange', {
        timestamp: new Date().toISOString(),
        table: 'test',
        action: 'insert',
        record: { id: 1, message: 'Hello World' }
    });
});

socket.on('error', (error) => {
    console.error('❌ Hata:', error);
});
```

---

## 🐛 Hızlı Sorun Giderme

### Bağlantı Sorunu
```bash
# CORS hatası alıyorsanız
# .env dosyasında:
CORS_ORIGIN=*
```

### Token Sorunu
```javascript
// Token'ı test edin
const jwt = require('jsonwebtoken');
try {
    const decoded = jwt.verify('your-token', 'your-secret');
    console.log('Token geçerli:', decoded);
} catch (error) {
    console.error('Token geçersiz:', error.message);
}
```

### Event Gelmiyorsa
```javascript
// Debug modunda çalıştırın
DEBUG=socket.io:* npm run dev

// Kanal aboneliğini kontrol edin
socket.emit('subscribe', 'db.users', (response) => {
    console.log('Abone olunan kanallar:', response);
});
```

---

## 📱 Frontend Entegrasyonu

### React Örneği
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function UserList() {
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        const socket = io('http://localhost:3000', {
            auth: { token: localStorage.getItem('jwt') }
        });
        
        socket.emit('subscribe', 'db.users');
        socket.on('db.users', (data) => {
            if (data.action === 'insert') {
                setUsers(prev => [...prev, data.record]);
            }
        });
        
        return () => socket.disconnect();
    }, []);
    
    return (
        <div>
            {users.map(user => (
                <div key={user.id}>{user.name}</div>
            ))}
        </div>
    );
}
```

### Vue.js Örneği
```vue
<template>
  <div>
    <div v-for="notification in notifications" :key="notification.id">
      {{ notification.message }}
    </div>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      notifications: [],
      socket: null
    };
  },
  mounted() {
    this.socket = io('http://localhost:3000', {
      auth: { token: this.$store.state.jwt }
    });
    
    this.socket.emit('subscribe', 'db.notifications');
    this.socket.on('db.notifications.insert', (data) => {
      this.notifications.push(data.record);
    });
  },
  beforeDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
};
</script>
```

---

## 🎨 UI Örnekleri

### Basit Dashboard
```html
<!DOCTYPE html>
<html>
<head>
    <title>Real-time Dashboard</title>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
    <div id="stats">
        <div>Toplam Kullanıcı: <span id="userCount">0</span></div>
        <div>Aktif Siparişler: <span id="orderCount">0</span></div>
    </div>
    
    <div id="activity">
        <h3>Canlı Aktivite</h3>
        <ul id="activityList"></ul>
    </div>
    
    <script>
        const socket = io('http://localhost:3000', {
            auth: { token: 'your-jwt-token' }
        });
        
        // Kullanıcı değişikliklerini dinle
        socket.emit('subscribe', 'db.users');
        socket.on('db.users', (data) => {
            updateUserCount();
            addActivity(`Kullanıcı ${data.action}: ${data.record.name}`);
        });
        
        // Sipariş değişikliklerini dinle
        socket.emit('subscribe', 'db.orders');
        socket.on('db.orders', (data) => {
            updateOrderCount();
            addActivity(`Sipariş ${data.action}: #${data.record.id}`);
        });
        
        function addActivity(message) {
            const li = document.createElement('li');
            li.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
            document.getElementById('activityList').prepend(li);
        }
    </script>
</body>
</html>
```

---

## 🔗 Yararlı Linkler

- **Test Arayüzü**: http://localhost:3000/emit.html
- **Health Check**: http://localhost:3000/api/health
- **Socket.io Admin UI**: https://admin.socket.io/
- **JWT Debugger**: https://jwt.io/#debugger-io

---

## 📞 Destek

Sorularınız için:
1. `DEVELOPER_GUIDE.md` dosyasını inceleyin
2. GitHub Issues sayfasını kullanın
3. Debug modunda (`DEBUG=* npm run dev`) çalıştırın

**Hızlı başlangıç tamamlandı! 🎉**