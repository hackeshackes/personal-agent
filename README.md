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
│   └── package.json
├── src/skill/            # ⭐ Skill 框架核心
│   ├── index.js         # 统一入口
│   ├── interfaces.js     # Skill 基类
│   ├── loader.js        # Skill 加载器
│   ├── registry.js      # 注册表
│   ├── manager.js       # 安装管理
│   ├── sandbox.js       # 沙箱隔离
│   ├── mcp-adapter.js   # MCP 协议适配 ⭐
│   ├── marketplace.js    # ClawHub 市场 ⭐
│   └── cli.js           # CLI 工具 ⭐
├── skills/              # ⭐ Skill 目录
│   ├── builtin/         # 内置 Skill
│   │   ├── market/    # 市场分析
│   │   └── calculator/ # 计算器
│   └── community/       # 社区 Skill ⭐
│       ├── weather/   # 天气预报
│       ├── search/    # 网页搜索
│       ├── translation/ # 翻译
│       ├── git/       # Git 操作 ⭐
│       ├── docker/    # Docker 管理 ⭐
│       └── database/   # 数据库 ⭐
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
| **RAG** | ✅ | 文档向量 + 语义搜索 |
| **记忆** | ✅ | 短期/长期/情景/语义 |
| **Skill 框架** | ✅ | **完整实现** |

## 🧩 Skill 框架 v4.0 (完整实现!)

### ✅ Phase 1-3 已完成

| Phase | 组件 | 文件 | 功能 |
|-------|------|------|------|
| **P1** | 核心框架 | `loader/registry/manager` | 加载/注册/安装 |
| **P2** | 沙箱/社区 | `sandbox.js` | 进程隔离 |
| **P3** | **MCP/市场/CLI** | `mcp-adapter/marketplace/cli` | 生态集成 ⭐ |

### 📦 已包含 Skill (8个)

| Skill | 功能 | 类型 | 来源 |
|-------|------|------|------|
| **market** | 港股/美股/加密/黄金 | builtin | 内置 |
| **calculator** | 数学/货币/金融 | builtin | 内置 |
| **weather** | 天气预报/7天 | community | ⭐新增 |
| **search** | 网页搜索 | community | ⭐新增 |
| **translation** | 多语言翻译/检测 | community | ⭐新增 |
| **git** | Git 操作 | community | ⭐新增 |
| **docker** | Docker 容器管理 | community | ⭐新增 |
| **database** | SQL 数据库查询 | community | ⭐新增 |

### 🔗 CLI 命令行

```bash
# 列出所有 Skill
skill list

# 搜索市场
skill search weather

# 安装 Skill
skill install weather

# 卸载 Skill
skill uninstall weather

# 执行 Skill
skill exec calculator calculate expression="100*1.1"

# 查看状态
skill status

# 健康检查
skill health
```

### 🤖 MCP 协议兼容

```javascript
// Skill 自动转换为 MCP Tool
const mcpTools = framework.getMCPTools();

// MCP 工具调用
await framework.callMCTool('weather_execute', {
  city: '北京',
  action: 'current'
});
```

### 🏪 ClawHub 市场集成

```javascript
// 浏览精选 Skill
const featured = await marketplace.getFeatured();

// 搜索 Skill
const results = await marketplace.search('weather');

// 获取详情
const details = await marketplace.getDetails('weather');
```

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
Week 17-18: ✅ MCP 协议 + 市场集成 ⭐
Week 19-20: 🔄 文档完善 + 收尾
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
