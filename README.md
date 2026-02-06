# Personal AI Agent

> 基于 OpenClaw 架构的中文智能体，支持 iOS/Android APP 随时随地语音/文字沟通

## 🚀 Phase 1 完成进度 (W1-2)

### ✅ 已完成
- [x] Gateway WebSocket 控制平面 (Node.js)
- [x] 会话管理 (Session Manager)
- [x] 节点管理 (Node Manager)
- [x] 任务调度 (Cron Manager)
- [x] 工具注册 (Tool Registry)
- [x] HTTP API 服务
- [x] 配对系统 (二维码/配对码)
- [x] 仪表盘页面

### ⏳ 待安装
- [ ] **Flutter SDK** (iOS/Android APP)
  ```bash
  brew install flutter
  flutter doctor
  ```

### 📱 APP 启动
```bash
# 安装 Flutter 后
cd apps/mobile
flutter pub get
flutter run
```
