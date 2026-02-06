import React, { useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import { useApp } from '../context/AppContext';

function MessageList() {
  const { messages, currentChat, connected } = useApp();
  const containerRef = useRef(null);
  const shouldAutoScroll = useRef(true);

  // Use messages from context or current chat
  const messageList = messages.length > 0 ? messages : (currentChat?.messages || []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (shouldAutoScroll.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messageList]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    shouldAutoScroll.current = scrollHeight - scrollTop === clientHeight;
  };

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2"
      style={{ 
        background: 'transparent',
        minHeight: 0
      }}
    >
      {/* Welcome message if no messages */}
      {messageList.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-white/60">
          <div className="text-6xl mb-4">🐙</div>
          <h2 className="text-xl font-semibold mb-2">Personal AI Agent</h2>
          <p className="text-sm text-center max-w-md">
            {connected 
              ? '开始输入消息与 AI 助手对话'
              : '请先连接到 Gateway (ws://127.0.0.1:18789)'
            }
          </p>
        </div>
      )}

      {/* Message list */}
      {messageList.map((message, index) => (
        <ChatMessage 
          key={message.id || index} 
          message={message}
          isLatest={index === messageList.length - 1}
        />
      ))}

      {/* Typing indicator */}
      {connected && messageList.length > 0 && (
        <div className="flex gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-lg">🐙</span>
          </div>
          <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageList;
