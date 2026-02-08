import React from 'react';

/**
 * Chat input textarea and send button
 */
const ChatInput = ({ inputMessage, setInputMessage, onKeyPress, onSend, isLoading }) => (
  <div className="input-container">
    <textarea
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
      rows="1"
      disabled={isLoading}
    />
    <button
      onClick={onSend}
      disabled={isLoading || !inputMessage.trim()}
      className="send-button"
    >
      {isLoading ? '⏳' : '▶️'}
    </button>
  </div>
);

export default ChatInput;
