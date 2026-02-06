/**
 * Settings Screen - 设置界面
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/websocket_service.dart';
import '../services/storage_service.dart';

class SettingsScreen extends StatefulWidget {
  @override
  _SettingsScreenState createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final TextEditingController _hostController = TextEditingController();
  final TextEditingController _portController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    
    final storageService = Provider.of<StorageService>(context, listen: false);
    _hostController.text = storageService.gatewayHost;
    _portController.text = storageService.gatewayPort.toString();
    _nameController.text = storageService.deviceName;
  }
  
  @override
  Widget build(BuildContext context) {
    final wsService = Provider.of<WebSocketService>(context);
    final storageService = Provider.of<StorageService>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('设置'),
        backgroundColor: const Color(0xFF1A1A2E),
      ),
      backgroundColor: const Color(0xFF1A1A2E),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // 连接设置
          _buildSectionHeader('Gateway 连接'),
          _buildConnectionSettings(wsService, storageService),
          
          const SizedBox(height: 24),
          
          // 设备设置
          _buildSectionHeader('设备信息'),
          _buildDeviceSettings(storageService),
          
          const SizedBox(height: 24),
          
          // 通知设置
          _buildSectionHeader('通知'),
          _buildNotificationSettings(storageService),
          
          const SizedBox(height: 24),
          
          // 关于
          _buildSectionHeader('关于'),
          _buildAboutSection(),
        ],
      ),
    );
  }
  
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Text(
        title,
        style: const TextStyle(
          color: Colors.blue,
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
  
  Widget _buildConnectionSettings(WSService, StorageService storageService) {
    return Card(
      color: const Color(0xFF16213E),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(
              controller: _hostController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: 'Gateway 地址',
                labelStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
                ),
              ),
              onChanged: (value) => _saveGatewaySettings(storageService),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _portController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(
                labelText: '端口',
                labelStyle: TextStyle(color: Colors.grey),
                enabledBorder: UnderlineInputBorder(
                  borderSide: BorderSide(color: Colors.grey),
                ),
              ),
              keyboardType: TextInputType.number,
              onChanged: (value) => _saveGatewaySettings(storageService),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => wsService.connect(),
                    child: const Text('重新连接'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  wsService.connected ? '✓ 已连接' : '✗ 未连接',
                  style: TextStyle(
                    color: wsService.connected ? Colors.green : Colors.red,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildDeviceSettings(StorageService storageService) {
    return Card(
      color: const Color(0xFF16213E),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: TextField(
          controller: _nameController,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(
            labelText: '设备名称',
            labelStyle: TextStyle(color: Colors.grey),
            enabledBorder: UnderlineInputBorder(
              borderSide: BorderSide(color: Colors.grey),
            ),
          ),
          onChanged: (value) => _saveDeviceName(storageService),
        ),
      ),
    );
  }
  
  Widget _buildNotificationSettings(StorageService storageService) {
    return Card(
      color: const Color(0xFF16213E),
      child: SwitchListTile(
        title: const Text('消息通知', style: TextStyle(color: Colors.white)),
        subtitle: Text(
          storageService.notificationsEnabled ? '已开启' : '已关闭',
          style: TextStyle(color: Colors.grey[400]),
        ),
        value: storageService.notificationsEnabled,
        activeColor: Colors.blue,
        onChanged: (value) => _toggleNotifications(storageService, value),
      ),
    );
  }
  
  Widget _buildAboutSection() {
    return Card(
      color: const Color(0xFF16213E),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: const [
            Text(
              'Personal AI Agent',
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              '版本: 1.0.0',
              style: TextStyle(color: Colors.grey),
            ),
            SizedBox(height: 4),
            Text(
              '基于 OpenClaw 架构设计',
              style: TextStyle(color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
  
  void _saveGatewaySettings(StorageService storageService) {
    storageService.setGateway(
      _hostController.text,
      int.parse(_portController.text),
    );
  }
  
  void _saveDeviceName(StorageService storageService) {
    storageService.setDeviceName(_nameController.text);
  }
  
  void _toggleNotifications(StorageService storageService, bool value) {
    storageService.setNotifications(value);
    setState(() {});
  }
}
