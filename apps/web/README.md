# Personal AI Agent - Web UI

React 18 Web interface for Personal AI Agent Gateway.

## Features

- 💬 **Chat Interface** - Real-time messaging with AI assistant
- 🎤 **Voice Input** - Speech-to-text via microphone
- 🔊 **Voice Output** - Text-to-speech synthesis
- 🛒 **Skill Marketplace** - Browse and install Skills
- ⚙️ **Settings** - Configure Gateway URL, theme, voice settings
- 📱 **Responsive** - Works on desktop and mobile

## Quick Start

```bash
cd apps/web

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

## Configuration

Default Gateway URL: `ws://127.0.0.1:18789`

Change in Settings panel or via localStorage:
```javascript
localStorage.setItem('gatewayUrl', 'ws://your-gateway:18789')
```

## Tech Stack

- React 18
- Tailwind CSS
- Vite
- Lucide React (icons)
- Native WebSocket API

## Project Structure

```
apps/web/
├── src/
│   ├── components/     # React components
│   │   ├── ChatInput.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── Marketplace.jsx
│   │   ├── MessageList.jsx
│   │   └── Settings.jsx
│   ├── context/        # React context
│   │   └── AppContext.jsx
│   ├── services/       # Services
│   │   └── websocket.js
│   ├── App.jsx
│   └── main.jsx
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.js
```

## WebSocket API

Connect to Gateway at `ws://host:port/ws`:

### Send Messages
```javascript
// Chat message
ws.send(JSON.stringify({ type: 'chat.send', content: 'Hello' }));

// Get history
ws.send(JSON.stringify({ type: 'chat.history', limit: 50 }));

// Subscribe
ws.send(JSON.stringify({ type: 'chat.subscribe', channels: ['chat'] }));
```

### Receive Messages
```javascript
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  switch (msg.type) {
    case 'chat.message':
      console.log('New message:', msg);
      break;
    case 'chat.history':
      console.log('History:', msg.messages);
      break;
  }
};
```

## License

MIT
