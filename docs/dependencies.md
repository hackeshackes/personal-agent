# 依赖安装指南

## Node.js 依赖

### 必需依赖

```bash
cd gateway
npm install

# 或手动安装
npm install ws uuid inquirer commander dotenv
npm install sqlite3 ioredis qrcode mdns
npm install axios jieba natural
```

| 包名 | 版本 | 用途 |
|------|------|------|
| `ws` | ^8.14.2 | WebSocket 服务器 |
| `uuid` | ^9.0.1 | 唯一 ID 生成 |
| `inquirer` | ^9.2.12 | CLI 交互 |
| `commander` | ^11.1.0 | CLI 命令 |
| `dotenv` | ^16.3.1 | 环境变量 |
| `sqlite3` | ^5.1.6 | 本地数据库 |
| `ioredis` | ^5.3.2 | Redis 客户端 |
| `qrcode` | ^1.5.3 | 二维码生成 |
| `mdns` | ^2 | 服务发现 |
.7.2| `axios` | ^1.6.0 | HTTP 客户端 |
| `jieba` | ^0.0.5 | 中文分词 |
| `natural` | ^6.10.4 | 自然语言处理 |

### 开发依赖

```bash
npm install --save-dev nodemon jest
```

| 包名 | 用途 |
|------|------|
| `nodemon` | 热重载开发 |
| `jest` | 测试框架 |

## Python 依赖

```bash
# 如果需要 Python Agent
pip3 install langchain openai
```

## Flutter 依赖

```bash
cd apps/mobile
flutter pub get

# 必需包
flutter pub add web_socket_channel provider shared_preferences
flutter pub add intl permission_handler audioplayers record_mp3
flutter pub add path_provider http
```

| 包名 | 用途 |
|------|------|
| `web_socket_channel` | WebSocket 连接 |
| `provider` | 状态管理 |
| `shared_preferences` | 本地存储 |
| `intl` | 国际化 |
| `permission_handler` | 权限管理 |
| `audioplayers` | 音频播放 |
| `record_mp3` | 录音功能 |
| `path_provider` | 路径获取 |
| `http` | HTTP 请求 |

## 系统依赖

### macOS

```bash
# Xcode (iOS 开发)
xcode-select --install

# Homebrew
brew install node python@3.11 flutter
```

### Linux

```bash
# Ubuntu/Debian
sudo apt-get install nodejs npm python3
sudo apt-get install libsqlite3-dev redis-server

# Fedora/RHEL
sudo dnf install nodejs npm python3 sqlite-devel
sudo dnf install redis
```

### Windows

```bash
# 安装 Node.js (LTS)
# https://nodejs.org/

# 安装 Python 3.11+
# https://www.python.org/downloads/

# 安装 Redis
# https://redis.io/download
```

## Docker 依赖

```bash
# Docker Desktop (macOS/Windows)
# https://www.docker.com/products/docker-desktop

# Linux
sudo apt-get install docker.io docker-compose
sudo systemctl start docker
```

## 环境变量配置

### Gateway (.env)

```bash
# .env
PORT=18789
NODE_ENV=development

# OpenAI API (可选)
OPENAI_API_KEY=sk-xxx

# ElevenLabs API (可选)
ELEVENLABS_API_KEY=xi-xxx

# 天气 API (可选)
WEATHER_API_KEY=xxx

# 文件根目录
FILE_BASE_DIR=~/
```

### Flutter (.env)

```dart
// lib/config.dart
class Config {
  static const String gatewayUrl = 'ws://127.0.0.1:18789';
  static const String apiUrl = 'http://127.0.0.1:18789/api';
}
```

## 验证安装

```bash
# Node.js
node --version  # >= 18.0.0
npm --version    # >= 9.0.0

# Python
python3 --version  # >= 3.10

# Flutter
flutter --version  # >= 3.0.0

# Docker
docker --version   # >= 20.10.0
docker-compose --version  # >= 2.0.0
```

## Docker 部署 (推荐)

```bash
# 构建并启动
cd deployments/docker
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止
docker-compose down
```
