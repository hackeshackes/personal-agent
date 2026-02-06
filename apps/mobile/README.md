# Flutter Mobile APP

> ⚠️ **需要先安装 Flutter SDK**
> 
> 本目录为 Flutter 移动端 APP，计划支持 iOS 15.0+ 和 Android 8.0+

## 安装 Flutter

```bash
# macOS (使用 Homebrew)
brew install flutter

# 或下载安装包
# https://docs.flutter.dev/get-started/install/macos

# 验证安装
flutter doctor
```

## 启动项目

```bash
# 进入移动端目录
cd apps/mobile

# 获取依赖
flutter pub get

# 运行
flutter run
```

## 项目结构

```
apps/mobile/
├── lib/
│   ├── main.dart           # 入口文件
│   ├── screens/            # 页面
│   │   ├── home_screen.dart
│   │   ├── chat_screen.dart
│   │   ├── voice_screen.dart
│   │   └── settings_screen.dart
│   ├── services/          # 服务
│   │   ├── websocket_service.dart
│   │   ├── voice_service.dart
│   │   └── storage_service.dart
│   └── models/             # 数据模型
│       └── message.dart
├── test/                   # 测试
└── pubspec.yaml           # 依赖配置
```

## 依赖包

```yaml
dependencies:
  flutter:
    sdk: flutter
  web_socket_channel: ^2.4.0
  provider: ^6.0.5
  shared_preferences: ^2.2.2
  intl: ^0.18.1
  permission_handler: ^11.0.1
  audioplayers: ^5.2.1
```

## 功能计划

- [ ] 基础 UI 框架
- [ ] WebSocket 通信
- [ ] 消息列表和发送
- [ ] 语音录制和播放
- [ ] 配对流程
- [ ] 推送通知
- [ ] 离线支持
