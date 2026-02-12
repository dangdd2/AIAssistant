import React from 'react';

/**
 * Chat input textarea and send button
 */
const ChatInput = ({
  inputMessage,
  setInputMessage,
  onKeyPress,
  onSend,
  isLoading,
  isUploadProcessing,
}) => (
  <div className="input-container">
    <textarea
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyPress={onKeyPress}
      placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
      rows="1"
      disabled={isLoading || isUploadProcessing}
    />
    <button
      onClick={onSend}
      disabled={isLoading || isUploadProcessing || !inputMessage.trim()}
      className="send-button"
      title={isUploadProcessing ? 'Processing upload… please wait' : 'Send message'}
    >
      {isLoading ? '⏳' : '▶️'}
    </button>
  </div>
);

export default ChatInput;
