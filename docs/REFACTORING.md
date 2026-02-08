# Ollama Chat App - Refactoring Documentation

## Overview

This document explains the refactoring of `App.js` from a monolithic 500+ line file into a well-organized, maintainable architecture following React best practices.

## Project Structure

```
src/
├── components/
│   ├── Chat/
│   │   ├── ChatHeader.jsx      # Header with title and action buttons
│   │   ├── ChatInput.jsx       # Message input and send button
│   │   ├── LoadingMessage.jsx  # Typing indicator
│   │   ├── Message.jsx         # Single message display
│   │   ├── MessageList.jsx     # Container for all messages
│   │   ├── WelcomeMessage.jsx  # Empty state with tips
│   │   └── index.js            # Barrel exports
│   ├── Settings/
│   │   ├── SettingsPanel.jsx   # URL and model configuration
│   │   └── index.js
│   ├── Uploads/
│   │   ├── UploadsPanel.jsx    # Uploaded files display
│   │   └── index.js
│   └── index.js                # Main components export
├── hooks/
│   ├── useChat.js              # Chat state and API logic
│   ├── useSettings.js          # Settings state management
│   ├── useFileUpload.js        # File upload handling
│   └── index.js
├── services/
│   ├── supabaseClient.js       # Supabase client instance
│   ├── supabaseService.js      # Supabase CRUD operations
│   ├── ollamaService.js        # Ollama API calls
│   └── index.js
├── utils/
│   ├── formatters.js           # Display formatting utilities
│   ├── storage.js              # LocalStorage helpers
│   └── index.js
├── constants/
│   ├── config.js               # App configuration and constants
│   └── index.js
├── App.js                      # Main app composition (~160 lines)
├── App.css                     # Styles
└── index.js                    # React entry point
```

## Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                        App.js                           │
│  (Composition layer - wires everything together)        │
└───────────────┬─────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    ▼                       ▼
┌─────────┐           ┌──────────┐
│  Hooks  │           │Components│
│ useChat │           │ Message  │
│useSettings          │ ChatInput│
└────┬────┘           └──────────┘
     │
     ▼
┌──────────┐     ┌─────────┐     ┌───────────┐
│ Services │ ◄── │  Utils  │ ◄── │ Constants │
│supabase  │     │ storage │     │  config   │
│ ollama   │     │formatters     └───────────┘
└──────────┘     └─────────┘
```

---

## Layer Details

### 1. Constants Layer (`constants/config.js`)

Centralizes all configuration values and magic strings.

```javascript
// Default configuration values
export const DEFAULT_OLLAMA_URL = 'http://localhost:11434';
export const DEFAULT_MODEL_NAME = 'kimi-k2.5:cloud';

// Storage keys
export const STORAGE_KEYS = {
  OLLAMA_URL: 'ollama-url',
  OLLAMA_MODEL: 'ollama-model',
  CHAT_HISTORY: 'ollama-chat-history',
  USER_ID: 'user_id',
};

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  TEXT: ['.txt', '.md', '.json'],
  IMAGE: ['image/'],
  PDF: ['.pdf', 'application/pdf'],
};

// File upload accept string
export const FILE_ACCEPT = 'image/*,.txt,.md,.json,.pdf';
```

**Benefits:**
- Single source of truth for configuration
- Easy to modify values in one place
- Avoids typos in repeated strings

---

### 2. Utils Layer (`utils/`)

#### `storage.js` - LocalStorage Abstraction

```javascript
import { STORAGE_KEYS, DEFAULT_OLLAMA_URL, DEFAULT_MODEL_NAME } from '../constants/config';

export const getUserId = () => {
  let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  }
  return id;
};

export const getSavedOllamaUrl = () => {
  return localStorage.getItem(STORAGE_KEYS.OLLAMA_URL) || DEFAULT_OLLAMA_URL;
};

export const saveSettings = (url, model) => {
  localStorage.setItem(STORAGE_KEYS.OLLAMA_URL, url);
  localStorage.setItem(STORAGE_KEYS.OLLAMA_MODEL, model);
};

export const getLocalChatHistory = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  return saved ? JSON.parse(saved) : [];
};

export const saveLocalChatHistory = (messages) => {
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
};
```

#### `formatters.js` - Display Utilities

```javascript
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const getRoleDisplay = (role) => {
  const displays = {
    user: { icon: '👤', label: 'You' },
    assistant: { icon: '🤖', label: 'AI' },
    system: { icon: '🔔', label: 'System' },
  };
  return displays[role] || displays.assistant;
};
```

**Benefits:**
- Pure functions are easy to test
- Reusable across components
- Centralized formatting logic

---

### 3. Services Layer (`services/`)

#### `supabaseService.js` - Database Operations

```javascript
import { supabase } from './supabaseClient';

export const loadMessages = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // No existing conversation
    }
    throw error;
  }

  return data?.messages || null;
};

export const saveMessages = async (userId, messages) => {
  const { error } = await supabase
    .from('conversations')
    .upsert(
      {
        user_id: userId,
        messages: messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
};

export const deleteMessages = async (userId) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};
```

#### `ollamaService.js` - Ollama API

```javascript
export const buildConversationHistory = (messages, uploadedFiles = [], uploadedImages = []) => {
  let conversationHistory = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role, content: m.content }));

  // Add uploaded documents as context
  if (uploadedFiles.length > 0) {
    const contextMessage = {
      role: 'system',
      content: `You have access to the following documents...\n\n${
        uploadedFiles.map((f) => `=== ${f.name} ===\n${f.content}\n`).join('\n')
      }`,
    };
    conversationHistory = [contextMessage, ...conversationHistory];
  }

  // Add images for vision models
  if (uploadedImages.length > 0 && conversationHistory.length > 0) {
    const lastUserMsgIndex = conversationHistory.length - 1;
    conversationHistory[lastUserMsgIndex].images = uploadedImages.map((img) => img.data);
  }

  return conversationHistory;
};

export const sendChatMessage = async (ollamaUrl, modelName, conversationHistory) => {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelName,
      messages: conversationHistory,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Model "${modelName}" not found...`);
    }
    throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
};
```

**Benefits:**
- Decouples external APIs from React components
- Easy to mock in tests
- Swap backend services without touching components

---

### 4. Custom Hooks (`hooks/`)

#### `useSettings.js` - Settings State Management

```javascript
import { useState, useCallback } from 'react';
import { getSavedOllamaUrl, getSavedModelName, saveSettings as saveSettingsToStorage } from '../utils/storage';

export const useSettings = () => {
  const [ollamaUrl, setOllamaUrl] = useState(getSavedOllamaUrl);
  const [modelName, setModelName] = useState(getSavedModelName);
  const [showSettings, setShowSettings] = useState(false);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const saveSettings = useCallback(() => {
    saveSettingsToStorage(ollamaUrl, modelName);
    setShowSettings(false);
  }, [ollamaUrl, modelName]);

  return {
    ollamaUrl,
    setOllamaUrl,
    modelName,
    setModelName,
    showSettings,
    toggleSettings,
    saveSettings,
  };
};
```

#### `useChat.js` - Main Chat Logic

```javascript
export const useChat = (ollamaUrl, modelName, uploadedFiles, uploadedImages) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(getUserId);
  const messagesEndRef = useRef(null);

  // Load chat history from Supabase on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        const cloudMessages = await loadMessages(userId);
        if (cloudMessages) {
          setMessages(cloudMessages);
        }
      } catch (error) {
        // Fallback to localStorage
        const localMessages = getLocalChatHistory();
        if (localMessages.length > 0) {
          setMessages(localMessages);
        }
      }
    };
    loadChatHistory();
  }, [userId]);

  // Save messages to Supabase when they change
  useEffect(() => {
    const persistMessages = async () => {
      if (messages.length === 0) return;
      saveLocalChatHistory(messages); // Backup
      await saveMessages(userId, messages);
    };
    persistMessages();
  }, [messages, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const conversationHistory = buildConversationHistory(
        [...messages, userMessage],
        uploadedFiles,
        uploadedImages
      );
      
      const responseContent = await sendChatMessage(ollamaUrl, modelName, conversationHistory);
      
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      }]);
    } catch (error) {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `❌ ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputMessage, messages, ollamaUrl, modelName, uploadedFiles, uploadedImages]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyPress,
    clearHistory,
    addMessage,
  };
};
```

**Benefits:**
- Encapsulates related state and side effects
- Reusable across components
- Clean separation of concerns
- Easier to test

---

### 5. Components (`components/`)

#### Component Responsibilities

| Component | Purpose |
|-----------|---------|
| `Message.jsx` | Renders a single message with role icon and timestamp |
| `LoadingMessage.jsx` | Shows typing indicator animation |
| `WelcomeMessage.jsx` | Displays welcome text and tips when chat is empty |
| `MessageList.jsx` | Composes Message, LoadingMessage, and WelcomeMessage |
| `ChatInput.jsx` | Text input field and send button |
| `ChatHeader.jsx` | App title, model name, and action buttons |
| `SettingsPanel.jsx` | Form for Ollama URL and model configuration |
| `UploadsPanel.jsx` | Displays list of uploaded files and images |

#### Example: `Message.jsx`

```javascript
import React from 'react';
import { formatTimestamp, getRoleDisplay } from '../../utils/formatters';

const Message = ({ message }) => {
  const { icon, label } = getRoleDisplay(message.role);

  return (
    <div className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
      <div className="message-header">
        <span className="message-role">
          {icon} {label}
        </span>
        <span className="message-time">{formatTimestamp(message.timestamp)}</span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default Message;
```

#### Example: `MessageList.jsx`

```javascript
import React from 'react';
import Message from './Message';
import LoadingMessage from './LoadingMessage';
import WelcomeMessage from './WelcomeMessage';

const MessageList = ({ messages, isLoading, messagesEndRef }) => (
  <div className="messages-container">
    {messages.length === 0 ? (
      <WelcomeMessage />
    ) : (
      messages.map((message, index) => <Message key={index} message={message} />)
    )}
    {isLoading && <LoadingMessage />}
    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
```

**Benefits:**
- Single responsibility principle
- Small, focused components
- Easy to understand and modify
- Reusable

---

### 6. Barrel Exports

Every folder has an `index.js` for cleaner imports:

```javascript
// components/Chat/index.js
export { default as ChatHeader } from './ChatHeader';
export { default as ChatInput } from './ChatInput';
export { default as MessageList } from './MessageList';
export { default as Message } from './Message';
export { default as LoadingMessage } from './LoadingMessage';
export { default as WelcomeMessage } from './WelcomeMessage';
```

**Before (verbose imports):**
```javascript
import ChatHeader from './components/Chat/ChatHeader';
import ChatInput from './components/Chat/ChatInput';
import MessageList from './components/Chat/MessageList';
```

**After (clean imports):**
```javascript
import { ChatHeader, ChatInput, MessageList } from './components/Chat';
```

---

### 7. Refactored `App.js`

The main App component is now a thin composition layer:

```javascript
import React, { useState, useRef, useCallback } from 'react';
import './App.css';

// Components
import { ChatHeader, ChatInput, MessageList } from './components/Chat';
import { SettingsPanel } from './components/Settings';
import { UploadsPanel } from './components/Uploads';

// Hooks
import { useChat, useSettings } from './hooks';
import { SUPPORTED_FILE_TYPES } from './constants/config';

function App() {
  // Settings hook
  const {
    ollamaUrl, setOllamaUrl,
    modelName, setModelName,
    showSettings, toggleSettings, saveSettings,
  } = useSettings();

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  // Chat hook with file uploads
  const {
    messages, inputMessage, setInputMessage,
    isLoading, messagesEndRef,
    sendMessage, handleKeyPress, clearHistory, addMessage,
  } = useChat(ollamaUrl, modelName, uploadedFiles, uploadedImages);

  // File upload handlers...

  return (
    <div className="App">
      <div className="chat-container">
        <ChatHeader ... />
        {showSettings && <SettingsPanel ... />}
        {hasUploads && <UploadsPanel ... />}
        <MessageList ... />
        <ChatInput ... />
      </div>
    </div>
  );
}

export default App;
```

**Result:** Reduced from **500+ lines** to **~160 lines**

---

## Key Benefits of This Architecture

1. **Separation of Concerns** - Each layer has a specific responsibility
2. **Testability** - Services and utils are pure functions, hooks encapsulate state
3. **Maintainability** - Easy to find and modify specific functionality
4. **Reusability** - Components and hooks can be reused across the app
5. **Scalability** - Easy to add new features without modifying existing code
6. **Readability** - Small, focused files are easier to understand
7. **Team Collaboration** - Different team members can work on different layers

---

## How to Extend

### Adding a New Feature (e.g., Message Reactions)

1. Add constants to `constants/config.js`
2. Add API calls to `services/` (if needed)
3. Create a new hook in `hooks/` (if complex state)
4. Create new component(s) in `components/`
5. Wire it up in `App.js`

### Switching Backend (e.g., Supabase to Firebase)

1. Update `services/supabaseClient.js` → `services/firebaseClient.js`
2. Update `services/supabaseService.js` → `services/firebaseService.js`
3. Keep the same function signatures
4. No changes needed in components or hooks!
