# Personal AI Agent - Docker 配置

## 快速启动

```bash
# 构建镜像
docker build -t personal-agent .

# 运行容器
docker run -p 18789:18789 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  personal-agent
```

## 详细配置

### 1. 构建镜像

```dockerfile
FROM node:20-alpine

WORKDIR /app

# 安装 Python (用于 Agent)
RUN apk add --no-cache python3 py3-pip

# 复制 package 文件
COPY gateway/package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY gateway/src ./src

# 创建数据目录
RUN mkdir -p data logs

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=18789

# 暴露端口
EXPOSE 18789

# 启动
CMD ["node", "src/server.js"]
```

### 2. Docker Compose

```yaml
version: '3.8'

services:
  personal-agent:
    build: .
    container_name: personal-agent
    ports:
      - "18789:18789"
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    environment:
      - NODE_ENV=production
      - PORT=18789
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ELEVENLABS_API_KEY=${ELEVENLABS_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/api/status"]
      interval: 30s
      timeout: 10s
      retries: 3

  # 可选: Redis 缓存
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

### 3. 环境变量

创建 `.env` 文件:

```bash
# 必需
OPENAI_API_KEY=sk-xxx
ELEVENLABS_API_KEY=xi-xxx

# 可选
PORT=18789
NODE_ENV=production
WHISPER_LOCAL=true
FILE_BASE_DIR=/data
```

### 4. 生产部署

```bash
# 1. 构建
docker-compose build

# 2. 启动 (后台)
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 4. 检查状态
docker-compose ps

# 5. 更新
docker-compose pull
docker-compose up -d
```

### 5. 资源限制

```yaml
services:
  personal-agent:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 端口说明

| 端口 | 协议 | 说明 |
|------|------|------|
| 18789 | TCP | WebSocket Gateway |
| 6379 | TCP | Redis (可选) |

## 数据持久化

```
./data/
├── sessions/     # 会话数据
├── nodes/        # 节点数据
├── crons/        # 定时任务
├── memory/       # 记忆数据
├── rag/          # RAG 数据
└── audio/        # 语音文件
```
