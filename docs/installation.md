# 安装指南

## 快速安装 (Docker 推荐)

### 前置要求

- Docker Desktop 20.10+ / Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB+ 可用内存

### 步骤

```bash
# 1. 克隆仓库
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 添加 API Keys (可选)

# 3. 启动服务
cd deployments/docker
docker-compose up -d

# 4. 验证安装
docker-compose ps
curl http://localhost:18789/api/status
```

### 验证

```bash
# 检查服务状态
curl http://localhost:18789/api/status

# 预期响应
{
  "status": "running",
  "version": "1.0.0",
  "uptime": "10s",
  "connections": 0
}
```

## 手动安装

### 前置要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Python | 3.10 | 3.11 |
| Flutter | 3.10 | 3.19+ |
| Redis | 6.0 | 7.2 |
| Git | 2.30 | 2.44 |

### 步骤 1: 安装系统依赖

```bash
# macOS
brew install node python redis git

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y nodejs npm python3 redis-server git

# Fedora/RHEL
sudo dnf install -y nodejs npm python3 redis git
```

### 步骤 2: 安装 Node.js 服务

```bash
# 克隆项目
git clone https://github.com/hackeshackes/personal-agent.git
cd personal-agent

# 安装依赖
cd gateway
npm install

# 配置
cp .env.example .env
# 编辑 .env

# 启动 Gateway
npm start

# 验证
curl http://localhost:18789/api/status
```

### 步骤 3: 安装 Flutter APP (可选)

```bash
# macOS
brew install flutter

# 验证
flutter doctor

# 构建 iOS (需要 macOS + Xcode)
cd apps/mobile
flutter build ios --release

# 构建 Android
flutter build apk --release

# 开发调试
flutter run
```

### 步骤 4: 配置 Redis (可选)

```bash
# macOS (Homebrew)
brew services start redis

# Ubuntu/Debian
sudo systemctl start redis-server
sudo systemctl enable redis-server

# 验证
redis-cli ping
# 预期: PONG
```

## Docker Compose 配置

### 默认配置

```yaml
# deployments/docker/docker-compose.yml
version: '3.8'

services:
  personal-agent:
    build: ../../
    container_name: personal-agent
    ports:
      - "18789:18789"
    volumes:
      - ../data:/app/data
      - ../logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=18789
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:18789/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: personal-agent-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

### 自定义配置

```bash
# 使用自定义配置
cp docker-compose.override.yml docker-compose.override.yml.example

# 编辑自定义配置
vim docker-compose.override.yml
```

## 环境变量

### 必需配置

```bash
# .env
PORT=18789
NODE_ENV=production
```

### 可选配置

```bash
# API Keys
OPENAI_API_KEY=sk-xxx
ELEVENLABS_API_KEY=xi-xxx
WEATHER_API_KEY=xxx

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 文件目录
FILE_BASE_DIR=./data/files

# 日志级别
LOG_LEVEL=info
```

## 故障排除

### 端口冲突

```bash
# 检查端口占用
lsof -i :18789

# 停止占用进程
kill $(lsof -t -i :18789)

# 或使用其他端口
export PORT=18889
```

### 权限问题

```bash
# macOS
sudo chown -R $(whoami):staff data logs

# Linux
sudo chown -R $(whoami):$(whoami) data logs
```

### Docker 问题

```bash
# 清理 Docker
docker system prune -a

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

## 升级

```bash
# Docker 部署
git pull
docker-compose pull
docker-compose up -d

# 手动部署
git pull
cd gateway
npm install
pm2 restart personal-agent
```

## 卸载

```bash
# Docker 部署
docker-compose down -v
docker rmi personal-agent-gateway

# 手动部署
cd personal-agent
pkill -f "node src/server.js"
rm -rf data logs node_modules
```
