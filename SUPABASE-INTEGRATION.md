# 🚀 SUPABASE INTEGRATION - JSONB STORAGE

## Setup Guide (5 phút)

### Bước 1: Create Supabase Account

1. Đi https://supabase.com
2. Click "Start your project"
3. Sign up với email (KHÔNG cần credit card)
4. Verify email

### Bước 2: Create Project

1. Click "+ New Project"
2. Điền:
   - **Organization**: Chọn hoặc tạo mới
   - **Project name**: `ollama-chat-app`
   - **Database Password**: Tạo password mạnh (LƯU LẠI!)
   - **Region**: Singapore (gần VN)
3. Click "Create new project"
4. Đợi ~2 phút

### Bước 3: Create Table

1. Đi **SQL Editor** (sidebar bên trái)
2. Copy paste code này:

```sql
-- Create conversations table
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast user lookup
CREATE INDEX idx_user_id ON conversations(user_id);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update
CREATE TRIGGER update_conversations_updated_at 
    BEFORE UPDATE ON conversations 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"** (hoặc Ctrl+Enter)
4. Thấy "Success. No rows returned" = ✅ DONE!

### Bước 4: Get API Keys

1. Đi **Settings** > **API**
2. Copy 2 thứ này:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbG...` (dài ~200 ký tự)
3. **LƯU LẠI** để dùng trong code

### Bước 5: Disable RLS (Row Level Security)

**Để đơn giản cho development:**

1. Đi **Authentication** > **Policies**
2. Tìm table `conversations`
3. Click "Disable RLS" 

**Lưu ý:** Sau này khi deploy production, enable lại và add policies!

---

## 💻 CODE INTEGRATION

### Install Supabase SDK

```bash
cd ollama-chat-app
npm install @supabase/supabase-js
```

### Create Supabase Client

Tạo file mới: `src/supabaseClient.js`

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_PROJECT_URL'  // Thay bằng URL của bạn
const supabaseKey = 'YOUR_ANON_KEY'     // Thay bằng anon key của bạn

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## 🔧 UPDATE App.js

### 1. Import Supabase

Thêm vào đầu file `src/App.js`:

```javascript
import { supabase } from './supabaseClient';
```

### 2. Add User ID State

Thêm state để track user (sau dòng useState khác):

```javascript
const [userId, setUserId] = useState(() => {
  // Generate hoặc load user ID từ localStorage
  let id = localStorage.getItem('user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(7);
    localStorage.setItem('user_id', id);
  }
  return id;
});
```

### 3. Load Messages từ Supabase

Thêm useEffect để load messages khi app start:

```javascript
// Load messages from Supabase on mount
useEffect(() => {
  const loadMessagesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('messages')
        .eq('user_id', userId)
        .single();

      if (error) {
        // No conversation exists yet - that's OK
        if (error.code === 'PGRST116') {
          console.log('No existing conversation found');
          return;
        }
        throw error;
      }

      if (data && data.messages) {
        setMessages(data.messages);
        console.log('Loaded messages from Supabase:', data.messages.length);
      }
    } catch (error) {
      console.error('Error loading from Supabase:', error);
      // Fallback to localStorage
      const savedMessages = localStorage.getItem('ollama-chat-history');
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  };

  loadMessagesFromSupabase();
}, [userId]);
```

### 4. Save Messages to Supabase

Thay thế useEffect cũ lưu vào localStorage bằng code này:

```javascript
// Save messages to both localStorage AND Supabase
useEffect(() => {
  const saveMessages = async () => {
    if (messages.length === 0) return;

    // Save to localStorage (backup)
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
      console.log('Saved to Supabase:', messages.length, 'messages');
    } catch (error) {
      console.error('Error saving to Supabase:', error);
    }
  };

  saveMessages();
}, [messages, userId]);
```

### 5. Update Clear History Function

Sửa hàm `clearHistory` để xóa cả Supabase:

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
      console.log('Cleared Supabase history');
    } catch (error) {
      console.error('Error clearing Supabase:', error);
    }
  }
};
```

---

## ✅ DONE! Test It

### Test Steps:

1. **Start app**
   ```bash
   npm start
   ```

2. **Send some messages**
   - Chat với AI
   - Xem console log: "Saved to Supabase: X messages"

3. **Check Supabase**
   - Đi Supabase dashboard
   - Table Editor > conversations
   - Thấy 1 row với messages JSONB

4. **Test load**
   - Refresh browser
   - Messages vẫn còn (loaded từ Supabase)

5. **Test clear**
   - Click 🗑️ Clear History
   - Confirm
   - Check Supabase: row đã bị xóa

---

## 🎯 FEATURES

✅ **Auto-save**: Mỗi message tự động lưu lên Supabase
✅ **Auto-load**: Refresh browser → messages vẫn còn
✅ **Backup**: localStorage + Supabase (double safety)
✅ **Clear**: Xóa cả local và cloud
✅ **Multi-device**: Chat trên máy A, xem trên máy B (cùng user_id)

---

## 🔒 QUOTA LIMITS

**Free tier Supabase:**
- 500MB database
- 1 conversation với 1000 messages ≈ 1MB
- → Có thể lưu ~500,000 messages
- → Không lo hết quota! 🎉

**Khi nào cần clear:**
- Khi conversation quá dài (>10,000 messages)
- Khi muốn reset

---

## ⚠️ NOTES

### Security (Development)
- Hiện tại disable RLS (Row Level Security)
- Mọi người có thể đọc conversations
- **OK cho development/testing**
- **NOT OK cho production**

### Production (Sau này):
1. Enable RLS
2. Add authentication (Supabase Auth)
3. Add policies:
```sql
-- Only users can see their own conversations
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid()::text = user_id);
```

---

## 🐛 TROUBLESHOOTING

### Error: "Failed to fetch"
- Check: Supabase URL đúng không?
- Check: anon key đúng không?
- Check: Internet connection

### Error: "PGRST116"
- Bình thường! Có nghĩa là chưa có conversation
- App sẽ tạo mới khi save message đầu tiên

### Messages không load
- Check console log
- Check Supabase Table Editor
- Verify user_id trong localStorage

### Messages không save
- Check console errors
- Check RLS is disabled
- Check API keys

---

## 📚 NEXT STEPS

Version 1 (NOW): ✅
- Store messages in Supabase
- Load on app start
- Clear function

Version 2 (FUTURE):
- Real-time sync (messages appear instantly across devices)
- User authentication
- Multiple conversations
- Search messages

---

**Bạn đã sẵn sàng code chưa?** 🚀
