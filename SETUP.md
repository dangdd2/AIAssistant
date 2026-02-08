# 🎯 SETUP GUIDE - Start Here!

Follow these steps **exactly** to get your chat app running in minutes.

## Step 1: Verify Ollama is Running

Open a terminal and run:
```bash
curl http://localhost:11434/api/version
```

✅ **If you see JSON with version info** → Ollama is running!  
❌ **If you see "connection refused"** → Start Ollama:
```bash
ollama serve
```

## Step 2: Check Your Model

```bash
ollama list
```

You should see `kimi-k2.5-cloud` in the list.  
If not, you'll need to pull it or use a different model.

## Step 3: Install Dependencies

Navigate to the project folder and run:
```bash
cd /path/to/ollama-chat-app
npm install
```

This will take 1-2 minutes.

## Step 4: Start Everything

### Option A: Automatic (Easy)
```bash
./start.sh
```

### Option B: Manual (If script doesn't work)

**Terminal 1** - Start the CORS proxy:
```bash
node proxy.js
```
Leave this running. You should see:
```
🚀 CORS Proxy running on http://localhost:8080
```

**Terminal 2** - Start the React app:
```bash
npm start
```

Your browser should automatically open to `http://localhost:3000`

## Step 5: Configure (First Time Only)

1. Click the ⚙️ **Settings** icon in the top right
2. Set **Ollama URL** to: `http://localhost:8080`
3. Set **Model Name** to: `kimi-k2.5-cloud`
4. Click **Save Settings**

## Step 6: Start Chatting! 🎉

Type a message and press Enter. The AI should respond!

---

## ⚠️ Common Issues

### "Failed to fetch" error
- **Check**: Is the proxy running? (Terminal 1)
- **Check**: Is Ollama running? (`curl http://localhost:11434/api/version`)
- **Check**: Is the URL in settings `http://localhost:8080` (not 11434)?

### "Model not found"
- Run `ollama list` to see your models
- Update the model name in settings to match exactly
- Or pull the model: `ollama pull kimi-k2.5-cloud`

### Port already in use
- **Proxy (8080)**: Edit `proxy.js`, change `PROXY_PORT = 8080` to another port
- **React (3000)**: It will offer another port automatically

### npm install fails
- Make sure you have Node.js installed: `node --version`
- Try: `npm cache clean --force` then `npm install` again

---

## 🎯 Quick Test

1. Make sure you see: `🚀 CORS Proxy running on http://localhost:8080`
2. Make sure React app is open in browser
3. Click settings ⚙️
4. Confirm URL is `http://localhost:8080`
5. Type "Hello!" and press Enter

If you get a response → **SUCCESS!** 🎉

---

## 📞 Still Stuck?

Check the browser console (F12) and terminal for error messages.
Most issues are:
- Proxy not running
- Wrong URL in settings
- Ollama not started
- Model name typo
