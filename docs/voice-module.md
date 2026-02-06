# Voice Module - 语音模块

> Phase 3 (W5-6) - 语音唤醒/输入/回复

## 架构

```
┌─────────────────────────────────────────────────────┐
│                    Flutter APP                       │
├─────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │
│  │ 录音 (录音)  │  │  TTS 播放   │  │ 唤醒检测    │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘ │
│         │                 │                 │        │
│         ▼                 ▼                 ▼        │
│  ┌─────────────────────────────────────────────────┐ │
│  │              Voice Service                       │ │
│  │  • 录音管理     • Whisper ASR    • ElevenLabs  │ │
│  └─────────────────────────────────────────────────┘ │
│                          │                           │
│                          ▼                           │
│               ┌─────────────────────┐              │
│               │   WebSocket         │              │
│               │   (Gateway 通信)    │              │
│               └─────────────────────┘              │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Gateway                             │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐ │
│  │  Services:                                      │ │
│  │  • wakeword.js  - 唤醒词检测                    │ │
│  │  • whisper.js   - Whisper ASR                   │ │
│  │  • elevenlabs.js - ElevenLabs TTS              │ │
│  └─────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## 组件

### 1. 唤醒词检测 (WakeWord)

| 组件 | 说明 | 状态 |
|------|------|------|
| **Porcupine** | Picovoice 唤醒词引擎 | 占位 |
| **关键词** | "小智", "嘿小智" | ✅ |
| **灵敏度** | 可配置 | ✅ |

### 2. 语音识别 (ASR)

| 组件 | 说明 | 状态 |
|------|------|------|
| **Whisper CLI** | 本地 Whisper | 可用 |
| **OpenAI Whisper API** | 云端识别 | 可配置 |
| **语言** | 中文/英文 | ✅ |

### 3. 语音合成 (TTS)

| 组件 | 说明 | 状态 |
|------|------|------|
| **ElevenLabs** | 高质量多语言 TTS | 需要 API Key |
| **离线 TTS** | 系统 TTS | 占位 |
| **声音** | 中文/英文 | ✅ |

## API 配置

```bash
# 环境变量
export OPENAI_API_KEY="sk-xxx"
export ELEVENLABS_API_KEY="xi-xxx"
export PICOVOICE_ACCESS_KEY="xxx"
export WHISPER_LOCAL="true"
```

## 使用

### Gateway 端

```bash
# 启动 Gateway (自动加载语音服务)
cd gateway
npm start

# 测试转录
curl -X POST http://localhost:18789/api/whisper/transcribe \
  -H "Content-Type: application/json" \
  -d '{"audio": "<base64>", "language": "zh"}'

# 测试 TTS
curl -X POST http://localhost:18789/api/tts/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text": "你好，我是小智", "voice": "zh_female"}'
```

### APP 端

```bash
cd apps/mobile
flutter pub get
flutter run
```

## 权限

### iOS (Info.plist)

```xml
<key>NSMicrophoneUsageDescription</key>
<string>需要麦克风权限进行语音输入</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>需要语音识别权限</string>
```

### Android (AndroidManifest.xml)

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
<uses-permission android:name="android.permission.INTERNET"/>
```

## 性能指标

| 指标 | 目标 |
|------|------|
| 唤醒响应 | < 500ms |
| 语音识别延迟 | < 2s |
| TTS 延迟 | < 1s |
| 录音功耗 | < 5% |
