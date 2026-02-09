import React, { useState, useRef, useEffect } from 'react';

/**
 * Sidebar: "+ New chat" button and list of conversations (ChatGPT/Claude style).
 * Click a title to rename.
 */
const Sidebar = ({
  conversations,
  activeConversationId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const formatDate = (updatedAt) => {
    if (!updatedAt) return '';
    const d = new Date(updatedAt);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    return sameDay
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString();
  };

  const startEditing = (e, conv) => {
    e.stopPropagation();
    setEditingId(conv.id);
    setEditingValue(conv.title || 'New chat');
  };

  const submitRename = () => {
    if (!editingId) return;
    const trimmed = editingValue.trim() || 'New chat';
    if (typeof onRenameChat === 'function') onRenameChat(editingId, trimmed);
    setEditingId(null);
    setEditingValue('');
  };

  const handleKeyDown = (e, convId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitRename();
    }
    if (e.key === 'Escape') {
      setEditingId(null);
      setEditingValue('');
    }
  };

  return (
    <aside className="chat-sidebar">
      <button type="button" className="sidebar-new-chat" onClick={onNewChat} aria-label="New chat">
        + New chat
      </button>
      <nav className="sidebar-conversations" aria-label="Chat history">
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={`sidebar-item ${conv.id === activeConversationId ? 'active' : ''}`}
          >
            <div className="sidebar-item-button-wrap">
              {editingId === conv.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  className="sidebar-item-rename-input"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={(e) => handleKeyDown(e, conv.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Rename chat"
                />
              ) : (
                <button
                  type="button"
                  className="sidebar-item-button"
                  onClick={() => onSelectChat(conv)}
                  onDoubleClick={(e) => startEditing(e, conv)}
                  title={`${conv.title || 'New chat'} — double-click to rename`}
                >
                  <span className="sidebar-item-title">{conv.title || 'New chat'}</span>
                  <span className="sidebar-item-date">{formatDate(conv.updated_at)}</span>
                </button>
              )}
            </div>
            {editingId !== conv.id && (
              <button
                type="button"
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this chat?')) onDeleteChat(conv.id);
                }}
                title="Delete chat"
                aria-label="Delete chat"
              >
                🗑️
              </button>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
