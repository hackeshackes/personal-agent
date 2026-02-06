/**
 * Skill Framework - Skill 核心接口定义
 */

module.exports = {
  /**
   * Skill 基类
   */
  Skill: class Skill {
    constructor(config = {}) {
      this.config = config;
      this.name = this.constructor.name;
      this.version = this.constructor.version || '1.0.0';
    }
    
    // Skill 元数据 (子类必须覆盖)
    static get metadata() {
      return {
        id: this.name.toLowerCase(),
        name: this.name,
        version: this.version || '1.0.0',
        description: 'A Personal AI Agent Skill',
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      };
    }
    
    // 执行 Skill (子类必须覆盖)
    async execute(params, context = {}) {
      throw new Error('execute() must be implemented by subclass');
    }
    
    // 健康检查
    async healthCheck() {
      return { status: 'ok', skill: this.name };
    }
    
    // 初始化
    async init() {
      console.log(`[Skill] ${this.name} initialized`);
    }
    
    // 销毁
    async destroy() {
      console.log(`[Skill] ${this.name} destroyed`);
    }
  },
  
  /**
   * Skill 类型枚举
   */
  SkillType: {
    BUILTIN: 'builtin',
    COMMUNITY: 'community',
    CUSTOM: 'custom'
  },
  
  /**
   * Skill 状态枚举
   */
  SkillStatus: {
    INSTALLED: 'installed',
    LOADED: 'loaded',
    UNLOADED: 'unloaded',
    ERROR: 'error',
    UPDATING: 'updating'
  },
  
  /**
   * 权限定义
   */
  Permission: {
    HTTP_REQUEST: 'http.request',
    FILE_READ: 'file.read',
    FILE_WRITE: 'file.write',
    FILE_DELETE: 'file.delete',
    EXECUTE: 'execute',
    NETWORK: 'network',
    STORAGE: 'storage'
  }
};
