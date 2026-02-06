import React, { createContext, useContext, useReducer, useEffect } from 'react';
import wsService from '../services/websocket';

// Initial state
const initialState = {
  connected: false,
  gatewayUrl: `ws://127.0.0.1:18789`,
  messages: [],
  currentChat: {
    id: null,
    title: '新对话',
    messages: []
  },
  settings: {
    theme: 'dark',
    voiceEnabled: false,
    autoScroll: true
  },
  showSettings: false,
  showMarketplace: false,
};

// Action types
const ACTIONS = {
  SET_CONNECTED: 'SET_CONNECTED',
  SET_GATEWAY_URL: 'SET_GATEWAY_URL',
  ADD_MESSAGE: 'ADD_MESSAGE',
  SET_MESSAGES: 'SET_MESSAGES',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_CURRENT_CHAT: 'SET_CURRENT_CHAT',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',
  TOGGLE_SETTINGS: 'TOGGLE_SETTINGS',
  TOGGLE_MARKETPLACE: 'TOGGLE_MARKETPLACE',
};

// Reducer
function appReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_CONNECTED:
      return { ...state, connected: action.payload };
      
    case ACTIONS.SET_GATEWAY_URL:
      return { ...state, gatewayUrl: action.payload };
      
    case ACTIONS.ADD_MESSAGE:
      return {
        ...state,
        messages: [...state.messages, action.payload],
        currentChat: {
          ...state.currentChat,
          messages: [...state.currentChat.messages, action.payload]
        }
      };
      
    case ACTIONS.SET_MESSAGES:
      return {
        ...state,
        messages: action.payload,
        currentChat: {
          ...state.currentChat,
          messages: action.payload
        }
      };
      
    case ACTIONS.CLEAR_MESSAGES:
      return {
        ...state,
        messages: [],
        currentChat: {
          ...state.currentChat,
          messages: []
        }
      };
      
    case ACTIONS.SET_CURRENT_CHAT:
      return { ...state, currentChat: action.payload };
      
    case ACTIONS.UPDATE_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload }
      };
      
    case ACTIONS.TOGGLE_SETTINGS:
      return { ...state, showSettings: !state.showSettings };
      
    case ACTIONS.TOGGLE_MARKETPLACE:
      return { ...state, showMarketplace: !state.showMarketplace };
      
    default:
      return state;
  }
}

// Context
const AppContext = createContext(null);

// Provider component
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize WebSocket connection
  useEffect(() => {
    // Set up message handler
    const unsubscribeMessage = wsService.onMessage((message) => {
      // Handle different message types
      switch (message.type) {
        case 'connected':
          console.log('Connected to Gateway:', message);
          dispatch({ type: ACTIONS.SET_CONNECTED, payload: true });
          break;
          
        case 'chat.message':
        case 'message':
          dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message });
          break;
          
        case 'chat.history':
          dispatch({ type: ACTIONS.SET_MESSAGES, payload: message.messages || [] });
          break;
          
        case 'error':
          console.error('Gateway error:', message);
          break;
          
        default:
          dispatch({ type: ACTIONS.ADD_MESSAGE, payload: message });
      }
    });

    // Set up connection handler
    const unsubscribeConnection = wsService.onConnectionChange((connected) => {
      dispatch({ type: ACTIONS.SET_CONNECTED, payload: connected });
    });

    // Load saved settings
    const savedSettings = localStorage.getItem('personal-agent-settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: settings });
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    // Cleanup
    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, []);

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem('personal-agent-settings', JSON.stringify(state.settings));
  }, [state.settings]);

  // Methods
  const connect = () => wsService.connect();
  const disconnect = () => wsService.disconnect();
  const sendChat = (content, options) => wsService.sendChat(content, options);
  const setGatewayUrl = (url) => {
    wsService.setGateway(url.split(':')[1].replace('//', '').split(':')[0], parseInt(url.split(':')[2]) || 18789);
    dispatch({ type: ACTIONS.SET_GATEWAY_URL, payload: url });
  };
  const toggleSettings = () => dispatch({ type: ACTIONS.TOGGLE_SETTINGS });
  const toggleMarketplace = () => dispatch({ type: ACTIONS.TOGGLE_MARKETPLACE });
  const clearMessages = () => dispatch({ type: ACTIONS.CLEAR_MESSAGES });
  const updateSettings = (settings) => dispatch({ type: ACTIONS.UPDATE_SETTINGS, payload: settings });

  const value = {
    ...state,
    connect,
    disconnect,
    sendChat,
    setGatewayUrl,
    toggleSettings,
    toggleMarketplace,
    clearMessages,
    updateSettings,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

// Custom hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

export default AppContext;
