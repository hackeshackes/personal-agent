/**
 * Personal AI Agent Gateway - WebSocket Control Plane
 * 
 * 基于 OpenClaw 架构设计，支持:
 * - WebSocket 实时通信
 * - CLI 命令行交互
 * - 节点管理 (Nodes)
 * - 会话管理 (Sessions)
 * - 任务调度 (Cron)
 */

const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const { Command } = require('commander');
const inquirer = require('inquirer');

// 导入模块
const { SessionManager } = require('./services/session');
const { NodeManager } = require('./services/node');
const { CronManager } = require('./services/cron');
const { ToolRegistry } = require('./services/tool');
const { MessageHandler } = require('./handlers/message');
const { ChatHandler } = require('./handlers/chat');
const { NodeHandler } = require('./handlers/node');

class Gateway {
  constructor(config = {}) {
    this.port = config.port || 18789;
    this.host = config.host || '0.0.0.0';
    this.wss = null;
    this.server = null;
    
    // 核心管理器
    this.sessions = new SessionManager();
    this.nodes = new NodeManager();
    this.crons = new CronManager();
    this.tools = new ToolRegistry();
    
    // 处理器
    this.messageHandler = new MessageHandler(this);
    this.chatHandler = new ChatHandler(this);
    this.nodeHandler = new NodeHandler(this);
    
    // 连接状态
    this.clients = new Map(); // ws -> { id, type, nodeId, ... }
    this.pairingCode = null;
    this.pairingExpiry = null;
    
    // 统计数据
    this.stats = {
      startTime: Date.now(),
      messages: 0,
      connections: 0
    };
  }

  /**
   * 启动 Gateway 服务器
   */
  async start() {
    return new Promise((resolve, reject) => {
      // 创建 HTTP 服务器
      this.server = http.createServer((req, res) => {
        this.handleHttpRequest(req, res);
      });

      // 创建 WebSocket 服务器
      this.wss = new WebSocket.Server({ server: this.server });

      // WebSocket 连接处理
      this.wss.on('connection', (ws, req) => {
        this.handleConnection(ws, req);
      });

      // 错误处理
      this.wss.on('error', (error) => {
        console.error('WebSocket Server Error:', error);
        reject(error);
      });

      // 启动监听
      this.server.listen(this.port, this.host, () => {
        console.log(`🚀 Personal AI Agent Gateway Started`);
        console.log(`   WebSocket: ws://${this.host}:${this.port}`);
        console.log(`   HTTP API:  http://${this.host}:${this.port}/api`);
        console.log(`   Dashboard: http://${this.host}:${this.port}/dashboard`);
        
        // 生成配对码
        this.generatePairingCode();
        
        // 加载已注册的节点
        this.nodes.load();
        
        // 启动统计报告
        this.startStatsReporter();
        
        resolve(this);
      });
    });
  }

  /**
   * 生成配对码
   */
  generatePairingCode() {
    this.pairingCode = uuidv4().split('-')[0].toUpperCase();
    this.pairingExpiry = Date.now() + 10 * 60 * 1000; // 10分钟过期
    
    console.log(`\n📱 配对信息 (10分钟内有效)`);
    console.log(`   配对码: ${this.pairingCode}`);
    console.log(`   二维码: http://${this.host}:${this.port}/qrcode`);
    console.log(`\n🖥️  命令: openclaw nodes approve ${this.pairingCode}`);
  }

  /**
   * 获取配对码
   */
  getPairingCode() {
    if (Date.now() > this.pairingExpiry) {
      this.generatePairingCode();
    }
    return {
      code: this.pairingCode,
      expiresAt: new Date(this.pairingExpiry).toISOString()
    };
  }

  /**
   * 处理 HTTP 请求
   */
  handleHttpRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const pathname = url.pathname;

    // CORS 头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // API 路由
    if (pathname === '/api/status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getStatus()));
      return;
    }
    
    if (pathname === '/api/pairing') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.getPairingCode()));
      return;
    }
    
    if (pathname === '/api/sessions') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.sessions.list()));
      return;
    }
    
    if (pathname === '/api/nodes') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(this.nodes.list()));
      return;
    }
    
    if (pathname === '/qrcode' || pathname === '/api/qrcode') {
      this.generateQRCode().then(dataUrl => {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(dataUrl, 'base64');
      }).catch(() => {
        res.writeHead(500);
        res.end('Error generating QR code');
      });
      return;
    }

    // 默认返回状态页
    if (pathname === '/' || pathname === '/dashboard') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(this.getDashboardHTML());
      return;
    }

    res.writeHead(404);
    res.end('Not Found');
  }

  /**
   * 生成配对二维码
   */
  async generateQRCode() {
    const pairingInfo = JSON.stringify({
      host: this.host,
      port: this.port,
      code: this.pairingCode,
      version: '1.0'
    });
    return QRCode.toDataURL(pairingInfo);
  }

  /**
   * 处理 WebSocket 连接
   */
  handleConnection(ws, req) {
    const clientId = uuidv4();
    
    console.log(`🔌 新连接: ${clientId}`);
    this.stats.connections++;

    this.clients.set(ws, {
      id: clientId,
      type: 'unknown',
      connectedAt: Date.now(),
      lastActivity: Date.now()
    });

    ws.on('message', (data) => {
      this.handleMessage(ws, clientId, data);
    });

    ws.on('close', () => {
      this.handleDisconnect(ws, clientId);
    });

    ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error.message);
    });

    // 发送欢迎消息
    this.send(ws, {
      type: 'connected',
      id: clientId,
      pairingRequired: true
    });
  }

  /**
   * 处理消息
   */
  handleMessage(ws, clientId, data) {
    try {
      const msg = JSON.parse(data.toString());
      this.stats.messages++;
      
      // 更新活动时间
      const client = this.clients.get(ws);
      if (client) client.lastActivity = Date.now();

      // 路由到对应的处理器
      switch (msg.type) {
        case 'ping':
          this.send(ws, { type: 'pong', timestamp: Date.now() });
          break;
          
        case 'pair':
          this.nodeHandler.handlePair(ws, msg);
          break;
          
        case 'chat.send':
          this.chatHandler.handleSend(msg);
          break;
          
        case 'chat.history':
          this.chatHandler.handleHistory(ws, msg);
          break;
          
        case 'chat.subscribe':
          this.handleSubscribe(ws, msg);
          break;
          
        case 'node.invoke':
          this.nodeHandler.handleInvoke(msg);
          break;
          
        case 'session.create':
          this.sessions.create(msg.payload);
          break;
          
        case 'cron.add':
          this.crons.add(msg.job);
          break;
          
        case 'tool.register':
          this.tools.register(msg.tool);
          break;
          
        default:
          console.log(`Unknown message type: ${msg.type}`);
          this.send(ws, { type: 'error', message: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message parse error:', error.message);
      this.send(ws, { type: 'error', message: 'Invalid message format' });
    }
  }

  /**
   * 处理断开连接
   */
  handleDisconnect(ws, clientId) {
    console.log(`🔌 断开连接: ${clientId}`);
    this.clients.delete(ws);
    
    // 如果是节点，更新状态
    const client = this.clients.get(ws);
    if (client && client.nodeId) {
      this.nodes.updateStatus(client.nodeId, 'offline');
    }
  }

  /**
   * 发送消息到客户端
   */
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * 广播消息到所有客户端
   */
  broadcast(data) {
    const message = JSON.stringify(data);
    this.clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  /**
   * 订阅消息
   */
  handleSubscribe(ws, msg) {
    const client = this.clients.get(ws);
    if (client) {
      client.subscribed = true;
      this.send(ws, { type: 'subscribed', channels: msg.channels || [] });
    }
  }

  /**
   * 获取 Gateway 状态
   */
  getStatus() {
    return {
      uptime: Date.now() - this.stats.startTime,
      connections: this.clients.size,
      messages: this.stats.messages,
      sessions: this.sessions.list().length,
      nodes: this.nodes.list().length,
      crons: this.crons.list().length,
      tools: this.tools.list().length,
      pairing: this.getPairingCode()
    };
  }

  /**
   * 启动状态报告
   */
  startStatsReporter() {
    setInterval(() => {
      console.log(`📊 [${new Date().toLocaleTimeString()}] ` +
        `连接: ${this.clients.size}, ` +
        `消息: ${this.stats.messages}, ` +
        `会话: ${this.sessions.list().length}, ` +
        `节点: ${this.nodes.list().length}`);
    }, 60000);
  }

  /**
   * 获取仪表盘 HTML
   */
  getDashboardHTML() {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Personal AI Agent Gateway</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #1a1a2e; color: #eee; }
    h1 { color: #00d4ff; }
    .status { background: #16213e; padding: 20px; border-radius: 10px; margin: 20px 0; }
    .stat { display: inline-block; margin: 10px 20px; }
    .stat-value { font-size: 24px; color: #00d4ff; }
    .qrcode { background: white; padding: 10px; border-radius: 5px; display: inline-block; }
    code { background: #0f3460; padding: 2px 8px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>🚀 Personal AI Agent Gateway</h1>
  <div class="status">
    <h3>📊 实时状态</h3>
    <div class="stat">连接数: <span class="stat-value" id="connections">0</span></div>
    <div class="stat">会话数: <span class="stat-value" id="sessions">0</span></div>
    <div class="stat">节点数: <span class="stat-value" id="nodes">0</span></div>
    <div class="stat">消息数: <span class="stat-value" id="messages">0</span></div>
  </div>
  <div class="status">
    <h3>📱 配对信息</h3>
    <p>配对码: <code id="pairingCode">生成中...</code></p>
    <p>过期时间: <span id="pairingExpiry"></span></p>
  </div>
  <script>
    function updateStatus() {
      fetch('/api/status').then(r => r.json()).then(data => {
        document.getElementById('connections').textContent = data.connections;
        document.getElementById('sessions').textContent = data.sessions;
        document.getElementById('nodes').textContent = data.nodes;
        document.getElementById('messages').textContent = data.messages;
        document.getElementById('pairingCode').textContent = data.pairing.code;
        document.getElementById('pairingExpiry').textContent = new Date(data.pairing.expiresAt).toLocaleString();
      });
    }
    updateStatus();
    setInterval(updateStatus, 2000);
  </script>
</body>
</html>
    `;
  }

  /**
   * 停止 Gateway
   */
  async stop() {
    console.log('\n🛑 正在关闭 Gateway...');
    
    // 保存所有状态
    this.nodes.save();
    this.crons.save();
    
    // 关闭所有连接
    this.clients.forEach((client, ws) => {
      ws.close();
    });
    
    // 关闭服务器
    if (this.wss) this.wss.close();
    if (this.server) this.server.close();
    
    console.log('✅ Gateway 已关闭');
  }
}

// CLI 入口
async function main() {
  const program = new Command();
  
  program
    .name('gateway')
    .description('Personal AI Agent Gateway')
    .option('-p, --port <port>', 'WebSocket 端口', '18789')
    .option('-h, --host <host>', '监听地址', '0.0.0.0');
  
  program.parse(process.argv);
  
  const config = {
    port: parseInt(program.opts().port),
    host: program.opts().host
  };
  
  const gateway = new Gateway(config);
  
  // 优雅关闭
  process.on('SIGINT', async () => {
    await gateway.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    await gateway.stop();
    process.exit(0);
  });
  
  await gateway.start();
}

module.exports = { Gateway };
main();
