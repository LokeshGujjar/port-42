# 🌐 Port42 - Cyberpunk Learning Hub

A dark-themed, terminal-style platform where communities share and upvote learning resources. Built with a hacker aesthetic featuring matrix fonts and neon colors.

## 🚀 Features

- **Resource Sharing**: Submit links, tools, and tutorials
- **Community Voting**: Upvote valuable resources
- **Real-time Comments**: Chat threads for each resource
- **Topic Communities**: Organized by subjects (Python, AI, etc.)
- **Chrome Extension**: Quick submission from any webpage
- **Dark Cyberpunk UI**: Terminal/hacker portal aesthetic

## 📁 Project Structure

```
Port42/
├── backend/                 # Node.js + Express + MongoDB server
│   ├── controllers/         # Route handlers
│   ├── models/             # Database schemas
│   ├── routes/             # API endpoints
│   ├── middleware/         # Authentication, validation
│   ├── config/             # Database and app configuration
│   └── server.js           # Main server file
├── frontend/               # Vanilla JS/React frontend
│   ├── public/             # Static assets
│   ├── src/                # Source code
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Main pages
│   │   ├── utils/          # Helper functions
│   │   └── styles/         # CSS/styling
│   └── index.html          # Entry point
├── chrome-extension/       # Browser extension
│   ├── manifest.json       # Extension configuration
│   ├── popup.html          # Extension popup
│   ├── popup.js            # Popup logic
│   ├── content.js          # Page content interaction
│   └── background.js       # Background processes
└── docs/                   # Documentation and guides
```

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, MongoDB, Socket.io
- **Frontend**: Vanilla JavaScript (or React), HTML5, CSS3
- **Real-time**: Socket.io for live comments
- **Authentication**: JWT tokens
- **Extension**: Chrome Extension APIs
- **Styling**: Custom CSS with cyberpunk theme

## 🚦 Getting Started

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start
```

### 3. Chrome Extension
1. Open Chrome -> Extensions -> Developer mode
2. Load unpacked extension from `chrome-extension/` folder

## 📚 Learning Path

This project is broken into buildable pieces:

1. **Phase 1**: Basic server + database setup
2. **Phase 2**: User authentication system
3. **Phase 3**: Resource submission and display
4. **Phase 4**: Voting and comment system
5. **Phase 5**: Real-time features with Socket.io
6. **Phase 6**: Chrome extension integration
7. **Phase 7**: Cyberpunk UI styling

Each phase builds on the previous one, making it easy to learn and debug!

## 🎨 Design Philosophy

**Terminal/Hacker Aesthetic**:
- Dark backgrounds (#0a0a0a, #1a1a1a)
- Neon accents (green #00ff41, cyan #00ffff, purple #ff00ff)
- Monospace fonts (JetBrains Mono, Fira Code)
- ASCII art and terminal-style layouts
- Minimal, functional interfaces
