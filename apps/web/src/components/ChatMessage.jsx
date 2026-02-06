import React from 'react';
import { Bot, User, Volume2, VolumeX, Copy, Check } from 'lucide-react';

function ChatMessage({ message, isLatest }) {
  const isUser = message.role === 'user' || message.type === 'chat.send';
  const isSystem = message.type === 'connected' || message.type === 'error';
  
  const formatContent = (content) => {
    if (typeof content === 'string') return content;
    if (content?.text) return content.text;
    if (content?.content) return content.content;
    return JSON.stringify(content, null, 2);
  };

  const content = formatContent(message.content || message);
  const timestamp = message.timestamp || new Date().toLocaleTimeString();

  if (isSystem) {
    return (
      <div className="flex justify-center my-4">
        <div className="bg-white/10 text-white/60 px-4 py-2 rounded-full text-sm">
          {message.type === 'connected' ? '🟢 已连接到 Gateway' : `⚠️ ${message.message || content}`}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''} ${isLatest ? 'animate-fade-in' : ''}`}>
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-primary-600' : 'bg-gradient-to-br from-purple-500 to-pink-500'
      }`}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-3 rounded-2xl ${
          isUser 
            ? 'bg-primary-600 text-white rounded-br-md' 
            : 'bg-white/10 text-white rounded-bl-md'
        }`}>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-xs text-white/40">
          <span>{timestamp}</span>
          {!isUser && (
            <button className="hover:text-white/80 transition-colors" title="复制">
              <Copy size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatMessage;
