const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://mysql-socket',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// JWT doğrulama için gerekli paket
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'NTNv7j0TuYARvmNMmWXo6fKvM4o6nv/aUi9ryX38ZH+L1bkrnD1ObOQ8JAUmHCBq7Iy7otZcyAagBLHVKvvYaIpmMuxmARQ97jUVG16Jkpkp1wXOPsrF9zwew6TpczyHkHgX5EuLg2MeBuiT/qJACs1J0apruOOJCg/gOtkjB4c='; // Burayı kendi secret key'iniz ile değiştirin

// Socket.io bağlantı öncesi JWT doğrulama
io.use((socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Token gerekli'));
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        socket.user = decoded;
        socket.tables = decoded.tables ? decoded.tables.split(',') : [];
        next();
    } catch (err) {
        next(new Error('Geçersiz token'));
    }
});

app.get('/', (req, res) => {
    res.send('Socket.io server çalışıyor!');
});

io.on('connection', (socket) => {
    console.log('Bir kullanıcı bağlandı:', socket.id);
    socket.on('disconnect', () => {
        console.log('Kullanıcı ayrıldı:', socket.id);
    });

    // Dinleme yapan istemci, kanal adını bildirerek odaya katılır
    socket.on('subscribe', (channel, ackCallback) => {
        const joined = [];

        if (channel === 'db') {
            socket.tables.forEach(tbl => {
                const room = `db.${tbl}`;
                socket.join(room);
                joined.push(room);
            });
            ackCallback?.(joined);
            return;
        }

        const wildcardMatch = channel.match(/^db\.\*\.(\w+)$/);
        if (wildcardMatch) {
            const action = wildcardMatch[1];
            socket.tables.forEach(tbl => {
                const room = `db.${tbl}.${action}`;
                socket.join(room);
                joined.push(room);
            });
            ackCallback?.(joined);
            return;
        }

        const match = channel.match(/^db\.([^.]+)/);
        const requestedTable = match ? match[1] : null;
        if (requestedTable && socket.tables.includes(requestedTable)) {
            socket.join(channel);
            joined.push(channel);
            ackCallback?.(joined);
        } else {
            socket.emit('error', 'Bu tabloyu dinleme yetkiniz yok.');
            ackCallback?.([]);
        }
    });

    // dbChange eventini dinle ve publish et
    socket.on('dbChange', (data) => {
        const { timestamp, table, action, record } = data;
        console.log(`dbChange event alındı: [${timestamp}] tablo=${table}, action=${action}`, record);

        // Hiyerarşik event publish (sadece ilgili odaya)
        io.to('db').emit('db', data);
        io.to(`db.${table}`).emit(`db.${table}`, data);
        io.to(`db.${table}.${action}`).emit(`db.${table}.${action}`, data);
        if (record && record.id !== undefined) {
            io.to(`db.${table}.${action}.${record.id}`).emit(`db.${table}.${action}.${record.id}`, data);
            io.to(`db.${table}.*.${record.id}`).emit(`db.${table}.*.${record.id}`, data);
        }
        io.to(`db.*.${action}`).emit(`db.*.${action}`, data);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor.`);
});
