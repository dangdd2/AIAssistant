import React from 'react';

/**
 * Settings panel for configuring Ollama URL and model
 */
const SettingsPanel = ({ ollamaUrl, setOllamaUrl, modelName, setModelName, onSave }) => (
  <div className="settings-panel">
    <div className="setting-item">
      <label>Ollama URL:</label>
      <input
        type="text"
        value={ollamaUrl}
        onChange={(e) => setOllamaUrl(e.target.value)}
        placeholder="http://localhost:11434"
      />
    </div>
    <div className="setting-item">
      <label>Model Name:</label>
      <input
        type="text"
        value={modelName}
        onChange={(e) => setModelName(e.target.value)}
        placeholder="kimi-k2.5-cloud"
      />
    </div>
    <button className="save-button" onClick={onSave}>
      Save Settings
    </button>
  </div>
);

export default SettingsPanel;
