import React from 'react';
import { FILE_ACCEPT } from '../../constants/config';

/**
 * Chat header with title and action buttons
 */
const ChatHeader = ({
  modelName,
  fileInputRef,
  onFileUpload,
  onTriggerFileInput,
  onClearUploads,
  onToggleSettings,
  onClearHistory,
  hasUploads,
}) => (
  <div className="chat-header">
    <div className="header-content">
      <h1>🤖 Ollama Chat</h1>
      <div className="model-info">{modelName}</div>
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
        title="Clear History"
      >
        🗑️
      </button>
    </div>
  </div>
);

export default ChatHeader;
