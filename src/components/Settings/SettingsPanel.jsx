import React, { useState, useEffect } from 'react';
import { listModels } from '../../services/ollamaService';

const CUSTOM_MODEL_VALUE = '__custom__';

/**
 * Settings panel for configuring Ollama URL and model
 */
const SettingsPanel = ({ ollamaUrl, setOllamaUrl, modelName, setModelName, onSave }) => {
  const [models, setModels] = useState([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setModelsError(null);
    setModelsLoading(true);
    listModels(ollamaUrl)
      .then((list) => {
        if (!cancelled) setModels(list);
      })
      .catch(() => {
        if (!cancelled) setModelsError('Could not load models');
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => { cancelled = true; };
  }, [ollamaUrl]);

  const isCustomModel = !models.some((m) => m.name === modelName);
  const selectValue = isCustomModel ? CUSTOM_MODEL_VALUE : modelName;

  const handleModelSelect = (e) => {
    const value = e.target.value;
    if (value === CUSTOM_MODEL_VALUE) {
      setModelName(modelName || '');
    } else {
      setModelName(value);
    }
  };

  return (
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
        <label>Model:</label>
        {modelsLoading ? (
          <span className="setting-hint">Loading models…</span>
        ) : (
          <>
            <select
              value={selectValue}
              onChange={handleModelSelect}
              className="model-select"
              aria-label="Select model"
            >
              <option value={CUSTOM_MODEL_VALUE}>
                {isCustomModel && modelName ? modelName : 'Custom model…'}
              </option>
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
            {isCustomModel && (
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. llama2"
                className="model-custom-input"
              />
            )}
          </>
        )}
        {modelsError && <span className="setting-error">{modelsError}</span>}
      </div>
      <button className="save-button" onClick={onSave}>
        Save Settings
      </button>
    </div>
  );
};

export default SettingsPanel;
