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
│   │       └── elevenlabs.js
│   └── package.json
├── apps/mobile/          # Flutter APP
│   └── lib/
│       ├── main.dart
│       ├── services/
│       ├── screens/
│       └── models/
├── tests/                # 测试套件
├── docs/                 # 文档
├── deployments/          # 部署配置
│   └── docker/
└── README.md
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

## 📈 开发进度

```
Week 1-2: ✅ Gateway + APP 初始化
Week 3-4: ✅ WebSocket 通信 + 中文 NLU
Week 5-6: ✅ 语音唤醒/输入/回复
Week 7-8: ✅ 核心工具
Week 9-10: ✅ RAG 知识库 + 记忆系统
Week 11-12: 🔄 优化 + 测试 + 发布
```

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
