# Personal AI Agent

> 基于 OpenClaw 架构的中文智能体，支持 iOS/Android APP 随时随地语音/文字沟通

## 📖 简介

Personal AI Agent 是一个全能的个人AI助理，参考 OpenClaw 架构设计，支持：

- 🗣️ **语音沟通**: 语音唤醒、语音输入、语音回复
- 💬 **随时随地**: iOS/Android APP 实时通信
- 📊 **智能任务**: 文件管理、金融分析、日程管理、邮件处理
- 🇨🇳 **中文优化**: 中文NLP、中文语音、中文知识库

## 🏗️ 架构（参考 OpenClaw）

```
用户 (iMessage/微信/APP) 
    │
    ▼
Gateway (控制平面)
    │
    ▼
Agent Orchestrator (智能体)
    │
    ▼
工具层: 文件/日历/邮件/金融/浏览器
    │
    ▼
存储层: SQLite/Redis/Qdrant
```

## 📱 APP 支持

| 平台 | 版本 | 状态 |
|------|------|------|
| iOS | 15.0+ | 开发中 |
| Android | 8.0+ | 开发中 |

## 🛠️ 核心功能

### 消息通信
- 实时文字/图片/语音消息
- 消息历史记录
- 离线消息推送

### 语音功能
- 语音唤醒 ("嘿，小智")
- 语音输入 (Whisper)
- 语音回复 (ElevenLabs)

### 智能工具
- 📁 文件管理
- 📈 金融市场分析
- 📅 日程管理
- 📧 邮件管理
- 🌐 浏览器自动化

## 🇨🇳 中文支持

- 中文分词/纠错/情感分析
- 中文语音识别 (ASR)
- 中文语音合成 (TTS)
- 中文 RAG 知识库

## 🚀 快速开始

```bash
# 克隆项目
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# 安装依赖
npm install

# 启动 Gateway
npm run gateway

# 运行 APP
cd apps/mobile
flutter run
```

## 📚 文档

- [完整需求文档](docs/requirements.md)
- [API 文档](docs/api.md)
- [开发指南](docs/development.md)

## 📦 技术栈

- **Gateway**: Node.js + WebSocket
- **Agent**: Python + LangChain
- **LLM**: Ollama (本地) + OpenAI API (云端)
- **APP**: Flutter (跨平台)
- **数据库**: SQLite + Redis + Qdrant

## 📄 许可

MIT License

## 🤝 基于

本项目基于 [OpenClaw](https://github.com/openclaw/openclaw) 架构设计，感谢开源！

---

**Personal AI Agent** - 您的专属中文AI助理
