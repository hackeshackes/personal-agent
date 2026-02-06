/**
 * Message Model - 消息模型
 */

class Message {
  final String id;
  final String content;
  final String role; // 'user' | 'assistant' | 'system'
  final String type; // 'text' | 'voice' | 'image'
  final DateTime timestamp;
  final Map<String, dynamic>? metadata;
  
  Message({
    required this.id,
    required this.content,
    required this.role,
    required this.type,
    required this.timestamp,
    this.metadata,
  });
  
  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] ?? DateTime.now().toIsoString(),
      content: json['content'] ?? '',
      role: json['role'] ?? 'user',
      type: json['type'] ?? 'text',
      timestamp: json['timestamp'] != null 
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      metadata: json['metadata'],
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'role': role,
      'type': type,
      'timestamp': timestamp.toIsoString(),
      'metadata': metadata,
    };
  }
}
