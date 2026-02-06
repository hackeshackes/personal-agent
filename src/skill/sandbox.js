/**
 * Skill Sandbox - Skill 沙箱隔离
 * 提供安全的 Skill 执行环境
 */

const { fork, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SkillSandbox {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 30000, // 30秒超时
      memoryLimit: options.memoryLimit || 512 * 1024 * 1024, // 512MB
      cpuLimit: options.cpuLimit || 50, // 50% CPU
      networkEnabled: options.networkEnabled !== false,
      maxPayload: options.maxPayload || 10 * 1024 * 1024, // 10MB
      ...options
    };
    
    this.activeProcesses = new Map();
  }
  
  /**
   * 在沙箱中执行 Skill
   */
  async execute(skillPath, method, params, context = {}) {
    const startTime = Date.now();
    
    // 验证 Skill 路径
    if (!this._validatePath(skillPath)) {
      throw new Error('Invalid skill path');
    }
    
    // 检查超时
    const timeout = context.timeout || this.options.timeout;
    
    return new Promise((resolve, reject) => {
      // 创建沙箱进程
      const workerPath = path.join(__dirname, 'sandbox-worker.js');
      
      const worker = fork(workerPath, [], {
        cwd: skillPath,
        execArgv: [
          '--max-old-space-size=256', // 限制内存
          '--no-deprecation',
          '--trace-warnings'
        ],
        env: {
          ...process.env,
          SANDBOX_TIMEOUT: timeout,
          SANDBOX_MEMORY_LIMIT: this.options.memoryLimit,
          SANDBOX_NETWORK: this.options.networkEnabled
        }
      });
      
      const processId = `sandbox-${Date.now()}`;
      this.activeProcesses.set(processId, worker);
      
      let completed = false;
      let timeoutHandle;
      
      // 超时处理
      timeoutHandle = setTimeout(() => {
        if (!completed) {
          completed = true;
          worker.kill('SIGKILL');
          this.activeProcesses.delete(processId);
          reject(new Error(`Skill execution timeout (>${timeout}ms)`));
        }
      }, timeout);
      
      // 消息处理
      worker.on('message', (message) => {
        if (message.type === 'result') {
          completed = true;
          clearTimeout(timeoutHandle);
          this.activeProcesses.delete(processId);
          
          resolve({
            success: true,
            result: message.data,
            latency: Date.now() - startTime
          });
        }
      });
      
      // 错误处理
      worker.on('error', (error) => {
        if (!completed) {
          completed = true;
          clearTimeout(timeoutHandle);
          this.activeProcesses.delete(processId);
          reject(new Error(`Sandbox error: ${error.message}`));
        }
      });
      
      // 进程退出
      worker.on('exit', (code) => {
        if (!completed && code !== 0) {
          completed = true;
          clearTimeout(timeoutHandle);
          this.activeProcesses.delete(processId);
          reject(new Error(`Skill exited with code ${code}`));
        }
      });
      
      // 发送执行请求
      worker.send({
        type: 'execute',
        skillPath,
        method,
        params,
        context
      });
    });
  }
  
  /**
   * 在沙箱中评估表达式
   */
  async eval(code, context = {}) {
    return new Promise((resolve, reject) => {
      const workerPath = path.join(__dirname, 'eval-worker.js');
      const worker = fork(workerPath);
      
      let completed = false;
      const timeoutHandle = setTimeout(() => {
        if (!completed) {
          completed = true;
          worker.kill('SIGKILL');
          reject(new Error('Expression evaluation timeout'));
        }
      }, 5000);
      
      worker.on('message', (message) => {
        completed = true;
        clearTimeout(timeoutHandle);
        worker.kill();
        
        if (message.error) {
          reject(new Error(message.error));
        } else {
          resolve(message.result);
        }
      });
      
      worker.send({ code, context });
    });
  }
  
  /**
   * 验证路径安全性
   */
  _validatePath(skillPath) {
    // 防止路径遍历攻击
    const resolved = path.resolve(skillPath);
    
    // 检查是否在允许的目录下
    const allowedDirs = [
      path.join(process.cwd(), 'skills'),
      '/tmp/skills',
      '/opt/skills'
    ];
    
    return allowedDirs.some(dir => resolved.startsWith(dir));
  }
  
  /**
   * 获取活跃进程数
   */
  getActiveCount() {
    return this.activeProcesses.size;
  }
  
  /**
   * 清理所有活跃进程
   */
  cleanup() {
    for (const [id, worker] of this.activeProcesses) {
      worker.kill('SIGKILL');
      this.activeProcesses.delete(id);
    }
    console.log(`[Sandbox] Cleaned up ${this.activeProcesses.size} processes`);
  }
  
  /**
   * 获取资源使用统计
   */
  getStats() {
    return {
      activeProcesses: this.activeProcesses.size,
      timeout: this.options.timeout,
      memoryLimit: this.options.memoryLimit,
      networkEnabled: this.options.networkEnabled
    };
  }
}

module.exports = { SkillSandbox };
