import React from 'react';
import Message from './Message';
import LoadingMessage from './LoadingMessage';
import WelcomeMessage from './WelcomeMessage';

/**
 * Container for all messages
 */
const MessageList = ({ messages, isLoading, messagesEndRef }) => (
  <div className="messages-container">
    {messages.length === 0 ? (
      <WelcomeMessage />
    ) : (
      messages.map((message, index) => <Message key={index} message={message} />)
    )}
    {isLoading && <LoadingMessage />}
    <div ref={messagesEndRef} />
  </div>
);

export default MessageList;
