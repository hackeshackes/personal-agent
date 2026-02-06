/**
 * Voice Screen - 语音界面
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/websocket_service.dart';
import '../services/voice_service.dart';

class VoiceScreen extends StatefulWidget {
  @override
  _VoiceScreenState createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  @override
  void initState() {
    super.initState();
    
    final voiceService = Provider.of<VoiceService>(context, listen: false);
    voiceService.onListeningChange = (listening) {
      if (mounted) setState(() {});
    };
    voiceService.onTranscript = (text) {
      if (mounted) setState(() {});
    };
  }
  
  @override
  Widget build(BuildContext context) {
    final voiceService = Provider.of<VoiceService>(context);
    final wsService = Provider.of<WebSocketService>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('语音对话'),
        backgroundColor: const Color(0xFF1A1A2E),
      ),
      backgroundColor: const Color(0xFF1A1A2E),
      body: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // 唤醒词提示
          const Text(
            '嘿，小智',
            style: TextStyle(
              color: Colors.blue,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '或按住下方按钮开始对话',
            style: TextStyle(color: Colors.grey[400]),
          ),
          
          const SizedBox(height: 60),
          
          // 录音按钮
          _buildRecordButton(voiceService, wsService),
          
          const SizedBox(height: 40),
          
          // 转文字显示
          if (voiceService.transcript != null)
            Container(
              margin: const EdgeInsets.all(20),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF16213E),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  Row(
                    children: const [
                      Icon(Icons.translate, color: Colors.blue),
                      SizedBox(width: 8),
                      Text('识别结果', style: TextStyle(color: Colors.blue)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    voiceService.transcript!,
                    style: const TextStyle(color: Colors.white, fontSize: 18),
                  ),
                ],
              ),
            ),
          
          // 状态指示
          if (voiceService.isListening)
            _buildListeningIndicator(),
        ],
      ),
    );
  }
  
  Widget _buildRecordButton(VoiceService voiceService, WebSocketService wsService) {
    return GestureDetector(
      onTapDown: (_) => _startRecording(voiceService),
      onTapUp: (_) => _stopRecording(voiceService, wsService),
      onTapCancel: () => _stopRecording(voiceService, wsService),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 120,
        height: 120,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: voiceService.isListening 
              ? Colors.red.withOpacity(0.8) 
              : Colors.blue,
          boxShadow: [
            BoxShadow(
              color: (voiceService.isListening ? Colors.red : Colors.blue)
                  .withOpacity(0.5),
              blurRadius: 30,
              spreadRadius: 10,
            ),
          ],
        ),
        child: Icon(
          voiceService.isListening ? Icons.stop : Icons.mic,
          size: 50,
          color: Colors.white,
        ),
      ),
    );
  }
  
  Widget _buildListeningIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(5, (index) {
        return AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          width: 8,
          height: 8,
          margin: const EdgeInsets.symmetric(horizontal: 4),
          decoration: BoxDecoration(
            color: Colors.blue,
            borderRadius: BorderRadius.circular(4),
          ),
          transform: Matrix4.rotationZ(index * 0.5),
        );
      }),
    );
  }
  
  void _startRecording(VoiceService voiceService) async {
    await voiceService.startListening();
  }
  
  void _stopRecording(VoiceService voiceService, WebSocketService wsService) async {
    await voiceService.stopListening();
    
    if (voiceService.transcript != null) {
      // 发送到 Gateway
      wsService.sendChat(voiceService.transcript!);
      
      // 切换到聊天界面
      Navigator.pop(context);
    }
  }
}
