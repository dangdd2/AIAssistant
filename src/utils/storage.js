import { STORAGE_KEYS, DEFAULT_OLLAMA_URL, DEFAULT_MODEL_NAME } from '../constants/config';

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
