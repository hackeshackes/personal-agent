# 命令行使用指南

## Gateway 命令

### 启动 Gateway

```bash
# 开发模式 (热重载)
cd gateway
npm run dev

# 生产模式
npm start

# 指定端口
PORT=18889 npm start

# 后台运行 (macOS)
brew services start personal-agent

# 后台运行 (Linux)
sudo systemctl start personal-agent
```

### 检查状态

```bash
# 检查进程
ps aux | grep "node src/server.js"

# 检查端口
lsof -i :18789

# 检查日志
tail -f logs/gateway.log
```

## Skill CLI 命令

### 列出已安装的 Skill

```bash
# 列出所有 Skill
skill list

# 输出
📦 已安装的 Skill:

  总计: 8

  • market v1.0.0 | 状态: loaded
  • calculator v1.0.0 | 状态: loaded
  • weather v1.0.0 | 状态: loaded
  • search v1.0.0 | 状态: loaded
  • translation v1.0.0 | 状态: loaded
  • git v1.0.0 | 状态: loaded
  • docker v1.0.0 | 状态: loaded
  • database v1.0.0 | 状态: loaded
```

### 搜索 Skill

```bash
# 搜索市场中的 Skill
skill search weather

# 输出
🔍 搜索结果: "weather"

  • weather v1.0.0
    获取全球城市天气预报
    ⭐ 4.8 | ⬇️ 1250

  • weather-alerts v1.0.0
    天气警报和预警
    ⭐ 4.6 | ⬇️ 890

# 限制结果数量
skill search weather --limit 5
```

### 安装 Skill

```bash
# 从市场安装
skill install weather

# 从 GitHub 安装
skill install git --source github:clawhub/git-skill

# 指定类型
skill install docker --type community
```

### 卸载 Skill

```bash
# 卸载 Skill
skill uninstall weather

# 强制卸载
skill uninstall weather --force
```

### 更新 Skill

```bash
# 更新单个
skill update market

# 更新所有
skill update

# 更新所有到最新
skill update --latest
```

### 执行 Skill

```bash
# 基本执行
skill exec market quote symbol=9988.HK

# 带参数
skill exec calculator calculate expression="100*1.1"

# 组合参数
skill exec weather forecast city=北京 days=7
```

### 查看 Skill 详情

```bash
# 查看详情
skill info weather

# 输出
📦 weather v1.0.0

  描述: 获取全球城市天气预报
  作者: Personal AI Agent Team
  评分: ⭐ 4.8
  下载: ⬇️ 1250
  标签: weather, forecast, meteorology
  仓库: https://github.com/personal-agent/weather-skill
```

### 健康检查

```bash
# 检查所有 Skill 健康状态
skill health

# 输出
🏥 Skill 健康检查

  ✅ market: ok
  ✅ calculator: ok
  ⚠️ weather: degraded (API key not configured)
  ✅ git: ok
  ✅ docker: ok
```

### 查看系统状态

```bash
# 查看状态
skill status

# 输出
📊 Skill 系统状态

  已加载: 8
  已安装: 8
  类别: development, lifestyle, data
```

## 节点命令

### 节点管理

```bash
# 列出节点
openclaw nodes list

# 输出
📱 节点列表

  ID                  名称              类型    状态
  abc123              iPhone 15 Pro     iOS    在线
  def456              MacBook Pro       macOS   在线
```

### 配对

```bash
# 查看待处理请求
openclaw nodes pending

# 批准配对
openclaw nodes approve abc-123-def

# 拒绝配对
openclaw nodes reject abc-123-def
```

## 会话命令

### 会话管理

```bash
# 列出会话
openclaw sessions list

# 创建会话
openclaw sessions create --model minimax/MiniMax-M2.1

# 终止会话
openclaw sessions terminate session-abc
```

## Cron 命令

### 定时任务

```bash
# 列出任务
openclaw crons list

# 添加任务
openclaw crons add --schedule "*/5 * * * *" --payload "run_market_monitor"

# 删除任务
openclaw crons remove job-abc

# 手动触发
openclaw crons run job-abc
```

## 快捷命令

### 市场监控

```bash
# 手动运行监控
npm run market-monitor

# 带参数
npm run market-monitor -- --symbols 9988.HK,1209.HK
```

### 备份

```bash
# 备份所有数据
npm run backup

# 恢复备份
npm run restore backup-20240206.tar.gz
```

## Docker 命令

```bash
# 启动服务
cd deployments/docker
docker-compose up -d

# 查看日志
docker-compose logs -f personal-agent

# 重启服务
docker-compose restart personal-agent

# 停止服务
docker-compose down

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 环境变量

### 常用配置

```bash
# Gateway 端口
export PORT=18789

# API Keys
export OPENAI_API_KEY=sk-xxx
export ELEVENLABS_API_KEY=xi-xxx
export WEATHER_API_KEY=xxx

# 日志级别
export LOG_LEVEL=info

# 开发模式
export NODE_ENV=development
```

## 故障排除

### 服务无法启动

```bash
# 检查端口
lsof -i :18789

# 查看错误日志
tail -50 logs/error.log

# 检查进程
ps aux | grep node
```

### Skill 加载失败

```bash
# 检查 Skill 状态
skill health

# 查看详情日志
DEBUG=skill:* npm start
```

### WebSocket 连接失败

```bash
# 测试 HTTP API
curl http://localhost:18789/api/status

# 测试端口连通性
nc -zv localhost 18789
```

## 脚本别名

```bash
# ~/.bashrc 或 ~/.zshrc

# Gateway
alias pg='cd /path/to/gateway && npm start'
alias pg-dev='cd /path/to/gateway && npm run dev'

# Skill CLI
alias skill='node /path/to/src/skill/cli.js'

# 市场监控
alias market='node /path/to/market_monitor.py'

# 日志
alias logs='tail -f /path/to/logs/gateway.log'
```
