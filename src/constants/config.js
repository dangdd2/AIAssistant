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
