/**
 * Skill Framework - 统一入口
 */

const { Skill, SkillType, SkillStatus, Permission } = require('./interfaces');
const { SkillLoader } = require('./loader');
const { SkillRegistry } = require('./registry');
const { SkillManager } = require('./manager');

// 主框架类
class SkillFramework {
  constructor(options = {}) {
    this.options = options;
    this.loader = null;
    this.registry = null;
    this.manager = null;
    this.initialized = false;
  }
  
  /**
   * 初始化框架
   */
  async init(options = {}) {
    const {
      skillsDir = './skills',
      registryFile = './skills/registry.json',
      sandboxEnabled = false,
      autoLoadBuiltin = true
    } = options;
    
    this.loader = new SkillLoader({ skillsDir, sandboxEnabled });
    this.manager = new SkillManager({ skillsDir, registryFile });
    this.registry = new SkillRegistry({ registryFile });
    
    // 加载所有内置 Skill
    if (autoLoadBuiltin) {
      await this.loader.loadAll('builtin');
    }
    
    this.initialized = true;
    console.log('[SkillFramework] ✅ Framework initialized');
    
    return this;
  }
  
  /**
   * 执行 Skill
   */
  async execute(skillId, params = {}, context = {}) {
    if (!this.initialized) {
      throw new Error('Framework not initialized');
    }
    
    return await this.loader.execute(skillId, params, context);
  }
  
  /**
   * 列出所有 Skill
   */
  list() {
    return this.loader.list();
  }
  
  /**
   * 获取执行列表
   */
  getExecutable() {
    return this.loader.getExecutable();
  }
  
  /**
   * 搜索 Skill
   */
  search(query, options = {}) {
    return this.registry.search(query, options);
  }
  
  /**
   * 安装 Skill
   */
  async install(skillId, source, options = {}) {
    return await this.manager.install(skillId, source, options);
  }
  
  /**
   * 卸载 Skill
   */
  async uninstall(skillId, options = {}) {
    return await this.manager.uninstall(skillId, options);
  }
  
  /**
   * 更新 Skill
   */
  async update(skillId, options = {}) {
    return await this.manager.update(skillId, options);
  }
  
  /**
   * 获取状态
   */
  getStatus() {
    return {
      initialized: this.initialized,
      loaded: this.loader.list(),
      registry: this.registry.list(),
      status: this.manager.getStatus()
    };
  }
  
  /**
   * 健康检查
   */
  async healthCheck() {
    return await this.loader.healthCheckAll();
  }
}

module.exports = {
  SkillFramework,
  Skill,
  SkillType,
  SkillStatus,
  Permission,
  SkillLoader,
  SkillRegistry,
  SkillManager
};
