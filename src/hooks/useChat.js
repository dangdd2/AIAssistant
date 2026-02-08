import { useState, useEffect, useRef, useCallback } from 'react';
import { getUserId, getLocalChatHistory, saveLocalChatHistory, clearLocalChatHistory } from '../utils/storage';
import { loadMessages, saveMessages, deleteMessages } from '../services/supabaseService';
import { buildConversationHistory, sendChatMessage } from '../services/ollamaService';

/**
 * Custom hook for managing chat state and operations
 * @param {string} ollamaUrl - Ollama server URL
 * @param {string} modelName - Model name
 * @param {Array} uploadedFiles - Uploaded text files
 * @param {Array} uploadedImages - Uploaded images
 * @returns {object} Chat state and handlers
 */
export const useChat = (ollamaUrl, modelName, uploadedFiles, uploadedImages) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(getUserId);
  const messagesEndRef = useRef(null);

  // Load chat history from Supabase on mount
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        console.log('🔍 Loading messages for user:', userId);
        const cloudMessages = await loadMessages(userId);

        if (cloudMessages) {
          console.log('✅ Loaded from Supabase:', cloudMessages.length, 'messages');
          setMessages(cloudMessages);
        } else {
          console.log('📭 No existing conversation - starting fresh');
        }
      } catch (error) {
        console.error('❌ Error loading from Supabase:', error);
        console.log('📦 Trying localStorage fallback...');

        const localMessages = getLocalChatHistory();
        if (localMessages.length > 0) {
          console.log('✅ Loaded from localStorage');
          setMessages(localMessages);
        }
      }
    };

    loadChatHistory();
  }, [userId]);

  // Save messages to localStorage AND Supabase
  useEffect(() => {
    const persistMessages = async () => {
      if (messages.length === 0) return;

      // Backup to localStorage
      saveLocalChatHistory(messages);

      // Save to Supabase
      try {
        await saveMessages(userId, messages);
        console.log('💾 Saved to Supabase:', messages.length, 'messages');
      } catch (error) {
        console.error('❌ Error saving to Supabase:', error.message);
      }
    };

    persistMessages();
  }, [messages, userId]);

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
      const conversationHistory = buildConversationHistory(
        [...messages, userMessage],
        uploadedFiles,
        uploadedImages
      );

      console.log('Sending request to:', `${ollamaUrl}/api/chat`);
      console.log('With model:', modelName);
      console.log('Message count:', conversationHistory.length);

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
  }, [inputMessage, messages, ollamaUrl, modelName, uploadedFiles, uploadedImages]);

  const handleKeyPress = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const clearHistory = useCallback(async () => {
    if (window.confirm('Clear all chat history? This will delete from cloud as well.')) {
      setMessages([]);
      clearLocalChatHistory();

      try {
        await deleteMessages(userId);
        console.log('🗑️ Cleared from Supabase');
      } catch (error) {
        console.error('❌ Error clearing Supabase:', error.message);
      }
    }
  }, [userId]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyPress,
    clearHistory,
    addMessage,
  };
};
