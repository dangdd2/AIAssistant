import React, { useState, useEffect } from 'react';
import { FILE_ACCEPT } from '../../constants/config';
import { listModels } from '../../services/ollamaService';

/**
 * Chat header with title, model switcher, and action buttons
 */
const ChatHeader = ({
  ollamaUrl,
  modelName,
  onModelChange,
  fileInputRef,
  onFileUpload,
  onTriggerFileInput,
  onClearUploads,
  onToggleSettings,
  onClearHistory,
  hasUploads,
}) => {
  const [models, setModels] = useState([]);

  useEffect(() => {
    let cancelled = false;
    listModels(ollamaUrl).then((list) => {
      if (!cancelled) setModels(list);
    });
    return () => { cancelled = true; };
  }, [ollamaUrl]);

  const options = models.some((m) => m.name === modelName)
    ? models
    : [{ name: modelName }, ...models];

  return (
    <div className="chat-header">
      <div className="header-content">
        <h1>🤖 Ollama Chat</h1>
        {options.length > 0 ? (
          <select
            className="header-model-select"
            value={modelName}
            onChange={(e) => onModelChange(e.target.value)}
            title="Change model"
            aria-label="Select model"
          >
            {options.map((m) => (
              <option key={m.name} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        ) : (
          <div className="model-info">{modelName}</div>
        )}
      </div>
      <div className="header-actions">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_ACCEPT}
          onChange={onFileUpload}
          style={{ display: 'none' }}
        />
        <button
          className="icon-button"
          onClick={onTriggerFileInput}
          title="Upload Files/Images"
        >
          📎
        </button>
        {hasUploads && (
          <button
            className="icon-button"
            onClick={onClearUploads}
            title="Clear Uploads"
          >
            🗑️📎
          </button>
        )}
        <button
          className="icon-button"
          onClick={onToggleSettings}
          title="Settings"
        >
          ⚙️
        </button>
        <button
          className="icon-button"
          onClick={onClearHistory}
          title="Delete this chat"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
