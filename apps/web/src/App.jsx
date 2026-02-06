import React, { useEffect } from 'react';
import { Bot, Settings, ShoppingBag, Wifi, WifiOff, Plus, MessageSquare } from 'lucide-react';
import { AppProvider, useApp } from './context/AppContext';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import SettingsPanel from './components/Settings';
import Marketplace from './components/Marketplace';

// Main App content
function AppContent() {
  const { 
    connected, 
    showSettings, 
    showMarketplace,
    toggleSettings,
    toggleMarketplace,
    connect
  } = useApp();

  // Auto-connect on load
  useEffect(() => {
    connect();
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-white">Personal AI Agent</h1>
            <div className="flex items-center gap-1 text-xs">
              {connected ? (
                <>
                  <Wifi size={12} className="text-green-400" />
                  <span className="text-green-400">已连接</span>
                </>
              ) : (
                <>
                  <WifiOff size={12} className="text-red-400" />
                  <span className="text-red-400">未连接</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* New Chat */}
          <button 
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="新建对话"
          >
            <Plus size={20} />
          </button>
          
          {/* Marketplace */}
          <button 
            onClick={toggleMarketplace}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="Skill 市场"
          >
            <ShoppingBag size={20} />
          </button>

          {/* Settings */}
          <button 
            onClick={toggleSettings}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            title="设置"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex flex-col w-64 border-r border-white/10 bg-white/5">
          <div className="p-4">
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Plus size={16} />
              新建对话
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-xs font-medium text-white/40 px-2 mb-2">历史对话</div>
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 rounded-lg bg-white/10 text-white text-sm flex items-center gap-2">
                <MessageSquare size={14} />
                新对话
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 text-sm flex items-center gap-2">
                <MessageSquare size={14} />
                市场分析讨论
              </button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 text-white/60 text-sm flex items-center gap-2">
                <MessageSquare size={14} />
                代码审查
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-sm">🐙</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white truncate">我的助理</div>
                <div className="text-xs text-white/40">Personal</div>
              </div>
            </div>
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <MessageList />
          <ChatInput />
        </main>
      </div>

      {/* Modals */}
      {showSettings && <SettingsPanel onClose={toggleSettings} />}
      {showMarketplace && <Marketplace onClose={toggleMarketplace} />}
    </div>
  );
}

// Main App component with Provider
function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
