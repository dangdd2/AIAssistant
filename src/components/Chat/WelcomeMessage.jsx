import React from 'react';

/**
 * Welcome message shown when there are no messages
 */
const WelcomeMessage = () => (
  <div className="welcome-message">
    <h2>👋 Welcome!</h2>
    <p>Start chatting with your Ollama model</p>
    <div className="tips">
      <div className="tip">💡 Your chat history is saved locally</div>
      <div className="tip">📎 Upload files/images to ask questions about them</div>
      <div className="tip">⚙️ Configure settings if needed</div>
      <div className="tip">🗑️ Clear history anytime</div>
    </div>
  </div>
);

export default WelcomeMessage;
