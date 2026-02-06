/**
 * Skill Loader - Skill 加载器
 * 负责加载、卸载和管理 Skill 生命周期
 */

const fs = require('fs');
const path = require('path');
const { Skill, SkillStatus } = require('./interfaces');

class SkillLoader {
  constructor(options = {}) {
    this.skillsDir = options.skillsDir || './skills';
    this.loadedSkills = new Map(); // id -> { manifest, instance, status }
    this.sandboxEnabled = options.sandboxEnabled || false;
  }
  
  /**
   * 加载单个 Skill
   */
  async load(skillPath, options = {}) {
    const manifest = await this._loadManifest(skillPath);
    
    // 检查是否已加载
    if (this.loadedSkills.has(manifest.id)) {
      console.log(`[Loader] Skill ${manifest.id} already loaded, reloading...`);
      await this.unload(manifest.id);
    }
    
    try {
      // 验证 Manifest
      this._validateManifest(manifest);
      
      // 加载 Skill 类
      const SkillClass = await this._loadEntry(skillPath, manifest);
      
      // 创建实例
      const config = await this._loadConfig(skillPath, manifest);
      const instance = new SkillClass(config);
      
      // 初始化
      if (instance.init && typeof instance.init === 'function') {
        await instance.init();
      }
      
      // 注册
      this.loadedSkills.set(manifest.id, {
        manifest,
        instance,
        status: SkillStatus.LOADED,
        path: skillPath,
        loadTime: Date.now()
      });
      
      console.log(`[Loader] ✅ Skill loaded: ${manifest.id} v${manifest.version}`);
      
      return {
        success: true,
        skillId: manifest.id,
        name: manifest.name,
        version: manifest.version
      };
      
    } catch (error) {
      console.error(`[Loader] ❌ Failed to load ${manifest.id}:`, error.message);
      
      this.loadedSkills.set(manifest.id, {
        manifest,
        instance: null,
        status: SkillStatus.ERROR,
        error: error.message,
        path: skillPath
      });
      
      throw error;
    }
  }
  
  /**
   * 卸载 Skill
   */
  async unload(skillId) {
    const skill = this.loadedSkills.get(skillId);
    
    if (!skill) {
      console.log(`[Loader] Skill ${skillId} not found, skipping unload`);
      return { success: true, skillId };
    }
    
    try {
      // 销毁实例
      if (skill.instance && skill.instance.destroy) {
        await skill.instance.destroy();
      }
      
      // 清理缓存
      this.loadedSkills.delete(skillId);
      
      // 清理 require 缓存
      this._clearRequireCache(skill.path);
      
      console.log(`[Loader] ✅ Skill unloaded: ${skillId}`);
      
      return { success: true, skillId };
      
    } catch (error) {
      console.error(`[Loader] ❌ Failed to unload ${skillId}:`, error.message);
      throw error;
    }
  }
  
  /**
   * 重新加载 Skill
   */
  async reload(skillId) {
    const skill = this.loadedSkills.get(skillId);
    
    if (!skill) {
      throw new Error(`Skill not loaded: ${skillId}`);
    }
    
    const { path: skillPath } = skill;
    
    await this.unload(skillId);
    return await this.load(skillPath);
  }
  
  /**
   * 执行 Skill
   */
  async execute(skillId, params = {}, context = {}) {
    const skill = this.loadedSkills.get(skillId);
    
    if (!skill) {
      throw new Error(`Skill not loaded: ${skillId}`);
    }
    
    if (skill.status !== SkillStatus.LOADED) {
      throw new Error(`Skill not ready: ${skillId} (status: ${skill.status})`);
    }
    
    if (!skill.instance) {
      throw new Error(`Skill instance invalid: ${skillId}`);
    }
    
    // 验证参数
    this._validateParams(skill.manifest.parameters, params);
    
    // 执行
    const startTime = Date.now();
    const result = await skill.instance.execute(params, context);
    const latency = Date.now() - startTime;
    
    return {
      success: true,
      skillId,
      result,
      latency
    };
  }
  
  /**
   * 批量加载目录中的所有 Skill
   */
  async loadAll(dirType = 'builtin') {
    const skillsDir = path.join(this.skillsDir, dirType);
    
    if (!fs.existsSync(skillsDir)) {
      console.log(`[Loader] Skills directory not found: ${skillsDir}`);
      return [];
    }
    
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const results = [];
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const skillPath = path.join(skillsDir, entry.name);
        const skillJsonPath = path.join(skillPath, 'skill.json');
        
        if (fs.existsSync(skillJsonPath)) {
          try {
            const result = await this.load(skillPath);
            results.push(result);
          } catch (error) {
            results.push({
              success: false,
              skillId: entry.name,
              error: error.message
            });
          }
        }
      }
    }
    
    console.log(`[Loader] Loaded ${results.filter(r => r.success).length}/${results.length} skills from ${dirType}`);
    
    return results;
  }
  
  /**
   * 列出所有已加载的 Skill
   */
  list() {
    return Array.from(this.loadedSkills.entries()).map(([id, skill]) => ({
      id,
      name: skill.manifest.name,
      version: skill.manifest.version,
      status: skill.status,
      loadTime: skill.loadTime,
      path: skill.path
    }));
  }
  
  /**
   * 获取单个 Skill
   */
  get(skillId) {
    return this.loadedSkills.get(skillId);
  }
  
  /**
   * 获取所有可执行 Skill (有 execute 方法)
   */
  getExecutable() {
    return Array.from(this.loadedSkills.entries())
      .filter(([_, skill]) => skill.status === SkillStatus.LOADED && skill.instance?.execute)
      .map(([id, skill]) => ({
        id,
        name: skill.manifest.name,
        description: skill.manifest.description,
        parameters: skill.manifest.parameters
      }));
  }
  
  /**
   * 健康检查所有 Skill
   */
  async healthCheckAll() {
    const results = [];
    
    for (const [skillId, skill] of this.loadedSkills) {
      if (skill.status !== SkillStatus.LOADED || !skill.instance) {
        results.push({
          skillId,
          status: 'skipped',
          reason: skill.status
        });
        continue;
      }
      
      try {
        const check = await skill.instance.healthCheck();
        results.push({
          skillId,
          status: check?.status || 'unknown'
        });
      } catch (error) {
        results.push({
          skillId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 加载 Manifest
   */
  async _loadManifest(skillPath) {
    const manifestPath = path.join(skillPath, 'skill.json');
    
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`skill.json not found: ${skillPath}`);
    }
    
    const content = await fs.promises.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  }
  
  /**
   * 验证 Manifest
   */
  _validateManifest(manifest) {
    const required = ['id', 'name', 'version', 'entry', 'main'];
    
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field in skill.json: ${field}`);
      }
    }
  }
  
  /**
   * 加载入口文件
   */
  async _loadEntry(skillPath, manifest) {
    const entryPath = path.join(skillPath, manifest.entry);
    
    if (!fs.existsSync(entryPath)) {
      throw new Error(`Entry file not found: ${entryPath}`);
    }
    
    // 清除缓存
    delete require.cache[require.resolve(entryPath)];
    
    const module = require(entryPath);
    return module[manifest.main] || module.default;
  }
  
  /**
   * 加载配置文件
   */
  async _loadConfig(skillPath, manifest) {
    const configPath = path.join(skillPath, 'config.json');
    
    if (fs.existsSync(configPath)) {
      const content = await fs.promises.readFile(configPath, 'utf8');
      return JSON.parse(content);
    }
    
    return {};
  }
  
  /**
   * 验证参数
   */
  _validateParams(schema, params) {
    if (!schema || !schema.properties) return;
    
    // 检查必需参数
    if (schema.required) {
      for (const field of schema.required) {
        if (params[field] === undefined) {
          throw new Error(`Missing required parameter: ${field}`);
        }
      }
    }
    
    // 检查类型
    for (const [key, spec] of Object.entries(schema.properties || {})) {
      if (params[key] !== undefined && spec.type) {
        const actualType = typeof params[key];
        if (actualType !== spec.type) {
          throw new Error(`Invalid type for ${key}: expected ${spec.type}, got ${actualType}`);
        }
      }
    }
  }
  
  /**
   * 清理 require 缓存
   */
  _clearRequireCache(skillPath) {
    const manifestPath = path.join(skillPath, 'skill.json');
    
    // 清除入口文件缓存
    if (require.cache[require.resolve(manifestPath)]) {
      delete require.cache[require.resolve(manifestPath)];
    }
    
    // 递归清除子模块缓存
    for (const [key, module] of Object.entries(require.cache)) {
      if (key.startsWith(skillPath)) {
        delete require.cache[key];
      }
    }
  }
}

module.exports = { SkillLoader };
