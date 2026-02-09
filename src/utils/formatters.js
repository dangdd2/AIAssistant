/**
 * Format a timestamp to a human-readable time string
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time (e.g., "02:30 PM")
 */
export const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get role display info
 * @param {string} role - Message role
 * @returns {object} Display info with icon and label
 */
export const getRoleDisplay = (role) => {
  const displays = {
    user: { icon: '👤', label: 'You' },
    assistant: { icon: '🤖', label: 'AI' },
    system: { icon: '🔔', label: 'System' },
  };
  return displays[role] || displays.assistant;
};

const DEFAULT_CHAT_TITLE = 'New chat';
const TITLE_MAX_LEN = 50;

/**
 * Derive conversation title from messages (first user message, truncated)
 * @param {Array} messages
 * @returns {string}
 */
export const conversationTitleFromMessages = (messages) => {
  const firstUser = (messages || []).find((m) => m.role === 'user');
  if (!firstUser || !firstUser.content) return DEFAULT_CHAT_TITLE;
  const text = String(firstUser.content).trim();
  if (!text) return DEFAULT_CHAT_TITLE;
  return text.length <= TITLE_MAX_LEN ? text : text.slice(0, TITLE_MAX_LEN) + '…';
};
