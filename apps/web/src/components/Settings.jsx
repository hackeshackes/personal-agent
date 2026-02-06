import React, { useState } from 'react';
import { X, Settings, Wifi, WifiOff, Moon, Sun, Mic, Volume2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

function SettingsPanel({ onClose }) {
  const { 
    gatewayUrl, 
    connected, 
    setGatewayUrl, 
    connect, 
    disconnect,
    settings,
    updateSettings,
    clearMessages
  } = useApp();

  const [urlInput, setUrlInput] = useState(gatewayUrl);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleSave = () => {
    setGatewayUrl(urlInput);
  };

  const handleConnect = () => {
    setGatewayUrl(urlInput);
    connect();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={20} />
            设置
          </h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Connection Status */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">Gateway 连接</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="ws://127.0.0.1:18789"
                className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-primary-500"
              />
              <button
                onClick={handleConnect}
                disabled={connected}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  connected 
                    ? 'bg-green-600/50 text-green-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700'
                }`}
              >
                {connected ? '已连接' : '连接'}
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <>
                  <Wifi size={16} className="text-green-400" />
                  <span className="text-green-400">已连接到 Gateway</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} className="text-red-400" />
                  <span className="text-red-400">未连接</span>
                </>
              )}
            </div>
          </div>

          {/* Theme */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">主题</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateSettings({ theme: 'dark' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'dark' ? 'bg-primary-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Moon size={16} />
                暗色
              </button>
              <button
                onClick={() => updateSettings({ theme: 'light' })}
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  settings.theme === 'light' ? 'bg-primary-600' : 'bg-white/10 hover:bg-white/20'
                }`}
              >
                <Sun size={16} />
                亮色
              </button>
            </div>
          </div>

          {/* Voice Settings */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">语音设置</label>
            <div className="space-y-2">
              <button
                onClick={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Mic size={18} />
                  <span>语音输入</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  settings.voiceEnabled ? 'bg-primary-600' : 'bg-white/20'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                    settings.voiceEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`} style={{ marginTop: '3px' }}></div>
                </div>
              </button>
              <button
                onClick={() => updateSettings({ speechEnabled: !settings.speechEnabled })}
                className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Volume2 size={18} />
                  <span>语音输出</span>
                </div>
                <div className={`w-10 h-6 rounded-full transition-colors ${
                  settings.speechEnabled ? 'bg-primary-600' : 'bg-white/20'
                }`}>
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                    settings.speechEnabled ? 'translate-x-5' : 'translate-x-1'
                  }`} style={{ marginTop: '3px' }}></div>
                </div>
              </button>
            </div>
          </div>

          {/* Auto-scroll */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">聊天设置</label>
            <button
              onClick={() => updateSettings({ autoScroll: !settings.autoScroll })}
              className="w-full flex items-center justify-between p-3 bg-white/10 rounded-lg"
            >
              <span>自动滚动到最新消息</span>
              <div className={`w-10 h-6 rounded-full transition-colors ${
                settings.autoScroll ? 'bg-primary-600' : 'bg-white/20'
              }`}>
                <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                  settings.autoScroll ? 'translate-x-5' : 'translate-x-1'
                }`} style={{ marginTop: '3px' }}></div>
              </div>
            </button>
          </div>

          {/* Clear Messages */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white/60">数据管理</label>
            {showConfirmClear ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    clearMessages();
                    setShowConfirmClear(false);
                  }}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  确认清除
                </button>
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowConfirmClear(true)}
                className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center gap-2"
              >
                <Trash2 size={16} />
                清除聊天记录
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 text-center text-xs text-white/40">
          Personal AI Agent v1.0
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
