import { useState, useCallback } from 'react';
import { getSavedOllamaUrl, getSavedModelName, saveSettings as saveSettingsToStorage } from '../utils/storage';

/**
 * Custom hook for managing Ollama settings
 * @returns {object} Settings state and handlers
 */
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
