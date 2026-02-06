/**
 * WebSocket Service - WebSocket 通信服务
 */

import 'package:flutter/foundation.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:web_socket_channel/status.dart' as ws_status;
import 'dart:convert';

class WebSocketService extends ChangeNotifier {
  WebSocketChannel? _channel;
  String _host = '127.0.0.1';
  int _port = 18789;
  bool _connected = false;
  String? _pairingCode;
  
  final List<Map<String, dynamic>> _messages = [];
  
  // 连接状态回调
  Function(bool)? onConnectionChange;
  Function(Map<String, dynamic>)? onMessage;
  
  set host(String host) => _host = host;
  set port(int port) => _port = port;
  
  bool get connected => _connected;
  String? get pairingCode => _pairingCode;
  List<Map<String, dynamic>> get messages => _messages;
  
  /**
   * 连接到 Gateway
   */
  Future<void> connect() async {
    try {
      final uri = Uri.parse('ws://$_host:$_port/ws');
      _channel = WebSocketChannel.connect(uri);
      
      _channel!.stream.listen(
        (data) => _handleMessage(data),
        onError: (error) => _handleError(error),
        onDone: () => _handleDisconnect(),
      );
      
      _connected = true;
      notifyListeners();
      onConnectionChange?.call(true);
      
      print('🔌 WebSocket 已连接: $uri');
    } catch (e) {
      print('WebSocket 连接失败: $e');
      _connected = false;
    }
  }
  
  /**
   * 断开连接
   */
  void disconnect() {
    _channel?.sink.close(ws_status.goingAway);
    _connected = false;
    notifyListeners();
    onConnectionChange?.call(false);
  }
  
  /**
   * 发送消息
   */
  void send(String type, Map<String, dynamic> data) {
    if (_connected && _channel != null) {
      final message = {
        'type': type,
        ...data,
      };
      _channel!.sink.add(jsonEncode(message));
      print('📤 发送: $type');
    }
  }
  
  /**
   * 发起配对
   */
  void pair(String code, Map<String, dynamic> nodeInfo) {
    _pairingCode = code;
    send('pair', {
      'code': code,
      'nodeInfo': nodeInfo,
    });
  }
  
  /**
   * 发送聊天消息
   */
  void sendChat(String content, {String? target}) {
    send('chat.send', {
      'content': content,
      'target': target,
    });
  }
  
  /**
   * 获取历史消息
   */
  void getHistory({String? sessionId, int limit = 50}) {
    send('chat.history', {
      'sessionId': sessionId,
      'limit': limit,
    });
  }
  
  /**
   * 处理消息
   */
  void _handleMessage(dynamic data) {
    try {
      final message = jsonDecode(data) as Map<String, dynamic>;
      _messages.add(message);
      
      print('📨 收到: ${message['type']}');
      onMessage?.call(message);
      notifyListeners();
    } catch (e) {
      print('消息解析失败: $e');
    }
  }
  
  /**
   * 处理错误
   */
  void _handleError(dynamic error) {
    print('WebSocket 错误: $error');
    _connected = false;
    notifyListeners();
    onConnectionChange?.call(false);
  }
  
  /**
   * 处理断开
   */
  void _handleDisconnect() {
    print('WebSocket 已断开');
    _connected = false;
    notifyListeners();
    onConnectionChange?.call(false);
  }
  
  /**
   * 获取连接状态
   */
  Map<String, dynamic> getStatus() {
    return {
      'connected': _connected,
      'host': _host,
      'port': _port,
      'pairingCode': _pairingCode,
      'messageCount': _messages.length,
    };
  }
}
