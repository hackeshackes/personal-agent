/**
 * Home Screen - 首页
 */

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/websocket_service.dart';
import '../services/voice_service.dart';
import '../services/storage_service.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _initServices();
  }
  
  Future<void> _initServices() async {
    final wsService = Provider.of<WebSocketService>(context, listen: false);
    
    wsService.onConnectionChange = (connected) {
      if (mounted) setState(() {});
    };
    
    // 自动连接
    await wsService.connect();
  }
  
  @override
  Widget build(BuildContext context) {
    final wsService = Provider.of<WebSocketService>(context);
    final voiceService = Provider.of<VoiceService>(context);
    final storageService = Provider.of<StorageService>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal AI Agent'),
        backgroundColor: const Color(0xFF1A1A2E),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => Navigator.pushNamed(context, '/settings'),
          ),
        ],
      ),
      backgroundColor: const Color(0xFF1A1A2E),
      body: Column(
        children: [
          // 连接状态
          _buildConnectionStatus(wsService),
          
          // 主要功能区
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // 状态卡片
                  _buildStatusCard(wsService, voiceService),
                  
                  const SizedBox(height: 40),
                  
                  // 功能按钮
                  _buildActionButtons(),
                ],
              ),
            ),
          ),
          
          // 底部按钮
          _buildBottomButtons(),
        ],
      ),
    );
  }
  
  Widget _buildConnectionStatus(WebSocketService wsService) {
    return Container(
      padding: const EdgeInsets.all(12),
      color: wsService.connected 
          ? Colors.green.withOpacity(0.2) 
          : Colors.orange.withOpacity(0.2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            wsService.connected ? Icons.cloud_done : Icons.cloud_off,
            color: wsService.connected ? Colors.green : Colors.orange,
          ),
          const SizedBox(width: 8),
          Text(
            wsService.connected 
                ? '已连接到 Gateway' 
                : '未连接 - 点击连接',
            style: TextStyle(
              color: wsService.connected ? Colors.green : Colors.orange,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatusCard(WebSocketService wsService, VoiceService voiceService) {
    return Card(
      color: const Color(0xFF16213E),
      margin: const EdgeInsets.all(20),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // 头像
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.blue,
              child: const Icon(
                Icons.smart_toy,
                size: 50,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '小智',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              wsService.connected ? '在线' : '离线',
              style: TextStyle(
                color: wsService.connected ? Colors.green : Colors.grey,
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildActionButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildActionButton(
          icon: Icons.mic,
          label: '语音',
          onTap: () => Navigator.pushNamed(context, '/voice'),
        ),
        const SizedBox(width: 20),
        _buildActionButton(
          icon: Icons.chat,
          label: '对话',
          onTap: () => Navigator.pushNamed(context, '/chat'),
        ),
      ],
    );
  }
  
  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.blue.withOpacity(0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.blue, width: 2),
            ),
            child: Icon(icon, size: 40, color: Colors.blue),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(color: Colors.white)),
        ],
      ),
    );
  }
  
  Widget _buildBottomButtons() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.qr_code),
              label: const Text('扫码配对'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blue,
                foregroundColor: Colors.white,
              ),
            ),
          ),
          const SizedBox(width: 16),
          ElevatedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.add),
            label: const Text('添加节点'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
