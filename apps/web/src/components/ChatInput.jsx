import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Volume2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

function ChatInput() {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const inputRef = useRef(null);
  const { sendChat, connected } = useApp();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && connected) {
      sendChat(message.trim());
      setMessage('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      setIsRecording(false);
      // Stop recording and process audio
    } else {
      setIsRecording(true);
      // Start recording
    }
  };

  const toggleSpeech = () => {
    setIsSpeaking(!isSpeaking);
    // Toggle speech synthesis
  };

  return (
    <div className="border-t border-white/10 bg-white/5 backdrop-blur-lg">
      <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4">
        {/* Voice input button */}
        <button
          type="button"
          onClick={toggleRecording}
          className={`p-3 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={isRecording ? '停止录音' : '语音输入'}
        >
          {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={connected ? '输入消息...' : '请先连接 Gateway'}
            disabled={!connected}
            rows={1}
            className="w-full bg-white/10 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-primary-500 resize-none disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '120px' }}
          />
        </div>

        {/* Speech output button */}
        <button
          type="button"
          onClick={toggleSpeech}
          className={`p-3 rounded-full transition-all ${
            isSpeaking 
              ? 'bg-primary-600' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          title={isSpeaking ? '停止朗读' : '语音朗读'}
        >
          <Volume2 size={20} />
        </button>

        {/* Send button */}
        <button
          type="submit"
          disabled={!connected || !message.trim()}
          className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-white/10 disabled:opacity-50 rounded-full transition-all"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}

export default ChatInput;
