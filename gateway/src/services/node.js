/**
 * Node Manager - 节点管理
 * 管理 iOS/Android/桌面节点
 */

const fs = require('fs');
const path = require('path');

class NodeManager {
  constructor() {
    this.nodes = new Map();
    this.pendingRequests = new Map();
    this.dataDir = path.join(__dirname, '../../data');
    
    // 确保数据目录存在
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * 添加节点
   */
  add(nodeInfo) {
    const node = {
      id: nodeInfo.id || `node-${Date.now()}`,
      name: nodeInfo.name || '未命名节点',
      type: nodeInfo.type || 'unknown', // ios | android | desktop
      platform: nodeInfo.platform || 'unknown',
      version: nodeInfo.version || '1.0.0',
      status: 'offline',
      pairedAt: Date.now(),
      lastSeen: Date.now(),
      capabilities: nodeInfo.capabilities || [],
      metadata: nodeInfo.metadata || {}
    };

    this.nodes.set(node.id, node);
    console.log(`📱 节点添加: ${node.name} (${node.type})`);
    return node;
  }

  /**
   * 获取节点
   */
  get(nodeId) {
    return this.nodes.get(nodeId);
  }

  /**
   * 列出所有节点
   */
  list() {
    return Array.from(this.nodes.values()).map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      platform: n.platform,
      version: n.version,
      status: n.status,
      lastSeen: n.lastSeen,
      capabilities: n.capabilities
    }));
  }

  /**
   * 更新节点状态
   */
  updateStatus(nodeId, status) {
    const node = this.nodes.get(nodeId);
    if (node) {
      node.status = status;
      node.lastSeen = Date.now();
    }
  }

  /**
   * 创建配对请求
   */
  createPairingRequest(code) {
    const request = {
      code: code.toUpperCase(),
      id: `pair-${Date.now()}`,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000, // 10分钟
      status: 'pending'
    };
    
    this.pendingRequests.set(code.toUpperCase(), request);
    return request;
  }

  /**
   * 获取配对请求
   */
  getPairingRequest(code) {
    return this.pendingRequests.get(code.toUpperCase());
  }

  /**
   * 批准配对请求
   */
  approvePairing(code, nodeInfo) {
    const request = this.pendingRequests.get(code.toUpperCase());
    
    if (!request) {
      throw new Error('配对请求不存在');
    }
    
    if (Date.now() > request.expiresAt) {
      this.pendingRequests.delete(code.toUpperCase());
      throw new Error('配对请求已过期');
    }
    
    // 创建节点
    const node = this.add({
      ...nodeInfo,
      status: 'online'
    });
    
    // 删除请求
    this.pendingRequests.delete(code.toUpperCase());
    
    console.log(`✅ 配对批准: ${code} -> ${node.id}`);
    return node;
  }

  /**
   * 拒绝配对请求
   */
  rejectPairing(code) {
    this.pendingRequests.delete(code.toUpperCase());
    console.log(`❌ 配对拒绝: ${code}`);
  }

  /**
   * 获取待处理请求
   */
  getPendingRequests() {
    return Array.from(this.pendingRequests.values())
      .filter(r => Date.now() < r.expiresAt);
  }

  /**
   * 保存节点到磁盘
   */
  save() {
    const data = {
      nodes: Array.from(this.nodes.entries()),
      pendingRequests: Array.from(this.pendingRequests.entries())
    };
    
    const filePath = path.join(this.dataDir, 'nodes.json');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /**
   * 从磁盘加载节点
   */
  load() {
    const filePath = path.join(this.dataDir, 'nodes.json');
    
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath));
        this.nodes = new Map(data.nodes);
        this.pendingRequests = new Map(data.pendingRequests || []);
        console.log(`📂 加载了 ${this.nodes.size} 个节点`);
      } catch (error) {
        console.error('加载节点失败:', error.message);
      }
    }
  }
}

module.exports = { NodeManager };
