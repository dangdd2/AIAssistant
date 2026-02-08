# 🤖 Ollama Chat App

A beautiful, professional chat interface for your local Ollama AI models.

## ✨ Features

- 💬 **Clean Chat Interface** - Professional UI with smooth animations
- 💾 **Persistent History** - All chats saved locally in your browser
- 📎 **File Upload & RAG** - Upload documents and images, ask questions about them
- 🖼️ **Image Analysis** - Works with vision models like llava
- ⚙️ **Configurable** - Easy settings for Ollama URL and model name
- 🎨 **Beautiful Design** - Modern gradient theme, responsive layout
- ⚡ **Fast & Lightweight** - Pure React, no backend database needed
- 🔒 **Privacy First** - Everything runs locally, no data sent to cloud

## 🚀 Quick Start

### Prerequisites

1. **Ollama installed and running**
   ```bash
   # Check if Ollama is running
   curl http://localhost:11434/api/version
   ```

2. **Node.js installed** (v14 or higher)
   ```bash
   node --version
   ```

### Installation

1. **Navigate to the project folder**
   ```bash
   cd ollama-chat-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the CORS proxy** (in a separate terminal)
   ```bash
   node proxy.js
   ```
   You should see: `🚀 CORS Proxy running on http://localhost:8080`

4. **Start the React app** (in another terminal)
   ```bash
   npm start
   ```
   Your browser will open to `http://localhost:3000`

5. **Configure the app** (if needed)
   - Click the ⚙️ settings icon
   - Set Ollama URL to: `http://localhost:8080` (the proxy)
   - Set Model Name to: `kimi-k2.5-cloud` (or your model)
   - Click "Save Settings"

## 📖 How to Use

1. **Start chatting!** Type your message and press Enter
2. **Upload files** - Click 📎 to upload documents or images
3. **Ask about uploads** - "Summarize this document" or "What's in this image?"
4. **View history** - All conversations are automatically saved
5. **Clear history** - Click the 🗑️ icon to start fresh
6. **Settings** - Click ⚙️ to change Ollama URL or model

### Using File Upload & RAG
- Click **📎** to upload .txt, .md, .json files or images
- For images, use a vision model like `llava` or `bakllava`
- Ask questions about uploaded content
- Clear uploads with **🗑️📎** when done
- See **FILE-UPLOAD-GUIDE.md** for detailed instructions

## 🎯 What You Built

This is a **production-ready** chat application with:

- ✅ Real-time chat with Ollama
- ✅ Full conversation history (stored in browser localStorage)
- ✅ **Document upload & RAG** (upload files, ask questions about them)
- ✅ **Image upload & analysis** (works with vision models)
- ✅ Professional UI/UX
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design (works on mobile)
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for new line)

## 🔧 Troubleshooting

### "Error: Failed to fetch"
- Make sure Ollama is running: `ollama serve`
- Make sure the proxy is running: `node proxy.js`
- Check settings: Ollama URL should be `http://localhost:8080`

### "Model not found"
- Check your model name in settings
- List your models: `ollama list`
- Pull the model if needed: `ollama pull kimi-k2.5-cloud`

### CORS errors
- Use the proxy server (don't connect directly to localhost:11434)
- Make sure proxy.js is running

## 📁 Project Structure

```
ollama-chat-app/
├── public/
│   └── index.html          # HTML template
├── src/
│   ├── App.js              # Main React component
│   ├── App.css             # Styling
│   └── index.js            # Entry point
├── proxy.js                # CORS proxy server
├── package.json            # Dependencies
└── README.md               # This file
```

## 🎨 Customization Ideas

Want to make it yours? Try:

1. **Change the color scheme** - Edit `App.css`, look for gradient colors
2. **Add export chat** - Add a button to download conversation as text/JSON
3. **Dark mode** - Add a theme toggle
4. **Different models** - Add a dropdown to switch between models
5. **System prompts** - Add a field to set system instructions
6. **Better PDF support** - Add pdf.js library for full PDF text extraction
7. **Embeddings** - Add vector search for better document retrieval

## 🚀 Version 2 Ideas

What else you could add:

- ~~**RAG (Document Upload)**~~ ✅ **DONE!** - Already included
- **Advanced RAG** - Add embeddings and vector search for better retrieval
- **Multi-user** - Add authentication and user accounts
- **Cloud deployment** - Deploy to Vercel/Netlify
- **Backend database** - Use PostgreSQL/MongoDB for persistence
- **Streaming responses** - Show AI typing in real-time
- **Voice input** - Add speech-to-text
- **Full PDF support** - Use pdf.js for complete PDF extraction
- **Web scraping** - Let AI fetch and analyze web pages

## 🛠️ Tech Stack

- **Frontend**: React 18
- **Styling**: Pure CSS (no framework needed)
- **Storage**: Browser localStorage
- **AI**: Ollama API
- **Proxy**: Node.js http module

## 📝 Notes

- Chat history is stored in your browser (localStorage)
- Clear browser data = lose chat history
- No server-side storage in v1 (by design, for speed)
- Works offline once loaded (except AI calls)

## 🎉 You Did It!

You now have a fully functional AI chat app running locally. Share it, customize it, make it yours!

---

**Built in under 1 hour** ⚡
**Ready for production** ✅
**100% local and private** 🔒
