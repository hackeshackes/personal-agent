import 'package:flutter/material.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:provider/provider.dart';
import 'services/websocket_service.dart';
import 'services/voice_service.dart';
import 'services/storage_service.dart';
import 'screens/home_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/voice_screen.dart';
import 'screens/settings_screen.dart';
import 'models/message.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // 初始化服务
  final wsService = WebSocketService();
  final voiceService = VoiceService();
  final storageService = StorageService();
  
  await storageService.init();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => wsService),
        ChangeNotifierProvider(create: (_) => voiceService),
        ChangeNotifierProvider(create: (_) => storageService),
      ],
      child: PersonalAgentApp(),
    ),
  );
}

class PersonalAgentApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Personal AI Agent',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.blue,
          surface: const Color(0xFF1A1A2E),
          onSurface: Colors.white,
        ),
      ),
      home: HomeScreen(),
      routes: {
        '/chat': (_) => ChatScreen(),
        '/voice': (_) => VoiceScreen(),
        '/settings': (_) => SettingsScreen(),
      },
    );
  }
}
