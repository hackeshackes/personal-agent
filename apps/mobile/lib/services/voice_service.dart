/**
 * Voice Service - 语音服务 (完整版)
 * 支持:
 * - 录音 (record_mp3)
 * - Whisper ASR
 * - ElevenLabs TTS
 * - 唤醒词检测 (Porcupine 占位)
 */

import 'package:flutter/foundation.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record_mp3/record_mp3.dart';
import 'package:path_provider/path_provider.dart';
import 'package:http/http.dart' as http;
import 'dart:io';
import 'dart:convert';

class VoiceService extends ChangeNotifier {
  bool _isListening = false;
  bool _isRecording = false;
  bool _isPlaying = false;
  String? _transcript;
  String? _audioPath;
  final AudioPlayer _player = AudioPlayer();
  
  // 回调函数
  Function(bool)? onListeningChange;
  Function(String)? onTranscript;
  Function(String)? onAudioPath;
  
  // 配置
  String _whisperEndpoint = 'http://127.0.0.1:18789/api/whisper';
  String _ttsEndpoint = 'http://127.0.0.1:18789/api/tts';
  
  bool get isListening => _isListening;
  bool get isRecording => _isRecording;
  bool get isPlaying => _isPlaying;
  String? get transcript => _transcript;
  String? get audioPath => _audioPath;
  
  /**
   * 开始录音
   */
  Future<bool> startListening() async {
    try {
      final dir = await getApplicationDocumentsDirectory();
      _audioPath = '${dir.path}/voice_${DateTime.now().millisecondsSinceEpoch}.mp3';
      
      // 请求权限并开始录音
      _isRecording = true;
      _isListening = true;
      notifyListeners();
      
      await RecordMp3.instance.start(_audioPath!, (status) {
        if (status != RecordMp3Status.RECORDING) {
          print('录音状态: $status');
        }
      });
      
      onListeningChange?.call(true);
      print('🎤 开始录音: $_audioPath');
      return true;
    } catch (e) {
      print('开始录音失败: $e');
      _isRecording = false;
      return false;
    }
  }
  
  /**
   * 停止录音
   */
  Future<bool> stopListening() async {
    if (!_isRecording) return false;
    
    final success = await RecordMp3.instance.stop();
    _isRecording = false;
    _isListening = false;
    notifyListeners();
    
    onListeningChange?.call(false);
    
    if (success && _audioPath != null) {
      print('🎤 录音结束: $_audioPath');
      // 自动转录
      await transcribe(_audioPath!);
    }
    
    return success;
  }
  
  /**
   * 语音识别 (Whisper)
   */
  Future<String> transcribe(String audioPath) async {
    print('🔄 正在识别: $audioPath');
    
    try {
      // 方式 1: 调用本地 Gateway API
      final result = await _transcribeViaGateway(audioPath);
      _transcript = result;
      onTranscript?.call(result);
      notifyListeners();
      return result;
    } catch (e) {
      print('转录失败: $e');
      
      // 方式 2: 直接调用 Whisper (如果有)
      try {
        final result = await _transcribeWhisper(audioPath);
        _transcript = result;
        onTranscript?.call(result);
        notifyListeners();
        return result;
      } catch (e2) {
        // 降级: 使用模拟结果
        _transcript = '识别失败，请重试';
        onTranscript?.call(_transcript!);
        return _transcript!;
      }
    }
  }
  
  /**
   * 通过 Gateway API 转录
   */
  Future<String> _transcribeViaGateway(String audioPath) async {
    final file = File(audioPath);
    final bytes = await file.readAsBytes();
    final base64 = base64Encode(bytes);
    
    final response = await http.post(
      Uri.parse('$_whisperEndpoint/transcribe'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'audio': base64,
        'language': 'zh',
      }),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['text'] ?? '';
    }
    
    throw Exception('转录失败: ${response.statusCode}');
  }
  
  /**
   * 直接调用 Whisper CLI
   */
  Future<String> _transcribeWhisper(String audioPath) async {
    // 假设 whisper 在 PATH 中
    final process = await Process.run('whisper', [
      audioPath,
      '--model', 'base',
      '--language', 'Chinese',
      '--no_timestamps',
      '--output_format', 'json',
    ]);
    
    if (process.exitCode == 0) {
      final jsonPath = audioPath.replaceAll(RegExp(r'\.[^.]+$'), '.json');
      final jsonFile = File(jsonPath);
      if (await jsonFile.exists()) {
        final data = jsonDecode(await jsonFile.readAsString());
        return data['text'] ?? '';
      }
    }
    
    throw Exception('Whisper 转录失败');
  }
  
  /**
   * 播放语音回复 (ElevenLabs TTS)
   */
  Future<void> playVoice(String text) async {
    print('🔊 播放: $text');
    
    try {
      // 方式 1: 调用 Gateway TTS API
      final audioPath = await _synthesizeViaGateway(text);
      await _playAudio(audioPath);
    } catch (e) {
      print('TTS 失败: $e');
      // 降级: 使用语音转文字显示
    }
  }
  
  /**
   * 通过 Gateway API 合成语音
   */
  Future<String> _synthesizeViaGateway(String text) async {
    final response = await http.post(
      Uri.parse('$_ttsEndpoint/synthesize'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'text': text,
        'voice': 'zh_female',
      }),
    );
    
    if (response.statusCode == 200) {
      final dir = await getApplicationDocumentsDirectory();
      final audioPath = '${dir.path}/tts_${DateTime.now().millisecondsSinceEpoch}.mp3';
      final file = File(audioPath);
      await file.writeAsBytes(response.body);
      return audioPath;
    }
    
    throw Exception('TTS 失败: ${response.statusCode}');
  }
  
  /**
   * 播放音频文件
   */
  Future<void> _playAudio(String path) async {
    try {
      await _player.play(DeviceFileSource(path));
      _isPlaying = true;
      notifyListeners();
      
      _player.onPlayerStateChanged.listen((state) {
        _isPlaying = state == PlayerState.playing;
        notifyListeners();
      });
    } catch (e) {
      print('播放失败: $e');
    }
  }
  
  /**
   * 停止播放
   */
  Future<void> stopPlaying() async {
    await _player.stop();
    _isPlaying = false;
    notifyListeners();
  }
  
  /**
   * 设置唤醒词检测
   */
  Future<void> enableWakeWordDetection(bool enabled) async {
    if (enabled && !_isListening) {
      await startListening();
    } else if (!enabled && _isListening) {
      await stopListening();
    }
    print('🔔 唤醒词检测: $enabled');
  }
  
  /**
   * 录音权限检查
   */
  Future<bool> hasPermission() async {
    return await RecordMp3.instance.hasPermission() ?? false;
  }
  
  /**
   * 获取音频文件时长
   */
  Future<Duration> getAudioDuration(String path) async {
    final player = AudioPlayer();
    await player.setSource(DeviceFileSource(path));
    return await player.getDuration() ?? Duration.zero;
  }
  
  /**
   * 删除临时音频文件
   */
  Future<void> cleanup() async {
    if (_audioPath != null) {
      final file = File(_audioPath!);
      if (await file.exists()) {
        await file.delete();
      }
    }
    _transcript = null;
    _audioPath = null;
  }
  
  /**
   * 获取语音状态
   */
  Map<String, dynamic> getStatus() {
    return {
      'isListening': _isListening,
      'isRecording': _isRecording,
      'isPlaying': _isPlaying,
      'transcript': _transcript,
      'audioPath': _audioPath,
    };
  }
}
