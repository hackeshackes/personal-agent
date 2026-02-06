# 功能说明

## 核心功能

### 1. Gateway 控制平面

Gateway 是 Personal AI Agent 的核心控制平面，提供 WebSocket API 和 HTTP 服务。

#### WebSocket API

```javascript
// 连接 Gateway
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

#### HTTP API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/status` | GET | 获取服务状态 |
| `/api/pairing` | GET | 获取配对码 |
| `/api/sessions` | GET | 会话列表 |
| `/api/nodes` | GET | 节点列表 |
| `/api/sessions` | POST | 创建会话 |

#### 状态检查

```bash
curl http://localhost:18789/api/status

# 响应
{
  "uptime": "1h30m",
  "connections": 5,
  "sessions": 3,
  "nodes": 2,
  "memory": "128MB"
}
```

### 2. 消息通信

#### 发送消息

```javascript
// 发送文本消息
ws.send(JSON.stringify({
  type: 'chat.send',
  content: '帮我查询阿里巴巴股价',
  target: 'agent'
}));

// 发送语音消息
ws.send(JSON.stringify({
  type: 'chat.send',
  content: '<base64_audio>',
  contentType: 'voice'
}));
```

#### 消息历史

```javascript
// 获取历史消息
ws.send(JSON.stringify({
  type: 'chat.history',
  limit: 50
}));
```

### 3. 节点管理

#### 添加节点

```bash
# 查看待处理请求
openclaw nodes pending

# 批准配对
openclaw nodes approve <pairing-code>

# 列出节点
openclaw nodes list
```

#### 节点状态

```json
{
  "id": "node-abc123",
  "name": "iPhone 15 Pro",
  "type": "ios",
  "status": "online",
  "capabilities": ["voice", "chat", "camera"]
}
```

## Skill 框架

### 内置 Skill

#### Market Skill

```javascript
// 查询股价
await framework.execute('market', {
  action: 'quote',
  symbol: '9988.HK',
  market: 'hk'
});

// 技术分析
await framework.execute('market', {
  action: 'analyze',
  symbol: 'BTCUSDT',
  market: 'crypto'
});

// 批量查询
await framework.execute('market', {
  action: 'batch',
  symbols: ['9988.HK', '1209.HK', '3690.HK'],
  market: 'hk'
});
```

**支持的市场:**

| 市场 | 示例 | 数据源 |
|------|------|-------|
| 港股 | 9988.HK, 1209.HK | 腾讯 |
| 美股 | AAPL, GOOGL | Yahoo Finance |
| A股 | 600519.SH | 腾讯 |
| 加密 | BTCUSDT, ETHUSDT | Binance |

#### Calculator Skill

```javascript
// 数学计算
await framework.execute('calculator', {
  action: 'calculate',
  expression: '100 * 1.1 + 50'
});

// 货币换算
await framework.execute('calculator', {
  action: 'convert',
  value: 100,
  from: 'USD',
  to: 'CNY'
});

// 百分比计算
await framework.execute('calculator', {
  action: 'percentage',
  value: 500,
  rate: 20,
  operation: 'of'  // of | what_percent | increase | decrease
});

// 金融计算
await framework.execute('calculator', {
  action: 'finance',
  type: 'compound',
  principal: 10000,
  annualRate: 5,
  time: 10  // 年
});
```

### 社区 Skill

#### Weather Skill

```javascript
// 当前天气
await framework.execute('weather', {
  action: 'current',
  city: '北京'
});

// 天气预报
await framework.execute('weather', {
  action: 'forecast',
  city: '上海',
  days: 7
});
```

#### Search Skill

```javascript
// 网页搜索
await framework.execute('search', {
  query: 'Personal AI Agent',
  engine: 'duckduckgo',
  limit: 10
});
```

#### Translation Skill

```javascript
// 翻译
await framework.execute('translation', {
  action: 'translate',
  text: 'Hello, world!',
  from: 'en',
  to: 'zh'
});

// 语言检测
await framework.execute('translation', {
  action: 'detect',
  text: '你好世界'
});

// 支持的语言
await framework.execute('translation', {
  action: 'languages'
});
```

#### Git Skill

```javascript
// 查看状态
await framework.execute('git', {
  action: 'status',
  repo: './my-project'
});

// 查看日志
await framework.execute('git', {
  action: 'log',
  repo: './my-project',
  limit: 10
});

// 提交
await framework.execute('git', {
  action: 'commit',
  repo: './my-project',
  message: 'Update documentation',
  files: ['README.md']
});

// 分支操作
await framework.execute('git', {
  action: 'branch',
  repo: './my-project'
});
```

#### Docker Skill

```javascript
// 查看容器
await framework.execute('docker', {
  action: 'ps'
});

// 查看镜像
await framework.execute('docker', {
  action: 'images'
});

// 运行容器
await framework.execute('docker', {
  action: 'run',
  image: 'nginx:latest',
  options: '-d -p 8080:80'
});

// 管理容器
await framework.execute('docker', {
  action: 'stop',
  container: 'nginx-proxy'
});

// Docker Compose
await framework.execute('docker', {
  action: 'compose',
  action: 'up',
  file: 'docker-compose.yml'
});
```

#### Database Skill

```javascript
// 连接数据库
await framework.execute('database', {
  action: 'connect',
  database: 'sqlite:./data.db'
});

// 查询
await framework.execute('database', {
  action: 'query',
  database: 'sqlite:./data.db',
  query: 'SELECT * FROM users LIMIT 10'
});

// 查看表
await framework.execute('database', {
  action: 'tables',
  database: 'sqlite:./data.db'
});

// 查看表结构
await framework.execute('database', {
  action: 'schema',
  database: 'sqlite:./data.db',
  table: 'users'
});
```

## 语音功能

### 语音输入

```javascript
// 开始录音
await voiceService.startListening();

// 停止录音并转写
await voiceService.stopListening();

// 获取转写结果
const transcript = voiceService.transcript;
```

### 语音输出

```javascript
// 播放语音回复
await voiceService.playVoice('你好，我是小智');
```

## RAG 知识库

### 创建知识库

```javascript
// 创建集合
await rag.createCollection('my-knowledge', '我的知识库');

// 添加文档
await rag.addDocument('my-knowledge', '这是一个重要的文档内容...', {
  source: 'manual',
  tags: ['important']
});

// 批量添加
await rag.addDocuments('my-knowledge', [
  { content: '文档1...', metadata: { source: 'file1.pdf' }},
  { content: '文档2...', metadata: { source: 'file2.md' }}
]);
```

### 搜索知识

```javascript
// 语义搜索
const results = await rag.search('my-knowledge', '如何安装软件', {
  limit: 5,
  threshold: 0.7
});
```

### 问答

```javascript
// 基于知识库的问答
const answer = await rag.ask('my-knowledge', '如何部署应用？', {
  contextChunks: 3
});
```

## 记忆系统

### 短期记忆

```javascript
// 添加短期记忆
memory.addShortTerm('last_query', { query: '阿里巴巴股价' });

// 获取
memory.getShortTerm('last_query');
```

### 长期记忆

```javascript
// 保存到长期记忆
memory.saveToLongTerm('user_preference', {
  theme: 'dark',
  language: 'zh-CN'
}, importance: 8);

// 搜索
memory.searchLongTerm('theme');
```

### 情景记忆

```javascript
// 记录事件
memory.recordEpisode('user_interaction', {
  type: 'query',
  content: '查询了股票'
}, {
  timestamp: Date.now()
});

// 搜索
memory.searchEpisodes('股票');
```

### 记忆整合

```javascript
// 将短期记忆整合到长期
memory.consolidate();
```

## 定时任务

### 添加任务

```javascript
// 每5分钟执行市场监控
crons.add({
  schedule: { kind: 'cron', expr: '*/5 * * * *' },
  payload: { kind: 'systemEvent', text: 'run_market_monitor' },
  sessionTarget: 'main'
});
```

### 任务类型

| 类型 | 示例 | 描述 |
|------|------|------|
| cron | `*/5 * * * *` | Cron 表达式 |
| every | `{kind: 'every', everyMs: 300000}` | 间隔执行 |
| at | `{kind: 'at', at: '2026-02-06T12:00:00Z'}` | 定时执行 |

## 配置选项

### Gateway 配置

```json
{
  "port": 18789,
  "host": "0.0.0.0",
  "maxConnections": 100,
  "sessionTimeout": 3600000,
  "cors": {
    "origins": ["*"]
  }
}
```

### Skill 配置

```json
{
  "market": {
    "cacheTimeout": 300000,
    "defaultMarket": "hk"
  },
  "calculator": {
    "precision": 2
  },
  "weather": {
    "apiKey": "${WEATHER_API_KEY}"
  }
}
```
