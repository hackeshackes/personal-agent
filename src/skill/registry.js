/**
 * Skill Registry - Skill 注册表
 * 管理和维护所有可用 Skill 的元数据
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class SkillRegistry {
  constructor(options = {}) {
    this.registryFile = options.registryFile || './skills/registry.json';
    this.registry = new Map(); // id -> metadata
    this.categories = new Set();
    
    this._loadRegistry();
  }
  
  /**
   * 注册 Skill
   */
  register(manifest, options = {}) {
    if (this.registry.has(manifest.id)) {
      console.log(`[Registry] Skill ${manifest.id} already exists, updating...`);
    }
    
    const metadata = {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author || 'Unknown',
      license: manifest.license || 'MIT',
      keywords: manifest.keywords || [],
      entry: manifest.entry,
      main: manifest.main,
      permissions: manifest.permissions || [],
      dependencies: manifest.dependencies || {},
      engines: manifest.engines || {},
      
      // 注册信息
      installed: true,
      installPath: options.path || null,
      installTime: Date.now(),
      lastUpdate: Date.now(),
      
      // 分类
      category: this._inferCategory(manifest.keywords || []),
      
      // 统计
      downloads: 0,
      rating: 0,
      
      // 哈希
      checksum: this._computeChecksum(manifest)
    };
    
    this.registry.set(manifest.id, metadata);
    this.categories.add(metadata.category);
    
    this._saveRegistry();
    
    console.log(`[Registry] ✅ Skill registered: ${manifest.id} v${manifest.version}`);
    
    return metadata;
  }
  
  /**
   * 取消注册
   */
  unregister(skillId) {
    if (!this.registry.has(skillId)) {
      console.log(`[Registry] Skill ${skillId} not found, skipping`);
      return { success: true, skillId };
    }
    
    this.registry.delete(skillId);
    this._saveRegistry();
    
    console.log(`[Registry] ✅ Skill unregistered: ${skillId}`);
    
    return { success: true, skillId };
  }
  
  /**
   * 更新 Skill
   */
  update(skillId, updates) {
    const metadata = this.registry.get(skillId);
    
    if (!metadata) {
      throw new Error(`Skill not found: ${skillId}`);
    }
    
    // 更新字段
    Object.assign(metadata, updates, {
      lastUpdate: Date.now()
    });
    
    this._saveRegistry();
    
    console.log(`[Registry] ✅ Skill updated: ${skillId}`);
    
    return metadata;
  }
  
  /**
   * 获取 Skill 元数据
   */
  get(skillId) {
    return this.registry.get(skillId);
  }
  
  /**
   * 列出所有 Skill
   */
  list(options = {}) {
    const {
      installed = true,
      category = null,
      sortBy = 'name',
      order = 'asc'
    } = options;
    
    let skills = Array.from(this.registry.values());
    
    // 过滤
    if (installed !== undefined) {
      skills = skills.filter(s => s.installed === installed);
    }
    
    if (category) {
      skills = skills.filter(s => s.category === category);
    }
    
    // 排序
    skills.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'version':
          comparison = this._compareVersions(a.version, b.version);
          break;
        case 'downloads':
          comparison = a.downloads - b.downloads;
          break;
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'installTime':
          comparison = a.installTime - b.installTime;
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }
      
      return order === 'desc' ? -comparison : comparison;
    });
    
    return skills;
  }
  
  /**
   * 搜索 Skill
   */
  search(query, options = {}) {
    const { limit = 20, category = null } = options;
    const lowerQuery = query.toLowerCase();
    
    let results = Array.from(this.registry.values())
      .filter(s => {
        const matchName = s.name.toLowerCase().includes(lowerQuery);
        const matchDesc = s.description?.toLowerCase().includes(lowerQuery);
        const matchKeywords = s.keywords?.some(k => k.toLowerCase().includes(lowerQuery));
        const matchAuthor = s.author?.toLowerCase().includes(lowerQuery);
        
        return matchName || matchDesc || matchKeywords || matchAuthor;
      });
    
    if (category) {
      results = results.filter(s => s.category === category);
    }
    
    // 按相关性排序
    results.sort((a, b) => {
      const aScore = this._calcRelevance(a, lowerQuery);
      const bScore = this._calcRelevance(b, lowerQuery);
      return bScore - aScore;
    });
    
    return results.slice(0, limit);
  }
  
  /**
   * 按类别获取
   */
  getByCategory(category) {
    return Array.from(this.registry.values())
      .filter(s => s.category === category);
  }
  
  /**
   * 获取所有类别
   */
  getCategories() {
    return Array.from(this.categories);
  }
  
  /**
   * 检查是否存在
   */
  has(skillId) {
    return this.registry.has(skillId);
  }
  
  /**
   * 获取总数
   */
  count() {
    return this.registry.size;
  }
  
  /**
   * 获取已安装数
   */
  installedCount() {
    return Array.from(this.registry.values())
      .filter(s => s.installed).length;
  }
  
  /**
   * 验证注册表完整性
   */
  validate() {
    const errors = [];
    
    for (const [skillId, metadata] of this.registry) {
      if (!metadata.name) {
        errors.push(`[${skillId}] Missing name`);
      }
      if (!metadata.version) {
        errors.push(`[${skillId}] Missing version`);
      }
      if (!metadata.entry) {
        errors.push(`[${skillId}] Missing entry`);
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * 导出注册表
   */
  export(format = 'json') {
    const skills = this.list();
    
    switch (format) {
      case 'json':
        return JSON.stringify(skills, null, 2);
      
      case 'markdown':
        let md = `# Skill Registry\n\n`;
        md += `Total: ${skills.length} skills\n\n`;
        
        for (const category of this.categories) {
          md += `## ${category}\n\n`;
          
          const categorySkills = skills.filter(s => s.category === category);
          for (const skill of categorySkills) {
            md += `- **${skill.name}** v${skill.version}\n`;
            md += `  - ${skill.description}\n`;
            md += `  - ID: \`${skill.id}\`\n\n`;
          }
        }
        
        return md;
      
      default:
        return JSON.stringify(skills);
    }
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 加载注册表
   */
  _loadRegistry() {
    if (!fs.existsSync(this.registryFile)) {
      console.log(`[Registry] Registry file not found, creating new one`);
      return;
    }
    
    try {
      const content = fs.readFileSync(this.registryFile, 'utf8');
      const data = JSON.parse(content);
      
      data.forEach(metadata => {
        this.registry.set(metadata.id, metadata);
        this.categories.add(metadata.category);
      });
      
      console.log(`[Registry] Loaded ${this.registry.size} skills`);
      
    } catch (error) {
      console.error(`[Registry] Failed to load registry:`, error.message);
    }
  }
  
  /**
   * 保存注册表
   */
  _saveRegistry() {
    const data = Array.from(this.registry.values());
    fs.writeFileSync(this.registryFile, JSON.stringify(data, null, 2));
  }
  
  /**
   * 推断类别
   */
  _inferCategory(keywords) {
    const keywordStr = keywords.join(' ').toLowerCase();
    
    const categoryMap = {
      'development': ['git', 'docker', 'code', 'database', 'devops', 'programming'],
      'productivity': ['calendar', 'mail', 'note', 'todo', 'task', 'reminder'],
      'data': ['excel', 'csv', 'pdf', 'database', 'analytics', 'chart'],
      'communication': ['slack', 'discord', 'telegram', 'teams', 'wechat', 'imessage'],
      'ai': ['openai', 'anthropic', 'llm', 'ml', 'nlp', 'embedding'],
      'lifestyle': ['weather', 'news', 'translation', 'travel', 'food', 'music'],
      'finance': ['stock', 'crypto', 'market', 'trading', 'bitcoin', 'finance'],
      'system': ['file', 'shell', 'command', 'system', 'process', 'network']
    };
    
    for (const [category, patterns] of Object.entries(categoryMap)) {
      if (patterns.some(p => keywordStr.includes(p))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  /**
   * 计算相关性分数
   */
  _calcRelevance(metadata, query) {
    let score = 0;
    
    if (metadata.name?.toLowerCase().includes(query)) score += 10;
    if (metadata.keywords?.some(k => k.toLowerCase() === query)) score += 5;
    if (metadata.description?.toLowerCase().includes(query)) score += 2;
    if (metadata.author?.toLowerCase().includes(query)) score += 1;
    
    return score;
  }
  
  /**
   * 计算校验和
   */
  _computeChecksum(manifest) {
    const str = JSON.stringify(manifest);
    return crypto.createHash('md5').update(str).digest('hex').substring(0, 8);
  }
  
  /**
   * 比较版本号
   */
  _compareVersions(a, b) {
    const [aMajor, aMinor, aPatch] = a.split('.').map(Number);
    const [bMajor, bMinor, bPatch] = b.split('.').map(Number);
    
    if (aMajor !== bMajor) return aMajor - bMajor;
    if (aMinor !== bMinor) return aMinor - bMinor;
    return aPatch - bPatch;
  }
}

module.exports = { SkillRegistry };
