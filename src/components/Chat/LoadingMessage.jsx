import React from 'react';

/**
 * Loading indicator message
 */
const LoadingMessage = () => (
  <div className="message assistant loading">
    <div className="message-header">
      <span className="message-role">🤖 AI</span>
    </div>
    <div className="message-content">
      <div className="typing-indicator">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  </div>
);

export default LoadingMessage;
