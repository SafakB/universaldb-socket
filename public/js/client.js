class SocketClient {
    constructor(serverUrl = 'http://localhost:3000') {
        this.serverUrl = serverUrl;
        this.socket = null;
        this.isConnected = false;
        this.token = null;
        this.subscribedChannels = new Set();
    }

    connect(token) {
        if (this.socket) {
            this.disconnect();
        }

        this.token = token;
        this.socket = io(this.serverUrl, {
            auth: { token }
        });

        this.setupEventHandlers();
        return this;
    }

    setupEventHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.onConnect();
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.onDisconnect();
        });

        this.socket.on('error', (error) => {
            this.onError(error);
        });

        this.socket.on('subscribed', (data) => {
            this.subscribedChannels.add(data.channel);
            this.onSubscribed(data);
        });

        this.socket.on('unsubscribed', (data) => {
            this.subscribedChannels.delete(data.channel);
            this.onUnsubscribed(data);
        });

        this.socket.on('dbChangeAck', (data) => {
            this.onDbChangeAck(data);
        });
    }

    subscribe(channel) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        this.socket.emit('subscribe', { channel });
        return this;
    }

    unsubscribe(channel) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        this.socket.emit('unsubscribe', { channel });
        return this;
    }

    publishDbChange(data) {
        if (!this.isConnected) {
            throw new Error('Not connected to server');
        }

        const eventData = {
            timestamp: new Date().toISOString(),
            ...data
        };

        this.socket.emit('dbChange', eventData);
        return this;
    }

    onChannel(channel, callback) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        this.socket.on(channel, callback);
        return this;
    }

    offChannel(channel, callback) {
        if (!this.socket) {
            throw new Error('Socket not initialized');
        }

        this.socket.off(channel, callback);
        return this;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.subscribedChannels.clear();
        }
        return this;
    }

    // Event handlers (override these in your implementation)
    onConnect() {
        console.log('Connected to server');
    }

    onDisconnect() {
        console.log('Disconnected from server');
    }

    onError(error) {
        console.error('Socket error:', error);
    }

    onSubscribed(data) {
        console.log('Subscribed to channel:', data.channel);
    }

    onUnsubscribed(data) {
        console.log('Unsubscribed from channel:', data.channel);
    }

    onDbChangeAck(data) {
        console.log('DbChange acknowledged:', data);
    }

    // Utility methods
    getSubscribedChannels() {
        return Array.from(this.subscribedChannels);
    }

    isSubscribedTo(channel) {
        return this.subscribedChannels.has(channel);
    }

    getConnectionStatus() {
        return {
            connected: this.isConnected,
            subscribedChannels: this.getSubscribedChannels(),
            serverUrl: this.serverUrl
        };
    }
}

// Make it available globally
window.SocketClient = SocketClient;