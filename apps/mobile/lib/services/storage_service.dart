/**
 * Storage Service - 本地存储服务
 */

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'models/message.dart';

class StorageService extends ChangeNotifier {
  SharedPreferences? _prefs;
  final List<Message> _messageHistory = [];
  
  // 配置项
  String _gatewayHost = '127.0.0.1';
  int _gatewayPort = 18789;
  String _deviceName = '';
  bool _notificationsEnabled = true;
  
  // Getters
  String get gatewayHost => _gatewayHost;
  int get gatewayPort => _gatewayPort;
  String get deviceName => _deviceName;
  bool get notificationsEnabled => _notificationsEnabled;
  List<Message> get messageHistory => _messageHistory;
  
  /**
   * 初始化
   */
  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    _loadSettings();
    print('💾 存储服务已初始化');
  }
  
  /**
   * 加载设置
   */
  void _loadSettings() {
    _gatewayHost = _prefs?.getString('gateway_host') ?? '127.0.0.1';
    _gatewayPort = _prefs?.getInt('gateway_port') ?? 18789;
    _deviceName = _prefs?.getString('device_name') ?? '';
    _notificationsEnabled = _prefs?.getBool('notifications') ?? true;
    
    // 加载消息历史
    final messagesJson = _prefs?.getStringList('message_history') ?? [];
    _messageHistory = messagesJson
        .map((e) => Message.fromJson(jsonDecode(e)))
        .toList();
  }
  
  /**
   * 保存设置
   */
  Future<void> saveSettings() async {
    await _prefs?.setString('gateway_host', _gatewayHost);
    await _prefs?.setInt('gateway_port', _gatewayPort);
    await _prefs?.setString('device_name', _deviceName);
    await _prefs?.setBool('notifications', _notificationsEnabled);
    notifyListeners();
  }
  
  /**
   * 设置 Gateway 地址
   */
  Future<void> setGateway(String host, int port) async {
    _gatewayHost = host;
    _gatewayPort = port;
    await saveSettings();
  }
  
  /**
   * 设置设备名称
   */
  Future<void> setDeviceName(String name) async {
    _deviceName = name;
    await saveSettings();
  }
  
  /**
   * 设置通知开关
   */
  Future<void> setNotifications(bool enabled) async {
    _notificationsEnabled = enabled;
    await saveSettings();
  }
  
  /**
   * 添加消息到历史
   */
  Future<void> addMessage(Message message) async {
    _messageHistory.add(message);
    if (_messageHistory.length > 100) {
      _messageHistory.removeAt(0);
    }
    
    final messagesJson = _messageHistory
        .map((e) => jsonEncode(e.toJson()))
        .toList();
    await _prefs?.setStringList('message_history', messagesJson);
    notifyListeners();
  }
  
  /**
   * 清空消息历史
   */
  Future<void> clearHistory() async {
    _messageHistory.clear();
    await _prefs?.remove('message_history');
    notifyListeners();
  }
  
  /**
   * 获取所有设置
   */
  Map<String, dynamic> getSettings() {
    return {
      'gatewayHost': _gatewayHost,
      'gatewayPort': _gatewayPort,
      'deviceName': _deviceName,
      'notifications': _notificationsEnabled,
      'messageCount': _messageHistory.length,
    };
  }
}
