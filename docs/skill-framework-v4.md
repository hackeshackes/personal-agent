# Personal AI Agent - Skill Framework v4.0

> Skill 框架扩展规划 | 版本: v4.0 | 日期: 2026-02-06

---

## 一、概述

### 1.1 目标

扩展 Personal AI Agent 支持 **OpenClaw Skill 框架**，实现：
- ✅ 标准化 Skill 接口
- ✅ Skill 市场/安装系统
- ✅ 主流 Skill 即插即用
- ✅ Skill 依赖管理
- ✅ Skill 版本控制

### 1.2 参考项目

| 项目 | 特点 | 参考价值 |
|------|------|----------|
| **OpenClaw Skills** | 官方 Skill 框架 | ⭐⭐⭐⭐⭐ 直接参考 |
| **MCP (Anthropic)** | 模型上下文协议 | ⭐⭐⭐⭐⭐ 标准化接口 |
| **LangChain Tools** | 工具调用框架 | ⭐⭐⭐⭐ 架构参考 |
| **Claude Code Tools** | 开发者工具市场 | ⭐⭐⭐⭐ 生态参考 |

---

## 二、Skill 架构设计

### 2.1 目录结构

```
personal-agent/
├── skills/                      # Skill 根目录
│   ├── builtin/                # 内置 Skill
│   │   ├── market/            # 市场分析
│   │   ├── file/              # 文件管理
│   │   ├── calendar/          # 日程管理
│   │   ├── mail/              # 邮件管理
│   │   ├── search/            # 网页搜索
│   │   └── calculator/        # 计算器
│   │
│   ├── community/              # 社区 Skill (可选安装)
│   │   ├── weather/
│   │   ├── translation/
│   │   ├── news/
│   │   ├── stocks/
│   │   ├── code/
│   │   ├── database/
│   │   └── ...
│   │
│   ├── custom/                 # 用户自定义 Skill
│   │
│   ├── registry.json           # Skill 注册表
│   └── manifest.json          # 框架清单
│
├── src/
│   ├── skill/                 # Skill 核心框架
│   │   ├── loader.js          # Skill 加载器
│   │   ├── registry.js        # 注册表管理
│   │   ├── executor.js        # Skill 执行器
│   │   ├── validator.js       # Schema 验证
│   │   ├── sandbox.js         # 沙箱隔离
│   │   └── manager.js         # 安装/卸载/更新
│   │
│   └── ...
│
└── skills.json               # 用户已安装 Skill 列表
```

### 2.2 Skill 标准接口

每个 Skill 必须遵循以下接口规范：

```javascript
// skill.json - Skill 元数据
{
  "id": "market",
  "name": "市场分析",
  "version": "1.0.0",
  "description": "提供股票、加密货币、黄金等市场数据分析",
  "author": "Personal AI Agent Team",
  "license": "MIT",
  
  "entry": "index.js",          # 入口文件
  "main": "MarketSkill",        # 主类名
  
  "permissions": [              # 权限要求
    "http.request",
    "file.read"
  ],
  
  "dependencies": {              # NPM 依赖
    "axios": "^1.6.0"
  },
  
  "engines": {                   # 环境要求
    "node": ">=18.0.0"
  },
  
  "keywords": ["finance", "stock", "crypto"],
  "repository": "https://github.com/...",
  "homepage": "https://..."
}
```

```javascript
// index.js - Skill 实现
class MarketSkill {
  constructor(config) {
    this.name = 'market';
    this.version = '1.0.0';
    this.config = config || {};
  }
  
  // Skill 元信息
  static metadata = {
    name: '市场分析',
    description: '提供股票、加密货币、黄金等市场数据分析',
    parameters: {
      type: 'object',
      properties: {
        symbol: { 
          type: 'string', 
          description: '股票代码，如 AAPL, BTCUSDT' 
        },
        action: {
          type: 'string',
          enum: ['quote', 'history', 'analyze'],
          description: '操作类型'
        }
      },
      required: ['symbol', 'action']
    }
  };
  
  // 执行 Skill
  async execute(params, context) {
    const { symbol, action } = params;
    
    switch (action) {
      case 'quote':
        return await this.getQuote(symbol);
      case 'history':
        return await this.getHistory(symbol);
      case 'analyze':
        return await this.analyze(symbol);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }
  
  // 工具函数
  async getQuote(symbol) {
    // 实现逻辑
    return { price: 150.00, change: 2.5 };
  }
  
  // 健康检查
  async healthCheck() {
    return { status: 'ok', latency: 50 };
  }
}

module.exports = MarketSkill;
```

### 2.3 MCP 协议兼容

支持 MCP (Model Context Protocol) 标准接口：

```javascript
// MCP Tool Format
{
  "name": "market_get_quote",
  "description": "获取股票/加密货币实时价格",
  "inputSchema": {
    "type": "object",
    "properties": {
      "symbol": {
        "type": "string",
        "description": "交易对代码，如 BTCUSDT, 9988.HK"
      }
    },
    "required": ["symbol"]
  }
}
```

---

## 三、核心组件

### 3.1 Skill Loader

```javascript
// src/skill/loader.js
const path = require('path');
const fs = require('fs');

class SkillLoader {
  constructor() {
    this.skills = new Map();
  }
  
  /**
   * 加载 Skill
   */
  async load(skillPath) {
    const manifest = await this._loadManifest(skillPath);
    const SkillClass = await this._loadEntry(skillPath, manifest);
    
    const skill = new SkillClass(manifest.config);
    this.skills.set(manifest.id, {
      manifest,
      instance: skill,
      path: skillPath
    });
    
    return skill;
  }
  
  /**
   * 卸载 Skill
   */
  async unload(skillId) {
    const skill = this.skills.get(skillId);
    if (skill && skill.instance.destroy) {
      await skill.instance.destroy();
    }
    this.skills.delete(skillId);
  }
  
  /**
   * 列出所有已加载的 Skill
   */
  list() {
    return Array.from(this.skills.entries()).map(([id, skill]) => ({
      id,
      name: skill.manifest.name,
      version: skill.manifest.version,
      status: 'loaded'
    }));
  }
  
  /**
   * 获取 Skill 实例
   */
  get(skillId) {
    return this.skills.get(skillId)?.instance;
  }
  
  async _loadManifest(skillPath) {
    const manifestPath = path.join(skillPath, 'skill.json');
    const content = await fs.promises.readFile(manifestPath, 'utf8');
    return JSON.parse(content);
  }
  
  async _loadEntry(skillPath, manifest) {
    const entryPath = path.join(skillPath, manifest.entry);
    const module = require(entryPath);
    return module[manifest.main] || module.default;
  }
}

module.exports = { SkillLoader };
```

### 3.2 Skill Registry

```javascript
// src/skill/registry.js
const fs = require('fs');
const path = require('path');

class SkillRegistry {
  constructor(registryFile) {
    this.registryFile = registryFile;
    this.registered = new Map(); // id -> metadata
    this._loadRegistry();
  }
  
  /**
   * 注册 Skill
   */
  register(manifest) {
    this.registered.set(manifest.id, {
      id: manifest.id,
      name: manifest.name,
      version: manifest.version,
      description: manifest.description,
      author: manifest.author,
      keywords: manifest.keywords || [],
      installed: false,
      installPath: null
    });
    this._saveRegistry();
  }
  
  /**
   * 取消注册
   */
  unregister(skillId) {
    this.registered.delete(skillId);
    this._saveRegistry();
  }
  
  /**
   * 搜索 Skill
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.registered.values())
      .filter(s => 
        s.name.toLowerCase().includes(lowerQuery) ||
        s.keywords.some(k => k.toLowerCase().includes(lowerQuery))
      );
  }
  
  /**
   * 获取所有已注册 Skill
   */
  list() {
    return Array.from(this.registered.values());
  }
  
  _loadRegistry() {
    if (fs.existsSync(this.registryFile)) {
      const data = JSON.parse(fs.readFileSync(this.registryFile, 'utf8'));
      data.forEach(s => this.registered.set(s.id, s));
    }
  }
  
  _saveRegistry() {
    fs.writeFileSync(
      this.registryFile,
      JSON.stringify(Array.from(this.registered.values()), null, 2)
    );
  }
}

module.exports = { SkillRegistry };
```

### 3.3 Skill Manager

```javascript
// src/skill/manager.js
const { SkillLoader } = require('./loader');
const { SkillRegistry } = require('./registry');
const { spawn } = require('child_process');
const path = require('path');

class SkillManager {
  constructor(options) {
    this.skillsDir = options.skillsDir || './skills';
    this.registryFile = options.registryFile || './skills/registry.json';
    
    this.loader = new SkillLoader();
    this.registry = new SkillRegistry(this.registryFile);
    
    this.installedSkills = new Map();
  }
  
  /**
   * 安装 Skill
   */
  async install(skillId, source) {
    const skillPath = path.join(this.skillsDir, 'community', skillId);
    
    // 1. 下载/复制 Skill
    await this._downloadSkill(source, skillPath);
    
    // 2. 安装依赖
    await this._installDependencies(skillPath);
    
    // 3. 加载 Skill
    await this.loader.load(skillPath);
    
    // 4. 注册
    const manifest = await this._loadManifest(skillPath);
    this.registry.register(manifest);
    
    return { success: true, skillId };
  }
  
  /**
   * 卸载 Skill
   */
  async uninstall(skillId) {
    // 1. 卸载
    await this.loader.unload(skillId);
    
    // 2. 从注册表移除
    this.registry.unregister(skillId);
    
    // 3. 删除文件 (可选)
    const skillPath = path.join(this.skillsDir, 'community', skillId);
    await this._deletePath(skillPath);
    
    return { success: true, skillId };
  }
  
  /**
   * 更新 Skill
   */
  async update(skillId) {
    const skill = this.installedSkills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not installed: ${skillId}`);
    }
    
    // 1. 备份
    const backupPath = await this._backupSkill(skill.path);
    
    try {
      // 2. 更新
      await this.uninstall(skillId);
      await this.install(skillId, skill.manifest.repository);
      
      return { success: true, backupPath };
    } catch (error) {
      // 3. 回滚
      await this._restoreSkill(backupPath);
      throw error;
    }
  }
  
  /**
   * 执行 Skill
   */
  async execute(skillId, params, context) {
    const skill = this.loader.get(skillId);
    if (!skill) {
      throw new Error(`Skill not loaded: ${skillId}`);
    }
    
    return await skill.execute(params, context);
  }
  
  async _downloadSkill(source, targetPath) {
    // 从 GitHub/URL 下载或从本地复制
    if (source.startsWith('github:')) {
      const [owner, repo, path] = source.replace('github:', '').split('/');
      await this._cloneGitHub(owner, repo, path, targetPath);
    } else {
      // 本地复制
      await this._copyPath(source, targetPath);
    }
  }
  
  async _installDependencies(skillPath) {
    const packageJson = path.join(skillPath, 'package.json');
    if (fs.existsSync(packageJson)) {
      await this._runCommand('npm', ['ci'], { cwd: skillPath });
    }
  }
  
  async _cloneGitHub(owner, repo, subpath, targetPath) {
    const { execSync } = require('child_process');
    const tempPath = `/tmp/${repo}-${Date.now()}`;
    
    execSync(`git clone https://github.com/${owner}/${repo}.git ${tempPath}`);
    
    if (subpath) {
      await this._copyPath(path.join(tempPath, subpath), targetPath);
    } else {
      await this._copyPath(tempPath, targetPath);
    }
    
    execSync(`rm -rf ${tempPath}`);
  }
  
  async _runCommand(cmd, args, options) {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, options);
      
      proc.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Command failed: ${cmd} ${args.join(' ')}`));
      });
    });
  }
  
  async _copyPath(src, dest) {
    const { execSync } = require('child_process');
    execSync(`cp -r "${src}" "${dest}"`);
  }
  
  async _deletePath(p) {
    const { execSync } = require('child_process');
    execSync(`rm -rf "${p}"`);
  }
}

module.exports = { SkillManager };
```

---

## 四、推荐 Skill 列表

### 4.1 基础工具类

| Skill | 功能 | 来源 |
|-------|------|------|
| `calculator` | 数学计算 | 内置 |
| `search` | 网页搜索 | 内置 |
| `weather` | 天气预报 | MCP/社区 |
| `translation` | 翻译 | MCP/社区 |
| `news` | 新闻摘要 | 社区 |

### 4.2 开发工具类

| Skill | 功能 | 来源 |
|-------|------|------|
| `git` | Git 操作 | MCP |
| `docker` | Docker 管理 | MCP |
| `database` | 数据库操作 | MCP |
| `code` | 代码生成 | MCP |
| `filesystem` | 文件系统 | MCP |

### 4.3 数据分析类

| Skill | 功能 | 来源 |
|-------|------|------|
| `market` | 市场分析 | 内置 |
| `stocks` | 股票数据 | MCP |
| `crypto` | 加密货币 | MCP |
| `excel` | Excel 处理 | MCP |
| `pdf` | PDF 处理 | MCP |

### 4.4 生活服务类

| Skill | 功能 | 来源 |
|-------|------|------|
| `calendar` | 日历管理 | 内置 |
| `mail` | 邮件管理 | 内置 |
| `notes` | 笔记管理 | 社区 |
| `reminders` | 提醒事项 | 社区 |
| `contacts` | 联系人 | 社区 |

---

## 五、OpenClaw Skill 集成

### 5.1 OpenClaw Skill 格式兼容

```javascript
// OpenClaw Skill 适配器
class OpenClawAdapter {
  constructor(openclawSkill) {
    this.skill = openclawSkill;
  }
  
  // 转换为本地格式
  toLocalManifest() {
    return {
      id: this.skill.id,
      name: this.skill.name,
      version: this.skill.version,
      description: this.skill.description,
      entry: this.skill.main || 'index.js',
      main: this.skill.name,
      permissions: this.skill.permissions || [],
      dependencies: this.skill.dependencies || {}
    };
  }
  
  // 转换为 MCP 格式
  toMCPTool() {
    return {
      name: `${this.skill.id}_${this.skill.actions?.[0] || 'execute'}`,
      description: this.skill.description,
      inputSchema: {
        type: 'object',
        properties: this.skill.parameters || {}
      }
    };
  }
}
```

### 5.2 ClawHub Skill 市场

```
# 推荐的 ClawHub Skill (https://clawhub.com)

# 生产力
claw-hub/mcp-calculator
claw-hub/mcp-search
claw-hub/mcp-weather

# 开发工具
claw-hub/mcp-git
claw-hub/mcp-docker
claw-hub/mcp-database

# 数据处理
claw-hub/mcp-excel
claw-hub/mcp-pdf
claw-hub/mcp-csv

# AI/ML
claw-hub/mcp-openai
claw-hub/mcp-langchain
claw-hub/mcp-ollama
```

---

## 六、实施路线图

### Phase 1: 核心框架 (W1-2)

- [ ] Skill 接口规范定义
- [ ] Skill Loader 实现
- [ ] Skill Registry 实现
- [ ] Skill Manager 实现
- [ ] 内置 Skill 迁移

### Phase 2: 安装系统 (W3-4)

- [ ] GitHub 集成
- [ ] NPM 依赖管理
- [ ] 版本控制
- [ ] 安装/卸载 CLI
- [ ] 沙箱隔离

### Phase 3: 市场集成 (W5-6)

- [ ] ClawHub 集成
- [ ] MCP 协议兼容
- [ ] Skill 搜索
- [ ] 自动更新
- [ ] 社区贡献指南

### Phase 4: 生态完善 (W7-8)

- [ ] 20+ 热门 Skill 打包
- [ ] Skill 开发模板
- [ ] 文档完善
- [ ] 测试框架
- [ ] CI/CD 流水线

---

## 七、示例 Skill

### 7.1 天气 Skill

```javascript
// skills/community/weather/index.js
class WeatherSkill {
  constructor(config) {
    this.apiKey = config?.apiKey || process.env.WEATHER_API_KEY;
  }
  
  static metadata = {
    name: '天气预报',
    description: '获取全球城市天气预报',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称' },
        days: { type: 'integer', description: '预报天数(1-7)' }
      },
      required: ['city']
    }
  };
  
  async execute(params) {
    const { city, days = 3 } = params;
    const data = await this._fetchWeather(city, days);
    return this._formatResponse(data);
  }
  
  async _fetchWeather(city, days) {
    const axios = require('axios');
    const response = await axios.get(
      `https://api.weatherapi.com/v1/forecast.json`,
      {
        params: {
          key: this.apiKey,
          q: city,
          days,
          aqi: 'no',
          alerts: 'no'
        }
      }
    );
    return response.data;
  }
  
  _formatResponse(data) {
    return {
      location: data.location.name,
      current: {
        temp: data.current.temp_c,
        condition: data.current.condition.text
      },
      forecast: data.forecast.forecastday.map(day => ({
        date: day.date,
        high: day.day.maxtemp_c,
        low: day.day.mintemp_c,
        condition: day.day.condition.text
      }))
    };
  }
}

module.exports = WeatherSkill;
```

```json
// skills/community/weather/skill.json
{
  "id": "weather",
  "name": "天气预报",
  "version": "1.0.0",
  "description": "获取全球城市天气预报",
  "entry": "index.js",
  "main": "WeatherSkill",
  "permissions": ["http.request"],
  "dependencies": {
    "axios": "^1.6.0"
  },
  "repository": "https://github.com/personal-agent/weather-skill",
  "keywords": ["weather", "forecast", "mcp"]
}
```

---

## 八、配置

### 8.1 用户配置

```json
// skills.json
{
  "version": "1.0.0",
  "skills": {
    "builtin": {
      "market": "1.0.0",
      "file": "1.0.0",
      "calendar": "1.0.0",
      "mail": "1.0.0"
    },
    "community": {
      "weather": {
        "version": "1.0.0",
        "source": "github:personal-agent/weather-skill",
        "installed": "2026-02-06"
      },
      "translation": {
        "version": "1.0.0",
        "source": "github:personal-agent/translation-skill",
        "installed": "2026-02-06"
      }
    },
    "custom": {}
  },
  "defaults": {
    "autoUpdate": true,
    "sandboxEnabled": false
  }
}
```

### 8.2 环境变量

```bash
# .env
SKILLS_DIR=./skills
SKILLS_REGISTRY=./skills/registry.json
WEATHER_API_KEY=xxx
TRANSLATION_API_KEY=xxx
```

---

## 九、性能指标

| 指标 | 目标 |
|------|------|
| Skill 加载时间 | < 500ms |
| Skill 执行延迟 | < 100ms |
| 并发 Skill 数 | > 20 |
| 内存开销/Skill | < 10MB |
| 安装成功率 | > 99% |

---

## 十、总结

### 价值

- 🔌 **即插即用**: 标准化接口，快速集成
- 📦 **丰富生态**: 接入 ClawHub/MCP 生态
- 🛡️ **安全隔离**: 沙箱机制保障系统安全
- 🔄 **自动更新**: 保持最新功能和安全修复

### 下一步

1. 实现 Skill 核心框架
2. 迁移内置工具为 Skill 格式
3. 集成 5-10 个热门社区 Skill
4. 创建 Skill 开发文档

---

*文档版本: v4.0*
*最后更新: 2026-02-06*
