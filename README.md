# Personal AI Agent 🎯

> 基于 OpenClaw 架构的中文智能体，支持 iOS/Android APP 随时随地语音/文字沟通

[![GitHub stars](https://img.shields.io/github/stars/hackeshackes/personal-agent)](https://github.com/hackeshackes/personal-agent/stargazers)
[![GitHub license](https://img.shields.io/github/license/hackeshackes/personal-agent)](https://github.com/hackeshackes/personal-agent/blob/main/LICENSE)

## ✨ 特性

- 🗣️ **语音沟通** - 语音唤醒、语音输入、语音回复
- 💬 **随时随地** - iOS/Android APP 实时通信
- 🇨🇳 **中文优化** - 中文 NLP、中文语音、中文知识库
- 🔒 **隐私保护** - 本地处理、本地存储
- 🔌 **工具丰富** - 市场/文件/日历/邮件全能
- 🧩 **Skill 框架** - 可扩展插件系统

## 🚀 快速开始

### Docker 部署 (推荐)

```bash
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent/deployments/docker
docker-compose up -d
```

### 手动部署

```bash
# Gateway
cd gateway
npm install
npm start

# APP
cd apps/mobile
flutter run
```

## 📁 项目结构

```
personal-agent/
├── gateway/               # Gateway 控制平面
│   ├── src/
│   │   ├── server.js     # 主服务器
│   │   ├── agent.py      # Python 代理
│   │   ├── handlers/      # 消息处理器
│   │   └── services/      # 核心服务
│   │       ├── session.js
│   │       ├── node.js
│   │       ├── cron.js
│   │       ├── tool.js
│   │       ├── nlu.js
│   │       ├── market.js
│   │       ├── file.js
│   │       ├── calendar.js
│   │       ├── mail.js
│   │       ├── rag.js
│   │       ├── memory.js
│   │       ├── wakeword.js
│   │       ├── whisper.js
│   │       ├── elevenlabs.js
│   │       └── performance.js
│   └── package.json
├── src/skill/            # ⭐ Skill 框架核心
│   ├── index.js         # 统一入口
│   ├── interfaces.js     # Skill 基类
│   ├── loader.js        # Skill 加载器
│   ├── registry.js      # 注册表
│   ├── manager.js       # 安装管理
│   └── sandbox.js       # 沙箱隔离 ⭐
├── skills/              # ⭐ Skill 目录
│   ├── builtin/         # 内置 Skill
│   │   ├── market/     # 市场分析 ⭐
│   │   └── calculator/ # 计算器 ⭐
│   ├── community/       # 社区 Skill ⭐
│   │   ├── weather/   # 天气预报
│   │   ├── search/    # 网页搜索
│   │   └── translation/ # 翻译
│   └── custom/          # 自定义 Skill
├── skills.json          # Skill 配置
├── apps/mobile/          # Flutter APP
│   └── lib/
├── tests/               # 测试套件
├── docs/                # 文档
│   └── skill-framework-v4.md
└── deployments/         # 部署配置
    └── docker/
```

## 📊 功能矩阵

| 模块 | 状态 | 功能 |
|------|------|------|
| **Gateway** | ✅ | WebSocket 控制平面 |
| **APP** | ✅ | Flutter iOS/Android |
| **中文 NLU** | ✅ | jieba 分词 + 意图分类 |
| **语音** | ✅ | Whisper ASR + ElevenLabs TTS |
| **市场** | ✅ | 港股/美股/加密/黄金 |
| **文件** | ✅ | 列表/读写/搜索 |
| **日历** | ✅ | 事件管理/ICS |
| **邮件** | ✅ | IMAP/SMTP |
| **RAG** | ✅ | 文档向量 + 语义搜索 |
| **记忆** | ✅ | 短期/长期/情景/语义 |
| **测试** | ✅ | 45+ 测试用例 |
| **Docker** | ✅ | 生产部署 |
| **Skill 框架** | ✅ | 完整实现 |

## 🧩 Skill 框架 v4.0 (已实现!)

### ✅ 已实现组件

| 组件 | 文件 | 功能 |
|------|------|------|
| **接口定义** | `interfaces.js` | Skill 基类、类型枚举、权限 |
| **加载器** | `loader.js` | 加载/卸载/执行/批量 |
| **注册表** | `registry.js` | 元数据管理/搜索/分类 |
| **管理器** | `manager.js` | GitHub 安装/卸载/更新 |
| **沙箱** | `sandbox.js` | 进程隔离/超时控制 ⭐ |

### 📦 已包含 Skill

| Skill | 功能 | 类型 | 来源 |
|-------|------|------|------|
| **market** | 港股/美股/加密/黄金 | builtin | 内置 |
| **calculator** | 数学/货币/金融计算 | builtin | 内置 |
| **weather** | 天气预报/7天预报 | community | 社区 ⭐ |
| **search** | 网页搜索 | community | 社区 ⭐ |
| **translation** | 多语言翻译/检测 | community | 社区 ⭐ |

### 🚀 使用示例

```javascript
// 初始化框架
const { SkillFramework } = require('./src/skill');
const framework = await SkillFramework.init();

// 执行 Skill
await framework.execute('market', {
  action: 'quote',
  symbol: '9988.HK',
  market: 'hk'
});

// 搜索 Skill
framework.search('market');

// 安装新 Skill
await framework.install('weather', 'github:user/weather-skill');

// 沙箱执行 (安全)
await framework.sandboxExecute('calculator', 'calculate', { expression: '2+2' });
```

### 📖 Skill 开发

```javascript
// skills/community/weather/index.js
class WeatherSkill {
  static metadata = {
    id: 'weather',
    name: '天气预报',
    description: '获取全球城市天气预报',
    parameters: {
      type: 'object',
      properties: {
        city: { type: 'string', description: '城市名称' }
      }
    }
  };
  
  async execute(params) {
    const { city } = params;
    // 实现逻辑
    return { temperature: 25, condition: '晴朗' };
  }
}

module.exports = WeatherSkill;
```

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| **Gateway** | Node.js + WebSocket |
| **Agent** | Python + LangChain |
| **LLM** | Ollama (本地) + OpenAI API |
| **APP** | Flutter (iOS/Android) |
| **数据库** | SQLite + Redis + 文件存储 |
| **NLP** | jieba + Natural |
| **语音** | Whisper + ElevenLabs |
| **Skill** | OpenClaw 兼容 + MCP |

## 📈 开发进度

```
Week 1-2: ✅ Gateway + APP 初始化
Week 3-4: ✅ WebSocket 通信 + 中文 NLU
Week 5-6: ✅ 语音唤醒/输入/回复
Week 7-8: ✅ 核心工具
Week 9-10: ✅ RAG 知识库 + 记忆系统
Week 11-12: ✅ 优化 + 测试 + 发布
Week 13-14: ✅ Skill 框架核心
Week 15-16: ✅ 安装/更新系统 + 沙箱 ⭐
Week 17-20: 🔄 生态完善
```

### 📊 统计数据

| 指标 | 数值 |
|------|------|
| 框架核心文件 | 6 |
| 内置 Skill | 2 |
| 社区 Skill | 3 |
| **总 Skill** | **5** |
| 代码行数 | ~8,000 |

## 💰 成本估算

| 项目 | 月成本 |
|------|--------|
| OpenAI API | ¥0-200 |
| ElevenLabs API | ¥0-100 |
| **合计** | **¥0-300/月** |

## 📱 APP 预览

```
┌─────────────────────────────────┐
│     Personal AI Agent 🐙        │
├─────────────────────────────────┤
│                                 │
│         ┌─────────┐             │
│         │   🐙    │             │
│         │  小智   │             │
│         └─────────┘             │
│                                 │
│    [🎤 语音]  [💬 对话]         │
│                                 │
│    📱 连接: 已连接 ✅           │
└─────────────────────────────────┘
```

## 🤝 贡献

1. Fork 本仓库
2. 创建分支 (`git checkout -b feature/xxx`)
3. 提交更改 (`git commit -am 'Add xxx'`)
4. 推送到分支 (`git push origin feature/xxx`)
5. 创建 Pull Request

## 📄 许可

MIT License - 详见 LICENSE 文件

## 🙏 基于

本项目基于 [OpenClaw](https://github.com/openclaw/openclaw) 架构设计，感谢开源！

---

**Personal AI Agent** - 您的专属中文AI助理 🐙

**GitHub**: https://github.com/hackeshackes/personal-agent
