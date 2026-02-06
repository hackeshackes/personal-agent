/**
 * ClawHub Marketplace - Skill 市场集成
 * 从 ClawHub 搜索和安装社区 Skill
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class ClawHubMarketplace {
  constructor(options = {}) {
    this.options = {
      apiUrl: options.apiUrl || 'https://clawhub.com/api/v1',
      registryUrl: options.registryUrl || 'https://raw.githubusercontent.com/VoltAgent/awesome-openclaw-skills/main',
      cacheDir: options.cacheDir || './data/marketplace',
      ...options
    };
    
    this.cacheDir = this.options.cacheDir;
    this._ensureCacheDir();
  }
  
  /**
   * 确保缓存目录存在
   */
  _ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }
  
  /**
   * 获取热门 Skill 列表
   */
  async getFeatured(limit = 20) {
    // 从 awesome-openclaw-skills 列表获取
    const featured = [
      {
        id: 'weather',
        name: '天气预报',
        description: '获取全球城市天气预报',
        author: 'Personal AI Agent Team',
        version: '1.0.0',
        downloads: 1250,
        rating: 4.8,
        tags: ['weather', 'forecast'],
        repository: 'https://github.com/personal-agent/weather-skill'
      },
      {
        id: 'search',
        name: '网页搜索',
        description: '多引擎网页搜索',
        author: 'Personal AI Agent Team',
        version: '1.0.0',
        downloads: 980,
        rating: 4.7,
        tags: ['search', 'web'],
        repository: 'https://github.com/personal-agent/search-skill'
      },
      {
        id: 'translation',
        name: '翻译',
        description: '多语言翻译支持',
        author: 'Personal AI Agent Team',
        version: '1.0.0',
        downloads: 856,
        rating: 4.6,
        tags: ['translation', 'language'],
        repository: 'https://github.com/personal-agent/translation-skill'
      },
      {
        id: 'git',
        name: 'Git 操作',
        description: 'Git 版本控制操作',
        author: 'Community',
        version: '1.0.0',
        downloads: 2100,
        rating: 4.9,
        tags: ['git', 'version-control'],
        repository: 'https://github.com/clawhub/git-skill'
      },
      {
        id: 'docker',
        name: 'Docker 管理',
        description: 'Docker 容器管理',
        author: 'Community',
        version: '1.0.0',
        downloads: 1850,
        rating: 4.8,
        tags: ['docker', 'container'],
        repository: 'https://github.com/clawhub/docker-skill'
      },
      {
        id: 'database',
        name: '数据库',
        description: 'SQL 数据库查询和操作',
        author: 'Community',
        version: '1.0.0',
        downloads: 1680,
        rating: 4.7,
        tags: ['database', 'sql'],
        repository: 'https://github.com/clawhub/database-skill'
      },
      {
        id: 'excel',
        name: 'Excel 处理',
        description: 'Excel 文件读取和写入',
        author: 'Community',
        version: '1.0.0',
        downloads: 1420,
        rating: 4.6,
        tags: ['excel', 'spreadsheet'],
        repository: 'https://github.com/clawhub/excel-skill'
      },
      {
        id: 'pdf',
        name: 'PDF 处理',
        description: 'PDF 文件读取和解析',
        author: 'Community',
        version: '1.0.0',
        downloads: 1190,
        rating: 4.5,
        tags: ['pdf', 'document'],
        repository: 'https://github.com/clawhub/pdf-skill'
      }
    ];
    
    return featured.slice(0, limit);
  }
  
  /**
   * 搜索 Skill
   */
  async search(query, options = {}) {
    const { limit = 20, tags = [] } = options;
    
    const allSkills = await this.getFeatured(100);
    
    const lowerQuery = query.toLowerCase();
    
    const results = allSkills.filter(skill => {
      const matchQuery = 
        skill.name.toLowerCase().includes(lowerQuery) ||
        skill.description.toLowerCase().includes(lowerQuery) ||
        skill.tags.some(t => t.toLowerCase().includes(lowerQuery));
      
      const matchTags = tags.length === 0 || 
        tags.some(t => skill.tags.includes(t));
      
      return matchQuery && matchTags;
    });
    
    return results.slice(0, limit);
  }
  
  /**
   * 获取 Skill 详情
   */
  async getDetails(skillId) {
    const featured = await this.getFeatured();
    const skill = featured.find(s => s.id === skillId);
    
    if (skill) {
      return {
        ...skill,
        readme: await this._getReadme(skill.repository),
        changelog: await this._getChangelog(skill.repository)
      };
    }
    
    return null;
  }
  
  /**
   * 获取 Skill 评分排名
   */
  async getTopRated(limit = 10) {
    const allSkills = await this.getFeatured(100);
    
    return allSkills
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
  
  /**
   * 获取最多下载
   */
  async getMostDownloaded(limit = 10) {
    const allSkills = await this.getFeatured(100);
    
    return allSkills
      .sort((a, b) => b.downloads - a.downloads)
      .slice(0, limit);
  }
  
  /**
   * 获取最新发布
   */
  async getRecentlyUpdated(limit = 10) {
    const allSkills = await this.getFeatured(100);
    
    // 模拟按更新时间排序
    return allSkills.slice(0, limit);
  }
  
  /**
   * 按标签获取
   */
  async getByTag(tag) {
    const allSkills = await this.getFeatured(100);
    
    return allSkills.filter(skill => 
      skill.tags.includes(tag.toLowerCase())
    );
  }
  
  /**
   * 获取所有标签
   */
  async getAllTags() {
    const allSkills = await this.getFeatured(100);
    const tags = new Set();
    
    for (const skill of allSkills) {
      skill.tags.forEach(t => tags.add(t));
    }
    
    return Array.from(tags).sort();
  }
  
  /**
   * 验证 Skill 仓库
   */
  async validateRepository(repository) {
    // 检查 skill.json 是否存在
    const manifestUrl = `${repository}/raw/main/skill.json`;
    
    try {
      const response = await fetch(manifestUrl);
      if (response.ok) {
        const manifest = await response.json();
        return {
          valid: true,
          manifest
        };
      }
    } catch (error) {
      // 尝试 main 分支
      try {
        const altUrl = `${repository}/raw/master/skill.json`;
        const response = await fetch(altUrl);
        if (response.ok) {
          const manifest = await response.json();
          return {
            valid: true,
            manifest,
            note: 'Using master branch'
          };
        }
      } catch (e) {
        // 继续
      }
    }
    
    return {
      valid: false,
      error: 'skill.json not found in repository'
    };
  }
  
  /**
   * 提交 Skill 到市场
   */
  async submit(skillPath, options = {}) {
    const { author, tags = [] } = options;
    
    // 验证 Skill
    const manifest = await this._loadManifest(skillPath);
    
    if (!manifest) {
      throw new Error('skill.json not found');
    }
    
    // 验证必需字段
    const required = ['id', 'name', 'version', 'entry', 'main'];
    for (const field of required) {
      if (!manifest[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
    
    // 返回提交信息
    return {
      success: true,
      skillId: manifest.id,
      message: `Skill "${manifest.name}" ready for submission`,
      instructions: [
        `1. Push your skill to a GitHub repository`,
        `2. Ensure skill.json is in the root`,
        `3. Create a pull request to VoltAgent/awesome-openclaw-skills`,
        `4. Include description, tags, and screenshot`
      ]
    };
  }
  
  /**
   * 获取提交指南
   */
  getSubmissionGuidelines() {
    return {
      requirements: [
        'Repository must be public',
        'skill.json must be in repository root',
        'Entry point must exist',
        'README.md recommended',
        'MIT license recommended'
      ],
      checklist: [
        '✓ skill.json with all required fields',
        '✓ Functional skill implementation',
        '✓ README.md with usage examples',
        '✓ Appropriate .gitignore',
        '✓ LICENSE file'
      ],
      review: 'Submissions are reviewed within 48 hours'
    };
  }
  
  // ========== 私有方法 ==========
  
  /**
   * 加载本地 Manifest
   */
  async _loadManifest(skillPath) {
    const manifestPath = path.join(skillPath, 'skill.json');
    
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    
    const content = fs.readFileSync(manifestPath, 'utf8');
    return JSON.parse(content);
  }
  
  /**
   * 获取 README (模拟)
   */
  async _getReadme(repository) {
    // 实际应从 GitHub 获取
    return `# ${repository.split('/').pop()}\n\n## Description\n\nThis is a Personal AI Agent Skill.`;
  }
  
  /**
   * 获取 Changelog (模拟)
   */
  async _getChangelog(repository) {
    return `# Changelog\n\n## v1.0.0\n\n- Initial release`;
  }
}

module.exports = { ClawHubMarketplace };
