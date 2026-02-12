import { useState, useEffect, useRef, useCallback } from 'react';
import {
  getUserId,
  getLocalConversation,
  saveLocalConversation,
} from '../utils/storage';
import { loadConversation, saveConversation } from '../services/supabaseService';
import { buildConversationHistory, sendChatMessage } from '../services/ollamaService';
import { conversationTitleFromMessages } from '../utils/formatters';

/**
 * Custom hook for managing chat state for one conversation
 * @param {string} ollamaUrl - Ollama server URL
 * @param {string} modelName - Model name
 * @param {string|null} conversationId - Active conversation ID (null = no conversation selected)
 * @param {Array} uploadedFiles - Uploaded text files
 * @param {Array} uploadedImages - Uploaded images
 * @param {function(string): void} onDeleteConversation - Called after current conversation is deleted (parent should switch chat)
 * @param {function(string, string): void} onTitleChange - Optional; called when conversation title is derived from messages (id, title)
 * @returns {object} Chat state and handlers
 */
export const useChat = (
  ollamaUrl,
  modelName,
  conversationId,
  uploadedFiles,
  uploadedImages,
  onDeleteConversation,
  onTitleChange
) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(getUserId);
  const messagesEndRef = useRef(null);
  // Ref: which conversationId the current `messages` state belongs to (prevents saving old messages to new chat)
  const messagesForConversationIdRef = useRef(null);

  // Load conversation when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      messagesForConversationIdRef.current = null;
      return;
    }

    // Clear immediately and mark as "not yet loaded for this id" so save effect won't write old messages to new conversation
    setMessages([]);
    messagesForConversationIdRef.current = null;

    const load = async () => {
      try {
        const data = await loadConversation(userId, conversationId);
        const msgs = data?.messages ?? [];
        setMessages(msgs);
        messagesForConversationIdRef.current = conversationId;
      } catch (err) {
        console.error('Error loading conversation:', err);
        const local = getLocalConversation(conversationId);
        const msgs = local?.messages ?? [];
        setMessages(msgs);
        messagesForConversationIdRef.current = conversationId;
      }
    };

    load();
  }, [userId, conversationId]);

  // Save messages to this conversation only when they belong to it (Supabase + localStorage)
  useEffect(() => {
    if (!conversationId || messages.length === 0) return;
    if (messagesForConversationIdRef.current !== conversationId) return;

    const title = conversationTitleFromMessages(messages);

    saveLocalConversation(conversationId, {
      title,
      messages,
      updatedAt: new Date().toISOString(),
      model: modelName,
    });

    if (typeof onTitleChange === 'function') onTitleChange(conversationId, title);

    saveConversation(userId, conversationId, title, messages, modelName).catch((err) =>
      console.error('Error saving conversation:', err)
    );
  }, [userId, conversationId, messages, modelName, onTitleChange]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Debug/visibility: confirm what's being attached (system messages aren't sent to Ollama)
      if ((uploadedImages?.length ?? 0) > 0 || (uploadedFiles?.length ?? 0) > 0) {
        addMessage({
          role: 'system',
          content: `📎 Sending with attachments: ${uploadedImages?.length ?? 0} image(s), ${uploadedFiles?.length ?? 0} document(s)`,
          timestamp: new Date().toISOString(),
        });
      }

      const conversationHistory = buildConversationHistory(
        [...messages, userMessage],
        uploadedFiles,
        uploadedImages
      );

      const responseContent = await sendChatMessage(ollamaUrl, modelName, conversationHistory);

      const assistantMessage = {
        role: 'assistant',
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [
    inputMessage,
    messages,
    ollamaUrl,
    modelName,
    uploadedFiles,
    uploadedImages,
    addMessage,
  ]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const deleteCurrentChat = useCallback(() => {
    if (!conversationId) return;
    if (!window.confirm('Delete this chat? This cannot be undone.')) return;
    if (typeof onDeleteConversation === 'function') onDeleteConversation(conversationId);
  }, [conversationId, onDeleteConversation]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyPress,
    clearHistory: deleteCurrentChat,
    addMessage,
  };
};
