/**
 * Tool Bridge - 工具桥接器
 * 连接到 Python 代理执行复杂任务
 */

const { spawn } = require('child_process');
const path = require('path');

class ToolBridge {
  constructor(gateway) {
    this.gateway = gateway;
    this.agentProcess = null;
    this.toolResults = new Map();
  }
  
  /**
   * 启动 Python 代理
   */
  async startAgent() {
    const agentPath = path.join(__dirname, '../../agent/agent.py');
    
    this.agentProcess = spawn('python3', [agentPath], {
      cwd: path.dirname(agentPath),
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    this.agentProcess.stdout.on('data', (data) => {
      console.log(`[Agent] ${data}`);
      this._handleAgentMessage(data.toString());
    });
    
    this.agentProcess.stderr.on('data', (data) => {
      console.error(`[Agent Error] ${data}`);
    });
    
    console.log('🚀 Python Agent 已启动');
  }
  
  /**
   * 发送命令到 Agent
   */
  async sendCommand(command, params = {}) {
    return new Promise((resolve, reject) => {
      const messageId = `cmd-${Date.now()}`;
      
      const message = {
        id: messageId,
        command,
        params,
        timestamp: Date.now()
      };
      
      // 注册回调
      this.toolResults.set(messageId, {
        resolve,
        reject,
        timeout: setTimeout(() => {
          this.toolResults.delete(messageId);
          reject(new Error('Command timeout'));
        }, 30000)
      });
      
      // 发送消息
      if (this.agentProcess) {
        this.agentProcess.stdin.write(JSON.stringify(message) + '\n');
      } else {
        reject(new Error('Agent not running'));
      }
    });
  }
  
  /**
   * 处理 Agent 返回消息
   */
  _handleAgentMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.id && this.toolResults.has(message.id)) {
        const { resolve, timeout } = this.toolResults.get(message.id);
        clearTimeout(timeout);
        this.toolResults.delete(messageId);
        
        if (message.error) {
          resolve({ success: false, error: message.error });
        } else {
          resolve({ success: true, result: message.result });
        }
      }
    } catch (e) {
      // 非 JSON 消息，可能是日志
    }
  }
  
  /**
   * 执行市场查询
   */
  async queryMarket(symbol) {
    return this.sendCommand('market.query', { symbol });
  }
  
  /**
   * 执行文件操作
   */
  async operateFile(action, path) {
    return this.sendCommand('file.operate', { action, path });
  }
  
  /**
   * 执行日历操作
   */
  async operateCalendar(action, params) {
    return this.sendCommand('calendar.operate', { action, ...params });
  }
  
  /**
   * 执行邮件操作
   */
  async operateMail(action, params) {
    return this.sendCommand('mail.operate', { action, ...params });
  }
  
  /**
   * 执行计算
   */
  async calculate(expression) {
    return this.sendCommand('math.calculate', { expression });
  }
  
  /**
   * 搜索
   */
  async search(query, type = 'web') {
    return this.sendCommand('web.search', { query, type });
  }
  
  /**
   * 停止 Agent
   */
  async stop() {
    if (this.agentProcess) {
      this.agentProcess.kill();
      this.agentProcess = null;
    }
  }
}

module.exports = { ToolBridge };
