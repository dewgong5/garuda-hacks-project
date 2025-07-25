<img src="/src/assets/logo.png" alt="LockIn Logo" width="200"/>

# LockIn - AI Interview Assistant

A sophisticated AI-powered interview assistance application built with Electron and Google's Gemini AI.

## About

LockIn is an intelligent interview assistant that helps users prepare for and navigate interviews using advanced AI capabilities. Built with modern web technologies and a modular architecture.

## Features

- **AI-Powered Assistance**: Powered by Google's Gemini Live API
- **Real-time Audio Processing**: Voice recognition and processing
- **Screenshot Analysis**: Visual question analysis capabilities
- **Cross-platform Support**: Works on Windows, macOS, and Linux
- **Modular Architecture**: Clean, maintainable codebase with service layer design
- **State Management**: Centralized state management for reactive UI updates

## Setup

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Run the Application**
   ```bash
   npm start
   ```

## Architecture

The application follows a modern service-oriented architecture:

- **Service Layer**: Modular services for Gemini, Audio, Screenshot, and Conversation management
- **State Management**: Centralized reactive state management
- **IPC Layer**: Structured inter-process communication
- **Component System**: Web components built with LitElement

## Development

### Project Structure
```
src/
├── services/          # Service layer (Gemini, Audio, Screenshot, Conversation)
├── store/            # State management
├── ipc/              # IPC communication layer
├── components/       # UI components
├── utils/            # Utility functions
└── assets/           # Static assets
```

### Building
```bash
# Package the application
npm run package

# Create distributable
npm run make
```

## Author

**Jephtha-T** - [GitHub](https://github.com/Jephtha-T) - jephtha909@gmail.com

## Repository

[https://github.com/dewgong5/garuda-hacks-project](https://github.com/dewgong5/garuda-hacks-project)


