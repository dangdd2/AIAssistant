# 📝 CODE CHANGES - SUPABASE INTEGRATION

## TÓM TẮT CHANGES

- ✅ 1 file mới: `src/supabaseClient.js`
- ✅ Sửa file: `src/App.js` (thêm 4 đoạn code)
- ✅ Install: `@supabase/supabase-js`

---

## 🔧 BƯỚC 1: Install Package

```bash
cd ollama-chat-app
npm install @supabase/supabase-js
```

---

## 📄 BƯỚC 2: Tạo File Mới

### File: `src/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

// TODO: Thay YOUR_PROJECT_URL và YOUR_ANON_KEY bằng keys thật
// Lấy từ Supabase Dashboard > Settings > API

const supabaseUrl = 'YOUR_PROJECT_URL'      // Ví dụ: 'https://xxxxx.supabase.co'
const supabaseKey = 'YOUR_ANON_KEY'         // Ví dụ: 'eyJhbG...'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

**LƯU Ý:** Nhớ thay `YOUR_PROJECT_URL` và `YOUR_ANON_KEY`!

---

## ✏️ BƯỚC 3: Sửa File `src/App.js`

### Change 1: Import Supabase (đầu file)

**TÌM dòng:**
```javascript
import React, { useState, useEffect, useRef } from 'react';
import './App.css';
```

**THÊM SAU ĐÓ:**
```javascript
import { supabase } from './supabaseClient';
```

---

### Change 2: Add User ID State

**TÌM đoạn:**
```javascript
function App() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
```

**THÊM SAU ĐÓ:**
```javascript
  const [userId, setUserId] = useState(() => {
    let id = localStorage.getItem('user_id');
    if (!id) {
      id = 'user_' + Math.random().toString(36).substring(7);
      localStorage.setItem('user_id', id);
    }
    return id;
  });
```

---

### Change 3: Load từ Supabase khi start

**TÌM đoạn useEffect cũ load từ localStorage:**
```javascript
  // Load chat history from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('ollama-chat-history');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
    
    const savedUrl = localStorage.getItem('ollama-url');
    if (savedUrl) {
      setOllamaUrl(savedUrl);
    }
    
    const savedModel = localStorage.getItem('ollama-model');
    if (savedModel) {
      setModelName(savedModel);
    }
  }, []);
```

**THAY BẰNG:**
```javascript
  // Load settings from localStorage
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

  // Load chat history from Supabase (separate useEffect)
  useEffect(() => {
    const loadMessagesFromSupabase = async () => {
      try {
        console.log('Loading messages for user:', userId);
        
        const { data, error } = await supabase
          .from('conversations')
          .select('messages')
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            console.log('No existing conversation - starting fresh');
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
        // Fallback to localStorage
        const savedMessages = localStorage.getItem('ollama-chat-history');
        if (savedMessages) {
          console.log('📦 Fallback to localStorage');
          setMessages(JSON.parse(savedMessages));
        }
      }
    };

    loadMessagesFromSupabase();
  }, [userId]);
```

---

### Change 4: Save vào Supabase

**TÌM đoạn useEffect save vào localStorage:**
```javascript
  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('ollama-chat-history', JSON.stringify(messages));
    }
  }, [messages]);
```

**THAY BẰNG:**
```javascript
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
        console.error('❌ Error saving to Supabase:', error);
      }
    };

    saveMessages();
  }, [messages, userId]);
```

---

### Change 5: Update Clear History

**TÌM hàm clearHistory:**
```javascript
  const clearHistory = () => {
    if (window.confirm('Clear all chat history?')) {
      setMessages([]);
      localStorage.removeItem('ollama-chat-history');
    }
  };
```

**THAY BẰNG:**
```javascript
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
        console.error('❌ Error clearing Supabase:', error);
      }
    }
  };
```

---

## ✅ DONE!

### What Changed:

1. ✅ **New file**: `supabaseClient.js` - Supabase config
2. ✅ **Import**: Added Supabase import
3. ✅ **User ID**: Generate unique ID per user
4. ✅ **Load**: Load messages từ Supabase khi start
5. ✅ **Save**: Auto-save mỗi message vào Supabase
6. ✅ **Clear**: Xóa cả local và cloud

---

## 🧪 TEST

### Test 1: Save Messages
1. Start app: `npm start`
2. Send vài messages
3. Check console: "💾 Saved to Supabase: X messages"
4. Check Supabase dashboard > Table Editor > conversations
5. Thấy 1 row với messages JSONB ✅

### Test 2: Load Messages
1. Refresh browser (F5)
2. Check console: "✅ Loaded from Supabase: X messages"
3. Messages vẫn hiển thị ✅

### Test 3: Clear History
1. Click 🗑️ button
2. Confirm
3. Check console: "🗑️ Cleared from Supabase"
4. Check Supabase: row đã bị xóa ✅

### Test 4: Multi-device (Optional)
1. Copy `user_id` từ localStorage
2. Mở browser khác (hoặc incognito)
3. Set cùng `user_id` trong localStorage
4. Messages sync! ✅

---

## 🐛 COMMON ERRORS

### "supabaseUrl is required"
→ Bạn chưa thay YOUR_PROJECT_URL trong supabaseClient.js

### "Invalid API key"
→ Bạn chưa thay YOUR_ANON_KEY hoặc key sai

### "relation 'conversations' does not exist"
→ Bạn chưa chạy SQL tạo table trong Supabase

### "PGRST116"
→ Bình thường! Có nghĩa chưa có data, app sẽ tạo mới

---

## 📊 FLOW DIAGRAM

```
User sends message
      ↓
Add to React state (messages)
      ↓
useEffect triggers
      ↓
├─ Save to localStorage (backup)
└─ Save to Supabase (upsert)
      ↓
Console log: "💾 Saved..."
      ↓
Done!
```

```
User opens app
      ↓
useEffect triggers
      ↓
Load from Supabase
      ↓
├─ Success → Set messages state
└─ Error → Fallback to localStorage
      ↓
Messages render
      ↓
Done!
```

---

## 🎯 SUMMARY

**Total code thay đổi:**
- 1 file mới: 7 dòng
- App.js: ~60 dòng code mới
- Total time: 10 phút

**Benefits:**
- ✅ Cloud backup
- ✅ Multi-device sync
- ✅ Never lose data
- ✅ Still works offline (localStorage backup)

**Bạn sẵn sàng implement chưa?** 🚀
