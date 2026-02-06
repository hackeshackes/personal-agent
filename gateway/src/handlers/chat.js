/**
 * Chat Handler - 聊天处理器
 */

class ChatHandler {
  constructor(gateway) {
    this.gateway = gateway;
  }

  /**
   * 处理发送消息
   */
  handleSend(msg) {
    const { target, content, type = 'text' } = msg;
    
    // 创建消息对象
    const message = {
      id: `msg-${Date.now()}`,
      type,
      content,
      target,
      timestamp: Date.now()
    };
    
    console.log(`💬 聊天消息 -> ${target}: ${content.substring(0, 50)}...`);
    
    // 广播消息
    this.gateway.broadcast({
      type: 'chat.message',
      ...message
    });
    
    return { acknowledged: true, messageId: message.id };
  }

  /**
   * 处理获取历史
   */
  handleHistory(ws, msg) {
    const { sessionId, limit = 50 } = msg;
    
    // 如果没有指定 session，使用主会话
    const sid = sessionId || this.gateway.sessions.getMain()?.id;
    
    if (!sid) {
      this.send(ws, { type: 'chat.history', messages: [] });
      return;
    }
    
    const history = this.gateway.sessions.getHistory(sid, limit);
    
    this.send(ws, {
      type: 'chat.history',
      sessionId: sid,
      messages: history
    });
  }

  /**
   * 发送消息到 WebSocket
   */
  send(ws, data) {
    if (ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify(data));
    }
  }
}

module.exports = { ChatHandler };
