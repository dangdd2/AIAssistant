# 📝 CHANGELOG

## Version 2.0 - File Upload & RAG (Current)

**Released**: Just now!

### 🎉 New Features

#### 📎 File Upload & RAG
- **Upload documents** (.txt, .md, .json files)
- **Upload images** (works with vision models like llava)
- **Ask questions** about uploaded content
- **Multiple file support** - upload several files at once
- **Visual feedback** - yellow banner shows uploaded files
- **Easy management** - clear all uploads with one click

#### 🖼️ Image Analysis (Vision Models)
- Upload images and ask "What's in this image?"
- Extract text from images
- Describe diagrams, screenshots, photos
- Works with llava, bakllava, and other vision models

#### 🧠 RAG (Retrieval Augmented Generation)
- AI has access to full document content
- No need for embeddings or vector databases (simple implementation)
- Documents included in conversation context
- Ask specific questions about your documents

### 🔧 Improvements
- Better error messages with actionable advice
- Console logging for debugging
- System messages for upload notifications
- Support for multiple file types
- Improved UI with file management buttons

### 🐛 Bug Fixes
- Fixed 404 error handling with better messages
- Added model name validation
- Improved error display in chat

---

## Version 1.0 - Initial Release

**Released**: First version

### Features
- ✅ Clean chat interface
- ✅ Ollama integration
- ✅ Chat history (localStorage)
- ✅ Settings panel
- ✅ Professional UI
- ✅ CORS proxy included
- ✅ Responsive design
- ✅ Error handling

---

## Upgrade Guide (v1.0 → v2.0)

If you're upgrading from v1.0:

1. **Download new ZIP** - Get the latest version
2. **Replace files** - Overwrite your old src/App.js and src/App.css
3. **Refresh browser** - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. **Test upload** - Click 📎 and upload a .txt file

Your chat history will be preserved (it's in localStorage).

---

## Coming Soon (v3.0 ideas)

- Vector embeddings for better document search
- Streaming responses (word-by-word AI output)
- Dark mode theme
- Export chat to PDF/JSON
- Full PDF text extraction
- Cloud deployment option
- Multi-user support
- Backend database

---

## Breaking Changes

None! v2.0 is fully backward compatible with v1.0.

---

## Known Issues

- PDF support is basic (text PDFs work better)
- Very large files (>50KB) may slow responses
- Image analysis requires vision models
- No persistent file storage (files cleared on refresh)

---

## Support

- Read **FILE-UPLOAD-GUIDE.md** for detailed instructions
- Check **FIX-404.md** if you have model issues
- Run `./diagnose.sh` to check your setup
- Open browser console (F12) for debugging

---

**Enjoy the new features! 🚀**
