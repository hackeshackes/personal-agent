/**
 * Chat Screen - 聊天界面
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/websocket_service.dart';
import '../services/voice_service.dart';
import '../services/storage_service.dart';

class ChatScreen extends StatefulWidget {
  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  @override
  void initState() {
    super.initState();
    
    final wsService = Provider.of<WebSocketService>(context, listen: false);
    wsService.getHistory(limit: 50);
  }
  
  @override
  Widget build(BuildContext context) {
    final wsService = Provider.of<WebSocketService>(context);
    final storageService = Provider.of<StorageService>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('与小智对话'),
        backgroundColor: const Color(0xFF1A1A2E),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _clearHistory(),
          ),
        ],
      ),
      backgroundColor: const Color(0xFF1A1A2E),
      body: Column(
        children: [
          // 消息列表
          Expanded(
            child: _buildMessageList(wsService),
          ),
          
          // 输入框
          _buildInputArea(wsService),
        ],
      ),
    );
  }
  
  Widget _buildMessageList(WebSocketService wsService) {
    final messages = wsService.messages
        .where((m) => m['type'] == 'chat.message' || m['type'] == 'chat.history')
        .toList();
    
    if (messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey[600]),
            const SizedBox(height: 16),
            Text(
              '开始与小智对话吧',
              style: TextStyle(color: Colors.grey[400], fontSize: 18),
            ),
          ],
        ),
      );
    }
    
    return ListView.builder(
      controller: _scrollController,
      padding: const EdgeInsets.all(16),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        return _buildMessageBubble(message);
      },
    );
  }
  
  Widget _buildMessageBubble(Map<String, dynamic> message) {
    final isUser = message['sender'] == 'user' || message['role'] == 'user';
    final content = message['content'] ?? '';
    final timestamp = message['timestamp'] != null 
        ? DateTime.fromMillisecondsSinceEpoch(message['timestamp'])
        : DateTime.now();
    
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 8),
        padding: const EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isUser ? Colors.blue : const Color(0xFF16213E),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Text(
              content,
              style: const TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 4),
            Text(
              '${timestamp.hour}:${timestamp.minute.toString().padLeft(2, '0')}',
              style: TextStyle(
                color: Colors.white.withOpacity(0.6),
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildInputArea(WebSocketService wsService) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: const Color(0xFF16213E),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.mic, color: Colors.blue),
            onPressed: () => _startVoiceInput(),
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                hintText: '输入消息...',
                hintStyle: TextStyle(color: Colors.grey),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                filled: true,
                fillColor: Color(0xFF1A1A2E),
                contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              onSubmitted: (_) => _sendMessage(wsService),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.send, color: Colors.blue),
            onPressed: () => _sendMessage(wsService),
          ),
        ],
      ),
    );
  }
  
  void _sendMessage(WebSocketService wsService) {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    
    wsService.sendChat(text);
    _controller.clear();
    
    // 滚动到底部
    Future.delayed(const Duration(milliseconds: 100), () {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    });
  }
  
  void _startVoiceInput() async {
    final voiceService = Provider.of<VoiceService>(context, listen: false);
    await voiceService.startListening();
  }
  
  void _clearHistory() {
    final storageService = Provider.of<StorageService>(context, listen: false);
    storageService.clearHistory();
  }
}
