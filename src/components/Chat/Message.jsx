import React from 'react';
import { formatTimestamp, getRoleDisplay } from '../../utils/formatters';

/**
 * Single message component
 */
const Message = ({ message }) => {
  const { icon, label } = getRoleDisplay(message.role);

  return (
    <div className={`message ${message.role} ${message.isError ? 'error' : ''}`}>
      <div className="message-header">
        <span className="message-role">
          {icon} {label}
        </span>
        <span className="message-time">{formatTimestamp(message.timestamp)}</span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
};

export default Message;
