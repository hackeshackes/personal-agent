/**
 * Message Handler - 消息处理器
 */

class MessageHandler {
  constructor(gateway) {
    this.gateway = gateway;
  }

  /**
   * 处理普通消息
   */
  handleMessage(msg) {
    console.log(`📨 消息: ${msg.content?.substring(0, 100)}...`);
    
    // 路由到对应的处理器
    if (msg.channel === 'chat') {
      return this.handleChatMessage(msg);
    }
    
    return { acknowledged: true };
  }

  /**
   * 处理聊天消息
   */
  handleChatMessage(msg) {
    // 广播到所有订阅的客户端
    this.gateway.broadcast({
      type: 'message',
      channel: 'chat',
      content: msg.content,
      sender: msg.sender || 'agent',
      timestamp: Date.now()
    });
    
    return { acknowledged: true };
  }

  /**
   * 处理系统事件
   */
  handleSystemEvent(event) {
    console.log(`🔔 系统事件: ${event.text}`);
    
    // 发送到主会话
    const mainSession = this.gateway.sessions.getMain();
    if (mainSession) {
      this.gateway.sessions.addMessage(mainSession.id, {
        role: 'system',
        content: event.text
      });
    }
    
    return { acknowledged: true };
  }
}

module.exports = { MessageHandler };
