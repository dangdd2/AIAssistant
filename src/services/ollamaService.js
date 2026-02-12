/**
 * List available models from Ollama API
 * @param {string} ollamaUrl - Ollama server URL
 * @returns {Promise<Array<{name: string}>>} Array of models (each with .name)
 */
export const listModels = async (ollamaUrl) => {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return [];
    const data = await response.json();
    const models = data?.models ?? [];
    return models.map((m) => ({ name: m.name ?? m.model ?? '' })).filter((m) => m.name);
  } catch {
    return [];
  }
};

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

  // Add images to the last USER message for vision models (Ollama expects images on user messages)
  if (uploadedImages.length > 0 && conversationHistory.length > 0) {
    const lastUserMsgIndex = (() => {
      for (let i = conversationHistory.length - 1; i >= 0; i--) {
        if (conversationHistory[i]?.role === 'user') return i;
      }
      return -1;
    })();
    if (lastUserMsgIndex >= 0) {
      conversationHistory[lastUserMsgIndex].images = uploadedImages.map((img) => img.data);
    }
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
  // Debug: help confirm images are actually in the payload
  try {
    const imagesCount = Array.isArray(conversationHistory)
      ? conversationHistory.reduce((acc, m) => acc + (Array.isArray(m?.images) ? m.images.length : 0), 0)
      : 0;
    if (imagesCount > 0) {
      // eslint-disable-next-line no-console
      console.debug('[ollamaService] Sending chat with images:', { modelName, imagesCount });
    }
  } catch {
    // ignore debug errors
  }

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
