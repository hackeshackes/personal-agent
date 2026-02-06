/**
 * Voice Service - 语音服务
 */

import 'package:flutter/foundation.dart';
import 'package:audioplayers/audioplayers.dart';
import 'dart:io';
import 'dart:typed_data';
import 'package:path_provider/path_provider.dart';

class VoiceService extends ChangeNotifier {
  bool _isListening = false;
  bool _isPlaying = false;
  String? _transcript;
  final AudioPlayer _player = AudioPlayer();
  
  // 回调函数
  Function(bool)? onListeningChange;
  Function(String)? onTranscript;
  
  bool get isListening => _isListening;
  bool get isPlaying => _isPlaying;
  String? get transcript => _transcript;
  
  /**
   * 开始录音
   */
  Future<void> startListening() async {
    // TODO: 实现语音录制
    // 使用 flutter_sound 或 record_mp3 插件
    _isListening = true;
    _transcript = null;
    notifyListeners();
    onListeningChange?.call(true);
    print('🎤 开始录音...');
  }
  
  /**
   * 停止录音
   */
  Future<void> stopListening() async {
    _isListening = false;
    notifyListeners();
    onListeningChange?.call(false);
    print('🎤 录音结束');
  }
  
  /**
   * 语音识别 (Whisper)
   */
  Future<String> transcribe(String audioPath) async {
    // TODO: 调用 Whisper API
    // 可以使用本地 Whisper 或 OpenAI Whisper API
    print('🔄 识别中: $audioPath');
    await Future.delayed(const Duration(seconds: 1));
    return '你好，小智';
  }
  
  /**
   * 播放语音回复 (ElevenLabs)
   */
  Future<void> playVoice(String text) async {
    // TODO: 调用 ElevenLabs TTS API
    // 获取音频后播放
    print('🔊 播放: $text');
  }
  
  /**
   * 设置唤醒词检测
   */
  void setWakeWordDetection(bool enabled) {
    // TODO: 实现唤醒词检测
    // 可以使用 Porcupine 库
    print('🔔 唤醒词检测: $enabled');
  }
  
  /**
   * 播放音频文件
   */
  Future<void> playAudio(String url) async {
    try {
      await _player.play(UrlSource(url));
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
   * 获取语音状态
   */
  Map<String, dynamic> getStatus() {
    return {
      'isListening': _isListening,
      'isPlaying': _isPlaying,
      'transcript': _transcript,
    };
  }
}
