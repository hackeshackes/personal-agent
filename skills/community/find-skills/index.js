const fs = require('fs');
const path = require('path');

/**
 * FindSkillsSkill - 技能搜索与发现
 */
class FindSkillsSkill {
  static metadata = {
    id: 'find-skills',
    name: '技能搜索',
    version: '1.0.0',
    description: '搜索和发现可用的 Skills，支持按名称、关键词、分类筛选',
    parameters: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          description: '操作类型: list, search, info, categories',
          enum: ['list', 'search', 'info', 'categories'],
          default: 'list'
        },
        query: {
          type: 'string',
          description: '搜索关键词'
        },
        category: {
          type: 'string',
          description: '技能分类'
        },
        installedOnly: {
          type: 'boolean',
          description: '仅显示已安装的技能',
          default: false
        },
        limit: {
          type: 'number',
          description: '结果数量限制',
          default: 20
        }
      },
      required: ['action']
    }
  };

  constructor(options = {}) {
    this.skillsPath = options.skillsPath || path.join(__dirname, '../../skills');
    this.cache = null;
    this.cacheTime = 0;
    this.cacheTTL = 60000; // 1分钟缓存
  }

  /**
   * 获取所有 Skills 列表
   */
  async getAllSkills() {
    const now = Date.now();
    
    // 返回缓存
    if (this.cache && (now - this.cacheTime) < this.cacheTTL) {
      return this.cache;
    }

    const skills = {
      builtin: [],
      community: []
    };

    // 读取内置 Skills
    const builtinPath = path.join(this.skillsPath, 'builtin');
    if (fs.existsSync(builtinPath)) {
      const builtinDirs = fs.readdirSync(builtinPath).filter(d => 
        fs.statSync(path.join(builtinPath, d)).isDirectory()
      );
      
      for (const dir of builtinDirs) {
        const skill = await this.loadSkill(builtinPath, dir);
        if (skill) skills.builtin.push(skill);
      }
    }

    // 读取社区 Skills
    const communityPath = path.join(this.skillsPath, 'community');
    if (fs.existsSync(communityPath)) {
      const communityDirs = fs.readdirSync(communityPath).filter(d => 
        fs.statSync(path.join(communityPath, d)).isDirectory()
      );
      
      for (const dir of communityDirs) {
        const skill = await this.loadSkill(communityPath, dir);
        if (skill) skills.community.push(skill);
      }
    }

    this.cache = skills;
    this.cacheTime = now;
    
    return skills;
  }

  /**
   * 加载单个 Skill 信息
   */
  async loadSkill(basePath, dirName) {
    const skillPath = path.join(basePath, dirName);
    const jsonPath = path.join(skillPath, 'skill.json');
    
    if (!fs.existsSync(jsonPath)) {
      return null;
    }

    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const metadata = JSON.parse(jsonContent);
      
      // 检查是否有 index.js
      const indexPath = path.join(skillPath, metadata.entry || 'index.js');
      const hasEntry = fs.existsSync(indexPath);

      return {
        id: metadata.id || dirName,
        name: metadata.name || dirName,
        version: metadata.version || '1.0.0',
        description: metadata.description || '',
        author: metadata.author || 'Unknown',
        license: metadata.license || 'MIT',
        category: basePath.includes('builtin') ? 'builtin' : 'community',
        hasEntry,
        keywords: metadata.keywords || [],
        path: skillPath,
        repository: metadata.repository || null
      };
    } catch (error) {
      console.error(`Error loading skill ${dirName}:`, error.message);
      return null;
    }
  }

  /**
   * 搜索 Skills
   */
  async search(query, options = {}) {
    const { category = null, limit = 20, installedOnly = false } = options;
    const allSkills = await this.getAllSkills();
    
    const results = [];
    const all = [...allSkills.builtin, ...allSkills.community];
    
    for (const skill of all) {
      // 过滤分类
      if (category && skill.category !== category) continue;
      
      // 过滤未安装
      if (installedOnly && !skill.hasEntry) continue;
      
      // 搜索匹配
      if (query) {
        const searchStr = `${skill.name} ${skill.description} ${skill.id} ${skill.keywords.join(' ')}`.toLowerCase();
        if (!searchStr.includes(query.toLowerCase())) continue;
      }
      
      results.push(skill);
      
      if (results.length >= limit) break;
    }

    return results;
  }

  /**
   * 列出所有 Skills
   */
  async list(options = {}) {
    const { category = null, installedOnly = false } = options;
    const allSkills = await this.getAllSkills();
    
    let results = [...allSkills.builtin, ...allSkills.community];
    
    if (category) {
      results = results.filter(s => s.category === category);
    }
    
    if (installedOnly) {
      results = results.filter(s => s.hasEntry);
    }

    return results;
  }

  /**
   * 获取 Skill 详情
   */
  async getInfo(skillId) {
    const allSkills = await this.getAllSkills();
    const all = [...allSkills.builtin, ...allSkills.community];
    
    const skill = all.find(s => s.id === skillId);
    
    if (!skill) {
      return { error: `Skill "${skillId}" not found` };
    }

    // 尝试读取完整 metadata
    const jsonPath = path.join(skill.path, 'skill.json');
    if (fs.existsSync(jsonPath)) {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      return JSON.parse(jsonContent);
    }

    return skill;
  }

  /**
   * 获取技能分类
   */
  async getCategories() {
    return {
      builtin: {
        name: '内置技能',
        description: '系统内置的核心技能',
        count: (await this.getAllSkills()).builtin.length
      },
      community: {
        name: '社区技能',
        description: '社区贡献的可安装技能',
        count: (await this.getAllSkills()).community.length
      }
    };
  }

  /**
   * 执行 Skill
   */
  async execute(params) {
    const { action = 'list', query = null, category = null, installedOnly = false, limit = 20 } = params;

    switch (action) {
      case 'list':
        return {
          success: true,
          action: 'list',
          skills: await this.list({ category, installedOnly }),
          total: (await this.list({ category, installedOnly })).length
        };

      case 'search':
        return {
          success: true,
          action: 'search',
          query,
          results: await this.search(query, { category, installedOnly, limit }),
          count: (await this.search(query, { category, installedOnly, limit })).length
        };

      case 'info':
        if (!query) {
          return { success: false, error: 'Missing skill ID' };
        }
        return {
          success: true,
          action: 'info',
          skill: await this.getInfo(query)
        };

      case 'categories':
        return {
          success: true,
          action: 'categories',
          categories: await this.getCategories()
        };

      default:
        return { success: false, error: `Unknown action: ${action}` };
    }
  }
}

module.exports = FindSkillsSkill;
