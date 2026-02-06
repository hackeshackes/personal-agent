# Personal AI Agent - 发布检查清单

## 发布前检查

### ✅ 代码检查
- [ ] 所有测试通过 (`npm test`)
- [ ] 无 lint 错误
- [ ] 代码覆盖率 > 80%
- [ ] 文档已更新

### ✅ 功能检查
- [ ] Gateway 启动正常
- [ ] WebSocket 连接稳定
- [ ] 节点配对功能正常
- [ ] 所有工具可正常工作
  - [ ] Market (港股/美股/加密)
  - [ ] File (文件操作)
  - [ ] Calendar (日程管理)
  - [ ] Mail (邮件管理)
- [ ] RAG 知识库可用
- [ ] 记忆系统正常

### ✅ 性能检查
- [ ] 响应时间 < 100ms
- [ ] 内存使用 < 500MB
- [ ] 并发连接 > 10

### ✅ 安全检查
- [ ] API Keys 已配置
- [ ] 无敏感信息泄露
- [ ] 输入验证正常
- [ ] 日志脱敏

## 版本信息

### 当前版本
- **版本**: 1.0.0
- **发布日期**: 2026-02-06
- **状态**: Beta

### 更新日志

#### v1.0.0 (2026-02-06)
- ✨ 初始版本
- ✨ Gateway WebSocket 控制平面
- ✨ Flutter APP (iOS/Android)
- ✨ 中文 NLU (jieba + 意图分类)
- ✨ 语音服务 (Whisper + ElevenLabs)
- ✨ 核心工具 (Market/File/Calendar/Mail)
- ✨ RAG 知识库
- ✨ 记忆系统

## 安装说明

### 方式 1: Docker (推荐)

```bash
# 克隆
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# 配置
cp .env.example .env
# 编辑 .env 添加 API Keys

# 启动
cd deployments/docker
docker-compose up -d
```

### 方式 2: 手动安装

```bash
# 克隆
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# Gateway
cd gateway
npm install
npm start

# Flutter APP (需要 Flutter SDK)
cd apps/mobile
flutter build apk  # Android
flutter build ipa  # iOS
```

## API 文档

### WebSocket API

```javascript
// 连接
const ws = new WebSocket('ws://127.0.0.1:18789/ws');

// 发送消息
ws.send(JSON.stringify({
  type: 'chat.send',
  content: '你好，小智'
}));

// 接收消息
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log(data);
};
```

### HTTP API

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | Gateway 状态 |
| `/api/pairing` | GET | 获取配对码 |
| `/api/sessions` | GET | 会话列表 |
| `/api/nodes` | GET | 节点列表 |

## 配置选项

### 环境变量

| 变量 | 必需 | 默认值 | 说明 |
|------|------|--------|------|
| `PORT` | 否 | 18789 | WebSocket 端口 |
| `NODE_ENV` | 否 | development | 环境 |
| `OPENAI_API_KEY` | 否 | - | Whisper API |
| `ELEVENLABS_API_KEY` | 否 | - | TTS API |
| `FILE_BASE_DIR` | 否 | ~/ | 文件根目录 |

## 已知问题

1. **Android SDK** - 需要手动安装 Android Studio
2. **Xcode** - 需要 macOS + Xcode 进行 iOS 开发
3. **本地 Whisper** - 需要安装 whisper CLI

## 路线图

### v1.1.0 (待发布)
- [ ] 完善测试覆盖率
- [ ] 添加性能基准测试
- [ ] 集成真实语音唤醒
- [ ] 添加更多市场数据源

### v2.0.0 (未来)
- [ ] 多语言支持
- [ ] 插件系统
- [ ] Web 管理界面
- [ ] 团队协作功能

## 支持

- **文档**: docs/
- **Issue**: https://github.com/hackeshackes/personal-agent/issues
- **License**: MIT
