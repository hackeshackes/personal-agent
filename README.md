# Personal AI Agent 🎯

> 基于 OpenClaw 架构的中文智能体，支持 iOS/Android APP 随时随地语音/文字沟通

[![GitHub stars](https://img.shields.io/github/stars/hackeshackes/personal-agent)](https://github.com/hackeshackes/personal-agent/stargazers)
[![GitHub license](https://img.shields.io/github/license/hackeshackes/personal-agent)](https://github.com/hackeshackes/personal-agent/blob/main/LICENSE)

## 📋 目录

- [特性](#特性)
- [快速开始](#快速开始)
- [文档](#文档)
- [功能说明](#功能说明)
- [Skill 框架](#skill-框架)
- [命令行](#命令行)
- [开发进度](#开发进度)
- [贡献](#贡献)
- [许可](#许可)

## ✨ 特性

- 🗣️ **语音沟通** - 语音唤醒、语音输入、语音回复
- 💬 **随时随地** - iOS/Android APP 实时通信
- 🇨🇳 **中文优化** - 中文 NLP、中文语音、中文知识库
- 🔒 **隐私保护** - 本地处理、本地存储
- 🔌 **工具丰富** - 8+ 可扩展 Skill 插件
- 🧩 **Skill 框架** - OpenClaw 兼容 + MCP 协议

## 🚀 快速开始

### Docker 部署 (推荐)

```bash
# 克隆
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# 配置
cp .env.example .env
# 编辑 .env 添加 API Keys (可选)

# 启动
cd deployments/docker
docker-compose up -d

# 验证
curl http://localhost:18789/api/status
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

## 📚 文档

| 文档 | 描述 |
|------|------|
| [安装指南](docs/installation.md) | 完整安装步骤 |
| [依赖说明](docs/dependencies.md) | 系统依赖配置 |
| [功能说明](docs/features.md) | 核心功能详解 |
| [命令行](docs/cli.md) | CLI 使用指南 |
| [Skill 框架](docs/skill-framework-v4.md) | 开发者文档 |

## 📊 功能说明

### Gateway 控制平面

```javascript
// WebSocket 连接
const ws = new WebSocket('ws://127.0.0.1:18789/ws');

// 发送消息
ws.send(JSON.stringify({
  type: 'chat.send',
  content: '你好，小智'
}));
```

**HTTP API:**

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/status` | GET | 服务状态 |
| `/api/pairing` | GET | 配对码 |
| `/api/sessions` | GET | 会话列表 |
| `/api/nodes` | GET | 节点列表 |

### Skill 框架

支持 8 个内置和社区 Skill:

| Skill | 功能 | 使用 |
|-------|------|------|
| `market` | 市场分析 | `skill exec market quote symbol=9988.HK` |
| `calculator` | 计算器 | `skill exec calculator calculate expression="100*1.1"` |
| `weather` | 天气预报 | `skill exec weather forecast city=北京` |
| `search` | 网页搜索 | `skill exec search query="AI news"` |
| `translation` | 翻译 | `skill exec translation translate text=Hello to=zh` |
| `git` | Git 操作 | `skill exec git action=status repo=./` |
| `docker` | Docker 管理 | `skill exec docker action=ps` |
| `database` | 数据库查询 | `skill exec database action=query query="SELECT *"` |

### CLI 命令

```bash
# 列出 Skill
skill list

# 搜索
skill search weather

# 安装
skill install weather

# 执行
skill exec market quote symbol=9988.HK

# 健康检查
skill health
```

## 📁 项目结构

```
personal-agent/
├── gateway/               # Gateway 控制平面
│   ├── src/
│   │   ├── server.js     # WebSocket 服务器
│   │   ├── agent.py      # Python Agent
│   │   ├── handlers/      # 消息处理器
│   │   └── services/      # 核心服务
│   └── package.json
├── src/skill/            # ⭐ Skill 框架
│   ├── index.js         # 统一入口
│   ├── interfaces.js     # Skill 基类
│   ├── loader.js        # Skill 加载器
│   ├── registry.js      # 注册表
│   ├── manager.js       # 安装管理
│   ├── sandbox.js       # 沙箱隔离
│   ├── mcp-adapter.js   # MCP 协议
│   ├── marketplace.js    # ClawHub 市场
│   └── cli.js           # CLI 工具
├── skills/              # ⭐ Skill 目录
│   ├── builtin/         # 内置 (2个)
│   └── community/       # 社区 (6个)
├── apps/mobile/          # Flutter APP
├── docs/                # 文档
│   ├── installation.md  # 安装指南
│   ├── dependencies.md  # 依赖说明
│   ├── features.md     # 功能说明
│   ├── cli.md          # 命令行
│   └── skill-framework-v4.md
├── deployments/         # 部署配置
│   └── docker/
└── README.md
```

## 🧩 Skill 框架 v4.0

### 架构

```
┌─────────────────────────────────────────┐
│           Personal AI Agent              │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │           Gateway               │   │
│  │  • WebSocket 控制平面           │   │
│  │  • HTTP API                   │   │
│  │  • 配对系统                   │   │
│  └─────────────────────────────────┘   │
│                  │                     │
│  ┌─────────────────────────────────┐   │
│  │        Skill Framework         │   │
│  │  • Loader  • Registry         │   │
│  │  • Manager  • Sandbox         │   │
│  │  • MCP Adapter • Marketplace │   │
│  └─────────────────────────────────┘   │
│                  │                     │
│  ┌─────────────────────────────────┐   │
│  │           Skills               │   │
│  │  builtin | community | custom │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### 开发 Skill

```javascript
// skills/community/my-skill/index.js
class MySkill {
  static metadata = {
    id: 'my-skill',
    name: '我的技能',
    description: '技能描述',
    parameters: {
      type: 'object',
      properties: {
        input: { type: 'string', description: '输入' }
      }
    }
  };
  
  async execute(params) {
    // 实现逻辑
    return { result: '处理结果' };
  }
}

module.exports = MySkill;
```

```json
// skills/community/my-skill/skill.json
{
  "id": "my-skill",
  "name": "我的技能",
  "version": "1.0.0",
  "entry": "index.js",
  "main": "MySkill"
}
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
Week 15-16: ✅ 安装/更新系统 + 沙箱
Week 17-18: ✅ MCP 协议 + 市场集成
Week 19-20: ✅ 文档完善 ⭐
```

### 📊 统计数据

| 指标 | 数值 |
|------|------|
| 框架核心文件 | 9 |
| 内置 Skill | 2 |
| 社区 Skill | 6 |
| **总 Skill** | **8** |
| 代码行数 | **~15,000** |

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

1. **开发 Skill**
   - 参考 `skills/community/` 模板
   - 遵循 Skill 接口规范
   - 提交 PR 到社区

2. **文档改进**
   - 完善 README
   - 补充示例代码
   - 翻译文档

3. **Bug 反馈**
   - GitHub Issues
   - 详细描述复现步骤

## 📄 许可

MIT License - 详见 LICENSE 文件

## 🙏 基于

本项目基于 [OpenClaw](https://github.com/openclaw/openclaw) 架构设计，感谢开源！

---

**Personal AI Agent** - 您的专属中文AI助理 🐙

**GitHub**: https://github.com/hackeshackes/personal-agent

**文档**: https://github.com/hackeshackes/personal-agent/tree/main/docs
