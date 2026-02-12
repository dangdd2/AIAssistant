import React, { useState, useRef, useCallback, useEffect } from 'react';
import './App.css';

// Components
import { ChatHeader, ChatInput, MessageList } from './components/Chat';
import { Sidebar } from './components/Sidebar';
import { SettingsPanel } from './components/Settings';
import { UploadsPanel } from './components/Uploads';

// Hooks
import { useChat, useConversations, useSettings } from './hooks';
import { SUPPORTED_FILE_TYPES } from './constants/config';
import { saveSettings as persistSettingsToStorage, getUserId } from './utils/storage';
import { updateConversationModel } from './services/supabaseService';

const isLikelyVisionModelName = (name = '') =>
  /(vision|llava|bakllava|moondream|pixtral|\bvl\b|qwen.*vl|minicpm.*v|glm.*v)/i.test(name);

function App() {
  const {
    ollamaUrl,
    setOllamaUrl,
    modelName,
    setModelName,
    showSettings,
    toggleSettings,
    saveSettings,
  } = useSettings();

  const {
    conversations,
    activeConversationId,
    setConversationTitle,
    setConversationModel,
    renameConversation,
    newChat,
    selectChat,
    deleteChat,
  } = useConversations();

  // Sync global model from the active conversation when switching chats or list updates
  useEffect(() => {
    if (!activeConversationId || !conversations.length) return;
    const active = conversations.find((c) => c.id === activeConversationId);
    if (active?.model != null) setModelName(active.model);
  }, [activeConversationId, conversations, setModelName]);

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pendingUploadCount, setPendingUploadCount] = useState(0);
  const fileInputRef = useRef(null);

  const handleDeleteConversation = useCallback(
    (id) => {
      deleteChat(id);
    },
    [deleteChat]
  );

  const {
    messages,
    inputMessage,
    setInputMessage,
    isLoading,
    messagesEndRef,
    sendMessage,
    handleKeyPress,
    clearHistory,
    addMessage,
  } = useChat(
    ollamaUrl,
    modelName,
    activeConversationId,
    uploadedFiles,
    uploadedImages,
    handleDeleteConversation,
    setConversationTitle
  );

  const handleSelectChat = useCallback(
    (conv) => {
      selectChat(conv.id);
      if (conv.model != null) {
        setModelName(conv.model);
        persistSettingsToStorage(ollamaUrl, conv.model);
      }
    },
    [selectChat, setModelName, ollamaUrl]
  );

  const handleModelChange = useCallback(
    (name) => {
      setModelName(name);
      persistSettingsToStorage(ollamaUrl, name);
      if (activeConversationId) {
        setConversationModel(activeConversationId, name);
        updateConversationModel(getUserId(), activeConversationId, name).catch((err) =>
          console.error('Error updating conversation model:', err)
        );
      }
    },
    [setModelName, ollamaUrl, activeConversationId, setConversationModel]
  );

  const handleNewChat = useCallback(() => {
    newChat(modelName);
  }, [newChat, modelName]);

  const handleFileUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);

      for (const file of files) {
        if (file.type.startsWith('image/')) {
          setPendingUploadCount((c) => c + 1);
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Image = event.target.result.split(',')[1];
            setUploadedImages((prev) => [
              ...prev,
              { name: file.name, data: base64Image, type: file.type },
            ]);
            addMessage({
              role: 'system',
              content: `📷 Image uploaded: ${file.name}`,
              timestamp: new Date().toISOString(),
            });
            if (!isLikelyVisionModelName(modelName)) {
              addMessage({
                role: 'system',
                content:
                  `⚠️ Current model "${modelName}" may not support image understanding. ` +
                  'If it says no image is attached, switch to a vision model (e.g. llava, llama3.2-vision, qwen2.5-vl).',
                timestamp: new Date().toISOString(),
              });
            }
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.onerror = () => {
            addMessage({
              role: 'system',
              content: `❌ Failed to read image: ${file.name}`,
              timestamp: new Date().toISOString(),
            });
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.readAsDataURL(file);
        } else if (
          file.type === 'text/plain' ||
          SUPPORTED_FILE_TYPES.TEXT.some((ext) => file.name.endsWith(ext))
        ) {
          setPendingUploadCount((c) => c + 1);
          const reader = new FileReader();
          reader.onload = (event) => {
            const content = event.target.result;
            setUploadedFiles((prev) => [
              ...prev,
              { name: file.name, content, type: file.type },
            ]);
            addMessage({
              role: 'system',
              content: `📄 Document uploaded: ${file.name} (${content.length} characters)`,
              timestamp: new Date().toISOString(),
            });
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.onerror = () => {
            addMessage({
              role: 'system',
              content: `❌ Failed to read document: ${file.name}`,
              timestamp: new Date().toISOString(),
            });
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.readAsText(file);
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          addMessage({
            role: 'system',
            content: `📄 PDF uploaded: ${file.name}. Note: For full PDF support, add a PDF library.`,
            timestamp: new Date().toISOString(),
          });
        } else {
          alert(`File type not supported: ${file.type}. Supported: images, .txt, .md, .json`);
        }
      }
      e.target.value = '';
    },
    [addMessage, modelName]
  );

  const clearUploads = useCallback(() => {
    setUploadedFiles([]);
    setUploadedImages([]);
    setPendingUploadCount(0);
    addMessage({
      role: 'system',
      content: '🗑️ All uploaded files cleared',
      timestamp: new Date().toISOString(),
    });
  }, [addMessage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handlePaste = useCallback(
    (e) => {
      const clipboard = e.clipboardData;
      if (!clipboard) return;

      // Prefer files array when available (better support across browsers)
      const files = clipboard.files && clipboard.files.length ? clipboard.files : null;
      if (files) {
        for (const file of files) {
          if (file.type && file.type.startsWith('image/')) {
            e.preventDefault();
            setPendingUploadCount((c) => c + 1);
            const reader = new FileReader();
            reader.onload = (event) => {
              const base64Image = event.target.result.split(',')[1];
              setUploadedImages((prev) => [
                ...prev,
                { name: file.name || 'pasted-image.png', data: base64Image, type: file.type },
              ]);
              addMessage({
                role: 'system',
                content: '📷 Image pasted (screenshot or clipboard)',
                timestamp: new Date().toISOString(),
              });
              if (!isLikelyVisionModelName(modelName)) {
                addMessage({
                  role: 'system',
                  content:
                    `⚠️ Current model "${modelName}" may not support image understanding. ` +
                    'If it says no image is attached, switch to a vision model (e.g. llava, llama3.2-vision, qwen2.5-vl).',
                  timestamp: new Date().toISOString(),
                });
              }
              setPendingUploadCount((c) => Math.max(0, c - 1));
            };
            reader.onerror = () => {
              addMessage({
                role: 'system',
                content: '❌ Failed to read pasted image',
                timestamp: new Date().toISOString(),
              });
              setPendingUploadCount((c) => Math.max(0, c - 1));
            };
            reader.readAsDataURL(file);
            return;
          }
        }
      }

      // Fallback to items API
      const items = clipboard.items;
      if (!items) return;
      for (const item of items) {
        if (item.type && item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (!file) continue;
          setPendingUploadCount((c) => c + 1);
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64Image = event.target.result.split(',')[1];
            setUploadedImages((prev) => [
              ...prev,
              { name: file.name || 'pasted-image.png', data: base64Image, type: file.type },
            ]);
            addMessage({
              role: 'system',
              content: '📷 Image pasted (screenshot or clipboard)',
              timestamp: new Date().toISOString(),
            });
            if (!isLikelyVisionModelName(modelName)) {
              addMessage({
                role: 'system',
                content:
                  `⚠️ Current model "${modelName}" may not support image understanding. ` +
                  'If it says no image is attached, switch to a vision model (e.g. llava, llama3.2-vision, qwen2.5-vl).',
                timestamp: new Date().toISOString(),
              });
            }
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.onerror = () => {
            addMessage({
              role: 'system',
              content: '❌ Failed to read pasted image',
              timestamp: new Date().toISOString(),
            });
            setPendingUploadCount((c) => Math.max(0, c - 1));
          };
          reader.readAsDataURL(file);
          return;
        }
      }
    },
    [addMessage, modelName]
  );

  const hasUploads = uploadedFiles.length > 0 || uploadedImages.length > 0;
  const totalUploads = uploadedFiles.length + uploadedImages.length;
  const isUploadProcessing = pendingUploadCount > 0;

  return (
    <div className="App" onPasteCapture={handlePaste}>
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={deleteChat}
        onRenameChat={renameConversation}
      />
      <div className="chat-main">
        <div className="chat-container">
          <ChatHeader
            ollamaUrl={ollamaUrl}
            modelName={modelName}
            onModelChange={handleModelChange}
            fileInputRef={fileInputRef}
            onFileUpload={handleFileUpload}
            onTriggerFileInput={triggerFileInput}
            onClearUploads={clearUploads}
            onToggleSettings={toggleSettings}
            onClearHistory={clearHistory}
            hasUploads={hasUploads}
          />

          {showSettings && (
            <SettingsPanel
              ollamaUrl={ollamaUrl}
              setOllamaUrl={setOllamaUrl}
              modelName={modelName}
              setModelName={setModelName}
              onSave={saveSettings}
            />
          )}

          {hasUploads && (
            <UploadsPanel
              uploadedFiles={uploadedFiles}
              uploadedImages={uploadedImages}
              totalUploads={totalUploads}
            />
          )}

          <MessageList
            messages={messages}
            isLoading={isLoading}
            messagesEndRef={messagesEndRef}
          />

          <ChatInput
            inputMessage={inputMessage}
            setInputMessage={setInputMessage}
            onKeyPress={handleKeyPress}
            onSend={sendMessage}
            isLoading={isLoading}
            isUploadProcessing={isUploadProcessing}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
