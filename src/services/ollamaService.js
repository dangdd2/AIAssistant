/**
 * Build conversation history for Ollama API
 * @param {Array} messages - Current messages
 * @param {Array} uploadedFiles - Uploaded text files
 * @param {Array} uploadedImages - Uploaded images
 * @returns {Array} Formatted conversation history
 */
export const buildConversationHistory = (messages, uploadedFiles = [], uploadedImages = []) => {
  let conversationHistory = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));

  // Add uploaded documents as context at the beginning
  if (uploadedFiles.length > 0) {
    const contextMessage = {
      role: 'system',
      content: `You have access to the following documents. Use them to answer questions:\n\n${uploadedFiles
        .map((f) => `=== ${f.name} ===\n${f.content}\n`)
        .join('\n')}`,
    };
    conversationHistory = [contextMessage, ...conversationHistory];
  }

  // Add images to the last user message for vision models
  if (uploadedImages.length > 0 && conversationHistory.length > 0) {
    const lastUserMsgIndex = conversationHistory.length - 1;
    conversationHistory[lastUserMsgIndex].images = uploadedImages.map((img) => img.data);
  }

  return conversationHistory;
};

/**
 * Send a chat message to Ollama API
 * @param {string} ollamaUrl - Ollama server URL
 * @param {string} modelName - Model name
 * @param {Array} conversationHistory - Formatted conversation history
 * @returns {Promise<string>} Assistant's response content
 */
export const sendChatMessage = async (ollamaUrl, modelName, conversationHistory) => {
  const response = await fetch(`${ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelName,
      messages: conversationHistory,
      stream: false,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `Model "${modelName}" not found. Run 'ollama list' to see available models, or pull it with 'ollama pull ${modelName}'`
      );
    }
    throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  return data.message.content;
};
