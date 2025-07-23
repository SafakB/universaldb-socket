# 🚀 Quick Start Guide

## Run in 5 Minutes

### 1. Installation (2 minutes)
```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start server
npm run dev
```

### 2. Test (3 minutes)
```bash
# Open in browser
http://localhost:3001/index.html
```

**Test Scenario:**
1. Select "users" table in left panel
2. Select "update" operation
3. Click "Send Emit" button
4. Listen to "db.users" channel in right panel
5. See the event arrive

### 2. Monitoring
```bash
# Open in browser
http://localhost:3001/monitor.html
```
**Feature:**
1. See all connected sockets
2. See all connected room via socket users
3. See all rooms (need fix)
4. See all emits (coming soon)

---

## 💡 Basic Usage Examples

### Example 1: Simple Event Listening
```javascript
const io = require('socket.io-client');

// Connect
const socket = io('http://localhost:3001', {
    auth: {
        token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
    }
});

// Listen to all changes in users table
socket.emit('subscribe', 'db.users');
socket.on('db.users', (data) => {
    console.log('User change:', data);
});
```

### Example 2: Listening to Specific Operations
```javascript
// Listen only to new user insertions
socket.emit('subscribe', 'db.users.insert');
socket.on('db.users.insert', (data) => {
    console.log('New user added:', data.record);
});
```

### Example 3: Listening to Specific Records
```javascript
// Listen to all changes for user with ID 123
socket.emit('subscribe', 'db.users.*.123');
socket.on('db.users.*.123', (data) => {
    console.log('User 123 updated:', data);
});
```

### Example 4: Sending Events (need admin or publisher required access)
```javascript
// Notify database change
socket.emit('dbChange', {
    timestamp: new Date().toISOString(),
    table: 'products',
    action: 'insert',
    record: {
        id: 456,
        name: 'New Product',
        price: 99.99
    }
});
```


### Example 5: Sending Events with API (need admin or publisher required access)
```javascript
// Notify database change
fetch('http://localhost:3001/api/events', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
        timestamp: new Date().toISOString(),
        table: 'products',
        action: 'insert',
        record: {
            id: 456,
            name: 'New Product',
            price: 99.99
        }
    })
});
```


---

## 🎯 Real-World Scenarios

### Scenario 1: E-commerce Stock Tracking
```javascript
// Listen to product stock changes
socket.emit('subscribe', 'db.products.update');
socket.on('db.products.update', (data) => {
    if (data.record.stock < 10) {
        alert(`Low stock: ${data.record.name} - ${data.record.stock} units`);
    }
});
```

### Scenario 2: Live Order Tracking
```javascript
// Listen to new orders
socket.emit('subscribe', 'db.orders.insert');
socket.on('db.orders.insert', (data) => {
    updateOrderDashboard(data.record);
    playNotificationSound();
});
```

### Scenario 3: User Activity Monitor
```javascript
// Listen to all user activities
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

## 🔧 Quick Configuration

### 3. JWT Token Creation

#### User Token (For Socket Connections)
```javascript
const jwt = require('jsonwebtoken');

const userToken = jwt.sign({
    sub: 'user_id',
    name: 'User Name',
    tables: 'users,products,orders',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
}, 'your-secret-key');
```

#### Admin or Publisher Token (For External Systems)
```javascript
const jwt = require('jsonwebtoken');

// For DB change requests from external systems
const authorizedToken = jwt.sign({
    sub: 'external_system_id',
    name: 'External System Name',
    admin: true,
    publisher: false,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
}, 'your-secret-key');

// Usage example
const io = require('socket.io-client');
const socket = io('http://localhost:3001', {
    auth: { token: authorizedToken }
});

socket.on('connect', () => {
    // Send DB change event
    socket.emit('dbChange', {
        timestamp: new Date().toISOString(),
        table: 'users',
        action: 'insert',
        record: { id: 123, name: 'John Doe' }
    });
});
```

### Quick Test Script
```javascript
// test.js
const io = require('socket.io-client');

const socket = io('http://localhost:3001', {
    auth: { token: 'your-token-here' }
});

socket.on('connect', () => {
    console.log('✅ Connection successful');
    
    // Send test event
    socket.emit('dbChange', {
        timestamp: new Date().toISOString(),
        table: 'test',
        action: 'insert',
        record: { id: 1, message: 'Hello World' }
    });
});

socket.on('error', (error) => {
    console.error('❌ Error:', error);
});
```

---

## 🐛 Quick Troubleshooting

### Connection Issues
```bash
# If you get CORS error
# In .env file:
CORS_ORIGIN=*
```

### Token Issues
```javascript
// Test your token
const jwt = require('jsonwebtoken');
try {
    const decoded = jwt.verify('your-token', 'your-secret');
    console.log('Token valid:', decoded);
} catch (error) {
    console.error('Token invalid:', error.message);
}
```

### Events Not Coming
```javascript
// Run in debug mode
DEBUG=socket.io:* npm run dev

// Check channel subscription
socket.emit('subscribe', 'db.users', (response) => {
    console.log('Subscribed channels:', response);
});
```

---

## 📱 Frontend Integration

### React Example
```jsx
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

function UserList() {
    const [users, setUsers] = useState([]);
    
    useEffect(() => {
        const socket = io('http://localhost:3001', {
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

### Vue.js Example
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
    this.socket = io('http://localhost:3001', {
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

## 🎨 UI Examples

### Simple Dashboard
```html
<!DOCTYPE html>
<html>
<head>
    <title>Real-time Dashboard</title>
    <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
</head>
<body>
    <div id="stats">
        <div>Total Users: <span id="userCount">0</span></div>
        <div>Active Orders: <span id="orderCount">0</span></div>
    </div>
    
    <div id="activity">
        <h3>Live Activity</h3>
        <ul id="activityList"></ul>
    </div>
    
    <script>
        const socket = io('http://localhost:3001', {
            auth: { token: 'your-jwt-token' }
        });
        
        // Listen to user changes
        socket.emit('subscribe', 'db.users');
        socket.on('db.users', (data) => {
            updateUserCount();
            addActivity(`User ${data.action}: ${data.record.name}`);
        });
        
        // Listen to order changes
        socket.emit('subscribe', 'db.orders');
        socket.on('db.orders', (data) => {
            updateOrderCount();
            addActivity(`Order ${data.action}: #${data.record.id}`);
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

## 🔗 Useful Links

- **Test Interface**: http://localhost:3001/index.html
- **Monitoring Interface**: http://localhost:3001/monitor.html
- **Health Check**: http://localhost:3001/api/health
- **Socket.io Admin UI**: https://admin.socket.io/
- **JWT Debugger**: https://jwt.io/#debugger-io

---

## 🎯 Next Steps

### 1. Advanced Configuration
- [Developer Guide](DEVELOPER_GUIDE.md) - Detailed technical documentation
- [API Examples](API_EXAMPLES.md) - Code examples for different platforms

### 2. Production Environment
- Environment variables configuration
- SSL/TLS certificate setup
- Load balancer configuration
- Monitoring and logging setup

### 3. Integration
- Automatic event sending with MySQL triggers
- Microservice architecture integration
- CI/CD pipeline setup

### 4. Performance Optimization
- Horizontal scaling with Redis adapter
- Connection pooling optimization
- Rate limiting fine-tuning

---

## 🆘 Help and Support

### Having Issues?

1. **Check Documentation**
   - [README.md](README.md) - General information
   - [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) - Technical details
   - [API_EXAMPLES.md](API_EXAMPLES.md) - Code examples

2. **Common Issues**
   - JWT token errors
   - CORS issues
   - Rate limiting issues
   - Connection problems

3. **Debug Mode**
   ```bash
   DEBUG=socket.io* npm run dev
   ```

4. **Log Check**
   ```bash
   tail -f logs/app.log
   ```

### Contact
- **GitHub Issues**: Bug reports and feature requests
- **Email**: For technical support
- **Documentation**: For updated documentation

---

**🎉 Congratulations! Your MySQL Socket.io Event Server is now running!**