import { STORAGE_KEYS, DEFAULT_OLLAMA_URL, DEFAULT_MODEL_NAME } from '../constants/config';

const { CHAT_CONVERSATION_PREFIX, CHAT_CONVERSATION_IDS, ACTIVE_CHAT_ID } = STORAGE_KEYS;

/**
 * Generate or retrieve user ID from localStorage
 * @returns {string} User ID
 */
export const getUserId = () => {
  let id = localStorage.getItem(STORAGE_KEYS.USER_ID);
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem(STORAGE_KEYS.USER_ID, id);
  }
  return id;
};

/**
 * Get saved Ollama URL from localStorage
 * @returns {string} Ollama URL
 */
export const getSavedOllamaUrl = () => {
  return localStorage.getItem(STORAGE_KEYS.OLLAMA_URL) || DEFAULT_OLLAMA_URL;
};

/**
 * Get saved model name from localStorage
 * @returns {string} Model name
 */
export const getSavedModelName = () => {
  return localStorage.getItem(STORAGE_KEYS.OLLAMA_MODEL) || DEFAULT_MODEL_NAME;
};

/**
 * Save settings to localStorage
 * @param {string} url - Ollama URL
 * @param {string} model - Model name
 */
export const saveSettings = (url, model) => {
  localStorage.setItem(STORAGE_KEYS.OLLAMA_URL, url);
  localStorage.setItem(STORAGE_KEYS.OLLAMA_MODEL, model);
};

/**
 * Get chat history from localStorage (fallback)
 * @returns {Array} Messages array
 */
export const getLocalChatHistory = () => {
  const saved = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
  return saved ? JSON.parse(saved) : [];
};

/**
 * Save chat history to localStorage (backup)
 * @param {Array} messages - Messages array
 */
export const saveLocalChatHistory = (messages) => {
  localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages));
};

/**
 * Clear local chat history
 */
export const clearLocalChatHistory = () => {
  localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
};

// --- Multi-chat (conversations) localStorage fallback ---

/**
 * Get list of conversation ids from localStorage
 * @returns {string[]}
 */
export const getLocalConversationIds = () => {
  const raw = localStorage.getItem(CHAT_CONVERSATION_IDS);
  return raw ? JSON.parse(raw) : [];
};

/**
 * Save list of conversation ids to localStorage
 * @param {string[]} ids
 */
export const setLocalConversationIds = (ids) => {
  localStorage.setItem(CHAT_CONVERSATION_IDS, JSON.stringify(ids));
};

/**
 * Get active conversation id from localStorage
 * @returns {string|null}
 */
export const getActiveConversationId = () => {
  return localStorage.getItem(ACTIVE_CHAT_ID);
};

/**
 * Set active conversation id in localStorage
 * @param {string|null} id
 */
export const setActiveConversationId = (id) => {
  if (id) localStorage.setItem(ACTIVE_CHAT_ID, id);
  else localStorage.removeItem(ACTIVE_CHAT_ID);
};

/**
 * Get one conversation from localStorage (title, messages, updatedAt)
 * @param {string} id
 * @returns {{ title: string, messages: Array, updatedAt: string }|null}
 */
export const getLocalConversation = (id) => {
  const raw = localStorage.getItem(CHAT_CONVERSATION_PREFIX + id);
  return raw ? JSON.parse(raw) : null;
};

/**
 * Save one conversation to localStorage
 * @param {string} id
 * @param {{ title: string, messages: Array, updatedAt: string }} data
 */
export const saveLocalConversation = (id, data) => {
  localStorage.setItem(CHAT_CONVERSATION_PREFIX + id, JSON.stringify(data));
};

/**
 * Remove one conversation from localStorage
 * @param {string} id
 */
export const deleteLocalConversation = (id) => {
  localStorage.removeItem(CHAT_CONVERSATION_PREFIX + id);
};
