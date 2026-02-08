# 📎 FILE UPLOAD & RAG GUIDE

## New Feature: Upload Files & Images!

You can now upload documents and images, then ask the AI questions about them.

---

## 🎯 How to Use

### Step 1: Upload Files

Click the **📎** button in the top right corner.

**Supported file types:**
- 📷 **Images**: .jpg, .png, .gif, .webp (for vision models)
- 📄 **Text files**: .txt, .md, .json
- 📄 **PDFs**: Basic support (works best with text PDFs)

### Step 2: Ask Questions

Once uploaded, just ask questions like:
- "Summarize this document"
- "What are the key points in the text?"
- "Describe this image"
- "Find all mentions of X in the document"

### Step 3: Clear When Done

Click **🗑️📎** to clear all uploaded files.

---

## 📋 Examples

### Text Document RAG
```
1. Upload: research_paper.txt
2. Ask: "What are the main findings?"
3. Ask: "List all the references mentioned"
4. Ask: "Summarize this in 3 bullet points"
```

### Image Analysis (Vision Models Only)
```
1. Upload: diagram.png
2. Ask: "What does this diagram show?"
3. Ask: "Extract the text from this image"
```

### Multiple Documents
```
1. Upload: doc1.txt, doc2.txt, doc3.txt
2. Ask: "Compare the approaches in these three documents"
3. Ask: "Which document mentions topic X?"
```

---

## 🧠 How It Works (RAG)

**RAG = Retrieval Augmented Generation**

When you upload files:
1. The content is stored in browser memory
2. When you ask a question, the full document is sent to the AI
3. The AI references the document to answer accurately
4. No embeddings or vector databases (keeps it simple!)

---

## 🖼️ Using Images (Vision Models)

To use image upload, you need a **vision-capable model**.

### Supported Vision Models:
- `llava` (recommended)
- `bakllava`
- `llava-phi3`
- Any model with vision support

### Install a Vision Model:
```bash
ollama pull llava
```

Then in app settings:
- Set Model Name to: `llava`
- Upload an image
- Ask: "What's in this image?"

---

## ⚠️ Important Notes

### File Size Limits
- Keep text files under 10,000 characters for best results
- Large files may slow down responses
- Images are encoded in base64 (increases size)

### Privacy
- All files stay in your browser (not sent to any server)
- Files are cleared when you click the clear button
- Files are NOT saved to chat history

### Model Compatibility
- **Text RAG**: Works with ANY Ollama model
- **Image Analysis**: Requires vision models (llava, bakllava, etc.)
- Check your model supports the feature you want

### Performance
- More documents = slower responses
- The AI gets the FULL content of all uploaded files
- For large documents, consider splitting them up

---

## 🔧 Troubleshooting

### "Model doesn't support images"
→ You need a vision model like `llava`
→ Run: `ollama pull llava`
→ Change model in settings

### AI doesn't reference the document
→ Make sure file uploaded successfully (check yellow banner)
→ Ask explicit questions like "Based on the document, ..."
→ Some models need clearer prompting

### Upload button doesn't work
→ Check browser console (F12) for errors
→ Make sure file type is supported
→ Try refreshing the page

### Slow responses
→ Too many/large files uploaded
→ Clear uploads and try one at a time
→ Use shorter documents

---

## 💡 Pro Tips

1. **Be specific in questions**
   - ❌ "Tell me about this"
   - ✅ "What are the three main arguments in this document?"

2. **Upload before asking**
   - Upload all files first
   - Then start asking questions
   - Clear when switching topics

3. **Use system-like prompts**
   - "Based on the uploaded document, ..."
   - "According to the text file, ..."
   - "In the image, ..."

4. **One topic at a time**
   - Upload files for one topic
   - Ask all questions
   - Clear and start fresh for next topic

---

## 🚀 Advanced Use Cases

### Code Review
```
Upload: my_code.py
Ask: "Find any bugs or issues"
Ask: "Suggest improvements"
```

### Research Assistant
```
Upload: article1.txt, article2.txt
Ask: "What do both articles agree on?"
Ask: "What are the contradictions?"
```

### Data Analysis
```
Upload: data.json
Ask: "What patterns do you see?"
Ask: "Calculate the average of field X"
```

### Receipt/Invoice Processing
```
Upload: receipt.jpg (with vision model)
Ask: "Extract all the items and prices"
Ask: "What's the total?"
```

---

## 📊 Feature Comparison

| Feature | Current Version | Future Version |
|---------|----------------|----------------|
| Text files | ✅ Yes | ✅ Yes |
| Images | ✅ Yes (vision models) | ✅ Yes |
| PDFs | ⚠️ Basic | ✅ Full extraction |
| Multiple files | ✅ Yes | ✅ Yes |
| Embeddings | ❌ No | ✅ Yes |
| Vector search | ❌ No | ✅ Yes |
| Persistent storage | ❌ No | ✅ Yes |

---

## ❓ FAQ

**Q: How many files can I upload?**
A: No hard limit, but performance degrades with many files. Recommend 3-5 max.

**Q: Are my files saved?**
A: No, they're cleared when you refresh or click clear uploads.

**Q: Can I upload Word docs?**
A: Not yet. Convert to .txt first or upload as PDF.

**Q: Why isn't my PDF working?**
A: PDFs need special handling. For now, copy text to .txt file.

**Q: Can it search through documents?**
A: Yes! The AI has full access to uploaded content.

**Q: Does this work offline?**
A: File upload is offline, but you need Ollama running to chat.

---

**Enjoy your new RAG-powered chat! 🚀**
