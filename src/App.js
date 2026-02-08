import React, { useState, useRef, useCallback } from 'react';
import './App.css';

// Components
import { ChatHeader, ChatInput, MessageList } from './components/Chat';
import { SettingsPanel } from './components/Settings';
import { UploadsPanel } from './components/Uploads';

// Hooks
import { useChat, useSettings } from './hooks';
import { SUPPORTED_FILE_TYPES } from './constants/config';

function App() {
  // Settings hook
  const {
    ollamaUrl,
    setOllamaUrl,
    modelName,
    setModelName,
    showSettings,
    toggleSettings,
    saveSettings,
  } = useSettings();

  // File upload state (managed here to avoid circular dependency)
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const fileInputRef = useRef(null);

  // Chat hook with file uploads
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
  } = useChat(ollamaUrl, modelName, uploadedFiles, uploadedImages);

  // File upload handlers
  const handleFileUpload = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);

      for (const file of files) {
        if (file.type.startsWith('image/')) {
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
          };
          reader.readAsDataURL(file);
        } else if (
          file.type === 'text/plain' ||
          SUPPORTED_FILE_TYPES.TEXT.some((ext) => file.name.endsWith(ext))
        ) {
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
    [addMessage]
  );

  const clearUploads = useCallback(() => {
    setUploadedFiles([]);
    setUploadedImages([]);
    addMessage({
      role: 'system',
      content: '🗑️ All uploaded files cleared',
      timestamp: new Date().toISOString(),
    });
  }, [addMessage]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const hasUploads = uploadedFiles.length > 0 || uploadedImages.length > 0;
  const totalUploads = uploadedFiles.length + uploadedImages.length;

  return (
    <div className="App">
      <div className="chat-container">
        <ChatHeader
          modelName={modelName}
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
        />
      </div>
    </div>
  );
}

export default App;
