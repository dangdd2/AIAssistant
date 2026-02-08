import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { supabase } from './supabaseClient';

function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [modelName, setModelName] = useState('kimi-k2.5:cloud');
  const [showSettings, setShowSettings] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  
  const [userId, setUserId] = useState(() => {
    // Generate or load user ID from localStorage
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(7);
      localStorage.setItem('user_id', id);
    }
    return id;
  });

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load settings from localStorage on mount
  useEffect(() => {    
    const savedUrl = localStorage.getItem('ollama-url');
    if (savedUrl) {
      setOllamaUrl(savedUrl);
    }
    
    const savedModel = localStorage.getItem('ollama-model');
    if (savedModel) {
      setModelName(savedModel);
    }
  }, []);

  // Load chat history from Supabase
  useEffect(() => {
    const loadMessagesFromSupabase = async () => {
      try {
        console.log('🔍 Loading messages for user:', userId);
        
        const { data, error } = await supabase
          .from('conversations')
          .select('messages')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('📭 No existing conversation - starting fresh');
            return;
          }
          throw error;
        }

        if (data && data.messages) {
          console.log('✅ Loaded from Supabase:', data.messages.length, 'messages');
          setMessages(data.messages);
        }
      } catch (error) {
        console.error('❌ Error loading from Supabase:', error);
        console.log('📦 Trying localStorage fallback...');
        
        // Fallback to localStorage
        const savedMessages = localStorage.getItem('ollama-chat-history');
        if (savedMessages) {
          console.log('✅ Loaded from localStorage');
          setMessages(JSON.parse(savedMessages));
        }
      }
    };

    loadMessagesFromSupabase();
  }, [userId]);


  // Save messages to localStorage AND Supabase
  useEffect(() => {
    const saveMessages = async () => {
      if (messages.length === 0) return;

      // Backup to localStorage
      localStorage.setItem('ollama-chat-history', JSON.stringify(messages));

      // Save to Supabase
      try {
        const { error } = await supabase
          .from('conversations')
          .upsert({
            user_id: userId,
            messages: messages,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;
        console.log('💾 Saved to Supabase:', messages.length, 'messages');
      } catch (error) {
        console.error('❌ Error saving to Supabase:', error.message);
      }
    };

    saveMessages();
  }, [messages, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build conversation history
      let conversationHistory = [...messages, userMessage]
        .filter(m => m.role !== 'system') // Remove system messages from API call
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Add uploaded documents as context at the beginning
      if (uploadedFiles.length > 0) {
        const contextMessage = {
          role: 'system',
          content: `You have access to the following documents. Use them to answer questions:\n\n${
            uploadedFiles.map(f => `=== ${f.name} ===\n${f.content}\n`).join('\n')
          }`
        };
        conversationHistory = [contextMessage, ...conversationHistory];
      }

      // Add images if supported (for vision models)
      const hasImages = uploadedImages.length > 0;
      
      console.log('Sending request to:', `${ollamaUrl}/api/chat`);
      console.log('With model:', modelName);
      console.log('Message count:', conversationHistory.length);
      console.log('Uploaded files:', uploadedFiles.length);
      console.log('Uploaded images:', uploadedImages.length);

      // For vision models, add images to the last user message
      if (hasImages && conversationHistory.length > 0) {
        const lastUserMsgIndex = conversationHistory.length - 1;
        conversationHistory[lastUserMsgIndex].images = uploadedImages.map(img => img.data);
      }

      const response = await fetch(`${ollamaUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          messages: conversationHistory,
          stream: false
        })
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        
        // Better error messages
        if (response.status === 404) {
          throw new Error(`Model "${modelName}" not found. Run 'ollama list' to see available models, or pull it with 'ollama pull ${modelName}'`);
        } else {
          throw new Error(`Ollama returned ${response.status}: ${response.statusText}`);
        }
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      const assistantMessage = {
        role: 'assistant',
        content: data.message.content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ ${error.message}`,
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = async () => {
    if (window.confirm('Clear all chat history? This will delete from cloud as well.')) {
      setMessages([]);
      localStorage.removeItem('ollama-chat-history');
      
      // Delete from Supabase
      try {
        const { error } = await supabase
          .from('conversations')
          .delete()
          .eq('user_id', userId);
        
        if (error) throw error;
        console.log('🗑️ Cleared from Supabase');
      } catch (error) {
        console.error('❌ Error clearing Supabase:', error.message);
      }
    }
  };

  const saveSettings = () => {
    localStorage.setItem('ollama-url', ollamaUrl);
    localStorage.setItem('ollama-model', modelName);
    setShowSettings(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      // Handle images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Image = event.target.result.split(',')[1];
          setUploadedImages(prev => [...prev, {
            name: file.name,
            data: base64Image,
            type: file.type
          }]);
          
          // Add system message
          const uploadMsg = {
            role: 'system',
            content: `📷 Image uploaded: ${file.name}`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, uploadMsg]);
        };
        reader.readAsDataURL(file);
      }
      // Handle text files
      else if (file.type === 'text/plain' || file.name.endsWith('.txt') || 
               file.name.endsWith('.md') || file.name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const content = event.target.result;
          setUploadedFiles(prev => [...prev, {
            name: file.name,
            content: content,
            type: file.type
          }]);
          
          // Add system message
          const uploadMsg = {
            role: 'system',
            content: `📄 Document uploaded: ${file.name} (${content.length} characters)`,
            timestamp: new Date().toISOString()
          };
          setMessages(prev => [...prev, uploadMsg]);
        };
        reader.readAsText(file);
      }
      // Handle PDFs (basic text extraction)
      else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const uploadMsg = {
          role: 'system',
          content: `📄 PDF uploaded: ${file.name}. Note: For full PDF support, you'll need to add a PDF library. For now, I can help with text files and images.`,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, uploadMsg]);
      }
      else {
        alert(`File type not supported yet: ${file.type}. Supported: images, .txt, .md, .json`);
      }
    }
    
    // Reset input
    e.target.value = '';
  };

  const clearUploads = () => {
    setUploadedFiles([]);
    setUploadedImages([]);
    const clearMsg = {
      role: 'system',
      content: '🗑️ All uploaded files cleared',
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, clearMsg]);
  };

  return (
    <div className="App">
      <div className="chat-container">
        <div className="chat-header">
          <div className="header-content">
            <h1>🤖 Ollama Chat</h1>
            <div className="model-info">{modelName}</div>
          </div>
          <div className="header-actions">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.txt,.md,.json,.pdf"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            <button 
              className="icon-button" 
              onClick={() => fileInputRef.current?.click()}
              title="Upload Files/Images"
            >
              📎
            </button>
            {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
              <button 
                className="icon-button" 
                onClick={clearUploads}
                title="Clear Uploads"
              >
                🗑️📎
              </button>
            )}
            <button 
              className="icon-button" 
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              ⚙️
            </button>
            <button 
              className="icon-button" 
              onClick={clearHistory}
              title="Clear History"
            >
              🗑️
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="setting-item">
              <label>Ollama URL:</label>
              <input
                type="text"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
              />
            </div>
            <div className="setting-item">
              <label>Model Name:</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="kimi-k2.5-cloud"
              />
            </div>
            <button className="save-button" onClick={saveSettings}>
              Save Settings
            </button>
          </div>
        )}

        {(uploadedFiles.length > 0 || uploadedImages.length > 0) && (
          <div className="uploads-panel">
            <div className="uploads-header">
              <strong>📎 Uploaded Files ({uploadedFiles.length + uploadedImages.length})</strong>
              <span className="uploads-hint">AI can reference these in answers</span>
            </div>
            <div className="uploads-list">
              {uploadedFiles.map((file, idx) => (
                <div key={idx} className="upload-item">
                  <span>📄 {file.name}</span>
                  <span className="upload-size">{file.content.length} chars</span>
                </div>
              ))}
              {uploadedImages.map((img, idx) => (
                <div key={idx} className="upload-item">
                  <span>📷 {img.name}</span>
                  <span className="upload-size">Image</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="messages-container">
          {messages.length === 0 ? (
            <div className="welcome-message">
              <h2>👋 Welcome!</h2>
              <p>Start chatting with your Ollama model</p>
              <div className="tips">
                <div className="tip">💡 Your chat history is saved locally</div>
                <div className="tip">📎 Upload files/images to ask questions about them</div>
                <div className="tip">⚙️ Configure settings if needed</div>
                <div className="tip">🗑️ Clear history anytime</div>
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`message ${message.role} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-header">
                  <span className="message-role">
                    {message.role === 'user' ? '👤 You' : message.role === 'system' ? '🔔 System' : '🤖 AI'}
                  </span>
                  <span className="message-time">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
                <div className="message-content">
                  {message.content}
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="message assistant loading">
              <div className="message-header">
                <span className="message-role">🤖 AI</span>
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Enter to send, Shift+Enter for new line)"
            rows="1"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="send-button"
          >
            {isLoading ? '⏳' : '▶️'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
