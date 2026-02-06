/**
 * Session Manager - 会话管理
 * 支持主会话和隔离会话
 */

const fs = require('fs');
const path = require('path');

class SessionManager {
  constructor() {
    this.sessions = new Map();
    this.mainSession = null;
    this.dataDir = path.join(__dirname, '../../data');
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 创建会话
   */
  create(options = {}) {
    const session = {
      id: options.id || `session-${Date.now()}`,
      kind: options.kind || 'main', // main | isolated
      model: options.model || 'minimax/MiniMax-M2.1',
      createdAt: Date.now(),
      messages: [],
      contextMessages: options.contextMessages || [],
      modelConfig: options.modelConfig || {},
      terminated: false
    };

    this.sessions.set(session.id, session);
    
    if (session.kind === 'main') {
      this.mainSession = session.id;
    }
    
    console.log(`📝 会话创建: ${session.id} (${session.kind})`);
    return session;
  }

  /**
   * 获取会话
   */
  get(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * 获取主会话
   */
  getMain() {
    if (!this.mainSession) {
      return this.create({ kind: 'main' });
    }
    return this.sessions.get(this.mainSession);
  }

  /**
   * 列出所有会话
   */
  list() {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      kind: s.kind,
      model: s.model,
      createdAt: s.createdAt,
      messageCount: s.messages.length,
      terminated: s.terminated
    }));
  }

  /**
   * 添加消息到会话
   */
  addMessage(sessionId, message) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.messages.push({
        ...message,
        timestamp: Date.now()
      });
    }
  }

  /**
   * 获取会话历史
   */
  getHistory(sessionId, limit = 50) {
    const session = this.sessions.get(sessionId);
    if (!session) return [];
    
    const messages = session.messages;
    return messages.slice(-limit);
  }

  /**
   * 终止会话
   */
  terminate(sessionId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.terminated = true;
      console.log(`🗑️ 会话终止: ${sessionId}`);
    }
  }

  /**
   * 保存会话到磁盘
   */
  save() {
    const data = {
      sessions: Array.from(this.sessions.entries()),
      mainSession: this.mainSession
    };
    
    const filePath = path.join(this.dataDir, 'sessions.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 从磁盘加载会话
   */
  load() {
    const filePath = path.join(this.dataDir, 'sessions.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        this.sessions = new Map(data.sessions);
        this.mainSession = data.mainSession;
        console.log(`📂 加载了 ${this.sessions.size} 个会话`);
      } catch (error) {
        console.error('加载会话失败:', error.message);
      }
    }
  }
}

module.exports = { SessionManager };
