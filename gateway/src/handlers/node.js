/**
 * Node Handler - 节点处理器
 */

class NodeHandler {
  constructor(gateway) {
    this.gateway = gateway;
  }

  /**
   * 处理配对请求
   */
  handlePair(ws, msg) {
    const { code, nodeInfo } = msg;
    
    try {
      // 创建或获取配对请求
      let request = this.gateway.nodes.getPairingRequest(code);
      
      if (!request) {
        // 创建新请求
        request = this.gateway.nodes.createPairingRequest(code);
      }
      
      // 批准配对
      const node = this.gateway.nodes.approvePairing(code, {
        ...nodeInfo,
        capabilities: nodeInfo.capabilities || ['chat', 'voice']
      });
      
      // 发送配对成功响应
      this.gateway.send(ws, {
        type: 'pair.success',
        nodeId: node.id,
        pairingCode: code
      });
      
      // 更新客户端信息
      const client = this.gateway.clients.get(ws);
      if (client) {
        client.type = 'node';
        client.nodeId = node.id;
      }
      
      console.log(`✅ 节点配对成功: ${node.name} (${node.id})`);
      
    } catch (error) {
      this.gateway.send(ws, {
        type: 'pair.error',
        message: error.message
      });
    }
  }

  /**
   * 处理节点调用
   */
  handleInvoke(msg) {
    const { nodeId, command, params } = msg;
    
    const node = this.gateway.nodes.get(nodeId);
    if (!node) {
      return { error: '节点不存在' };
    }
    
    console.log(`📱 节点调用: ${nodeId} -> ${command}`);
    
    // 广播命令到对应的节点
    this.gateway.broadcast({
      type: 'node.command',
      nodeId,
      command,
      params
    });
    
    return { acknowledged: true };
  }

  /**
   * 处理节点状态更新
   */
  handleStatusUpdate(msg) {
    const { nodeId, status, metadata } = msg;
    
    this.gateway.nodes.updateStatus(nodeId, status);
    
    if (metadata) {
      const node = this.gateway.nodes.get(nodeId);
      if (node) {
        node.metadata = { ...node.metadata, ...metadata };
      }
    }
    
    return { acknowledged: true };
  }
}

module.exports = { NodeHandler };
