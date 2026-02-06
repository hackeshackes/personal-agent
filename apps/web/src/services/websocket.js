// WebSocket Service for Gateway Communication
const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 18789;

class WebSocketService {
  constructor() {
    this.ws = null;
    this.host = DEFAULT_HOST;
    this.port = DEFAULT_PORT;
    this.connected = false;
    this.reconnecting = false;
    this.messageHandlers = new Set();
    this.connectionHandlers = new Set();
    this.messages = [];
    
    // Reconnection settings
    this.maxReconnectAttempts = 5;
    this.reconnectAttempts = 0;
    this.reconnectDelay = 1000;
  }

  get url() {
    return `ws://${this.host}:${this.port}/ws`;
  }

  setGateway(host, port) {
    this.host = host;
    this.port = port;
    if (this.connected) {
      this.disconnect();
      this.connect();
    }
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected:', this.url);
          this.connected = true;
          this.reconnectAttempts = 0;
          this.reconnecting = false;
          this.notifyConnectionChange(true);
          this.send({ type: 'ping' });
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = () => {
          console.log('WebSocket disconnected');
          this.connected = false;
          this.notifyConnectionChange(false);
          this.attemptReconnect();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

        // Wait for connection or timeout
        setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(new Error('Connection timeout'));
          } else if (this.ws?.readyState === WebSocket.OPEN) {
            resolve();
          }
        }, 5000);

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  attemptReconnect() {
    if (this.reconnecting || this.reconnectAttempts >= this.maxReconnectAttempts) {
      return;
    }

    this.reconnecting = true;
    this.reconnectAttempts++;

    console.log(`Attempting reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    setTimeout(() => {
      this.connect().catch(() => {});
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  send(data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
      console.log('📤 Sent:', data.type);
    } else {
      console.warn('Cannot send: WebSocket not connected');
    }
  }

  handleMessage(data) {
    try {
      let message;
      if (data instanceof ArrayBuffer) {
        message = JSON.parse(new TextDecoder().decode(data));
      } else {
        message = JSON.parse(data);
      }

      this.messages.push(message);
      
      // Notify all handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (e) {
          console.error('Message handler error:', e);
        }
      });

      console.log('📨 Received:', message.type);
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  }

  onMessage(handler) {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  onConnectionChange(handler) {
    this.connectionHandlers.add(handler);
    return () => this.connectionHandlers.delete(handler);
  }

  notifyConnectionChange(connected) {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(connected);
      } catch (e) {
        console.error('Connection handler error:', e);
      }
    });
  }

  // Gateway API methods
  pair(code, nodeInfo) {
    this.send({
      type: 'pair',
      code,
      nodeInfo
    });
  }

  sendChat(content, options = {}) {
    this.send({
      type: 'chat.send',
      content,
      ...options
    });
  }

  getHistory(sessionId = null, limit = 50) {
    this.send({
      type: 'chat.history',
      sessionId,
      limit
    });
  }

  subscribe(channels = []) {
    this.send({
      type: 'chat.subscribe',
      channels
    });
  }

  invokeNode(nodeId, method, params = {}) {
    this.send({
      type: 'node.invoke',
      nodeId,
      method,
      params
    });
  }

  getStatus() {
    return {
      connected: this.connected,
      host: this.host,
      port: this.port,
      url: this.url,
      messageCount: this.messages.length
    };
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;
