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
