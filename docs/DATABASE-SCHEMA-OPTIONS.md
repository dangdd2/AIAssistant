# 🗄️ SUPABASE DATABASE SCHEMA OPTIONS

## Database Type: PostgreSQL (SQL)

Supabase chỉ dùng **PostgreSQL** - đây là SQL database mạnh mẽ, reliable.

---

## 🎯 3 CÁCH TỔ CHỨC DATA

### Option 1: Simple Table (RECOMMENDED) ⭐⭐⭐⭐⭐

**1 row = 1 message**

```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,           -- 'user' or 'assistant' or 'system'
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_messages ON messages(user_id, timestamp DESC);
```

**Ví dụ data:**
```
| id   | user_id | role      | content           | timestamp           |
|------|---------|-----------|-------------------|---------------------|
| abc1 | user123 | user      | "Hello"           | 2024-02-08 10:00:00 |
| abc2 | user123 | assistant | "Hi! How are you?"| 2024-02-08 10:00:05 |
| abc3 | user123 | user      | "Good, thanks"    | 2024-02-08 10:00:10 |
```

**✅ Pros:**
- Dễ query: `SELECT * FROM messages WHERE user_id = 'user123' ORDER BY timestamp`
- Scalable: Millions of messages không vấn đề
- Dễ filter, search
- Dễ delete old messages
- Dễ implement pagination
- Best practice cho production apps

**❌ Cons:**
- Nhiều rows hơn
- Query cần JOIN nếu có related data

**Khi nào dùng:**
- Bạn muốn search messages
- Bạn muốn filter by date/user
- Bạn muốn scale lớn
- **RECOMMENDED cho chat apps**

---

### Option 2: JSONB Column

**1 row = toàn bộ conversation**

```sql
CREATE TABLE conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  messages JSONB NOT NULL,      -- Toàn bộ messages trong 1 column
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_conversations ON conversations(user_id);
```

**Ví dụ data:**
```
| id   | user_id | messages (JSONB)                                      |
|------|---------|-------------------------------------------------------|
| xyz1 | user123 | [{"role":"user","content":"Hello"},                   |
|      |         |  {"role":"assistant","content":"Hi!"}]                |
```

**✅ Pros:**
- Chỉ 1 row per conversation
- Nhanh khi load toàn bộ conversation
- Giống localStorage (dễ migrate)
- Ít queries hơn

**❌ Cons:**
- Khó search trong messages
- Khó filter by date
- JSONB column có size limit
- Không scalable cho conversations dài
- Khó implement pagination

**Khi nào dùng:**
- Conversations ngắn (< 100 messages)
- Không cần search
- Chỉ cần load toàn bộ conversation
- **KHÔNG recommended cho production**

---

### Option 3: Hybrid (Professional) ⭐⭐⭐⭐⭐

**2 tables: sessions + messages**

```sql
-- Table 1: Sessions (conversations)
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,                    -- "Chat about React", etc.
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: Messages
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_sessions ON sessions(user_id, updated_at DESC);
CREATE INDEX idx_session_messages ON messages(session_id, timestamp ASC);
```

**Ví dụ data:**

**sessions table:**
```
| id      | user_id | title              | created_at          |
|---------|---------|---------------------|---------------------|
| sess1   | user123 | "Chat about React"  | 2024-02-08 10:00:00 |
| sess2   | user123 | "Debug help"        | 2024-02-08 11:00:00 |
```

**messages table:**
```
| id   | session_id | role      | content    | timestamp           |
|------|------------|-----------|------------|---------------------|
| msg1 | sess1      | user      | "Hello"    | 2024-02-08 10:00:00 |
| msg2 | sess1      | assistant | "Hi!"      | 2024-02-08 10:00:05 |
| msg3 | sess2      | user      | "Bug here" | 2024-02-08 11:00:00 |
```

**✅ Pros:**
- Professional architecture
- Organize conversations
- Easy to implement "chat history sidebar"
- Can have session metadata (title, tags, etc.)
- Scalable
- Best for multi-conversation apps

**❌ Cons:**
- More complex
- Need to manage sessions
- More tables to maintain

**Khi nào dùng:**
- ChatGPT-style interface (multiple conversations)
- Need conversation history sidebar
- Professional app
- **Best practice cho production apps**

---

## 📊 SO SÁNH

| Feature | Simple Table | JSONB | Hybrid |
|---------|-------------|-------|--------|
| **Ease of setup** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Query speed** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Scalability** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Searchability** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Multiple chats** | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Best for** | Single chat | Small apps | Production |

---

## 💡 MY RECOMMENDATION

### For your current app (Version 1):

**Use Option 1: Simple Table**

**Lý do:**
- ✅ Dễ implement (15 phút)
- ✅ Scalable
- ✅ Dễ migrate từ localStorage
- ✅ Đủ cho 90% use cases
- ✅ Có thể upgrade lên Hybrid sau

**Code sẽ như:**
```javascript
// Save message
await supabase.from('messages').insert({
  user_id: 'user123',
  role: 'user',
  content: 'Hello'
})

// Load all messages
const { data } = await supabase
  .from('messages')
  .select('*')
  .eq('user_id', 'user123')
  .order('timestamp', { ascending: true })
```

---

### For future (Version 2):

**Upgrade to Option 3: Hybrid**

Khi bạn muốn:
- Multiple conversations (like ChatGPT)
- Conversation history sidebar
- Better UX

**Migration dễ dàng:**
```sql
-- Thêm sessions table
CREATE TABLE sessions (...);

-- Add session_id to messages
ALTER TABLE messages ADD COLUMN session_id UUID;

-- Done!
```

---

## 🚀 IMPLEMENTATION PLAN

### Bước 1: Setup Simple Table (NOW)
```sql
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Bước 2: Integrate với React
```javascript
// Hook vào sendMessage function
// Mỗi message → Insert vào Supabase
```

### Bước 3: Sync với localStorage
```javascript
// Option A: Replace localStorage
// Option B: Hybrid (localStorage + Supabase backup)
```

### Bước 4: Add features
- Real-time subscriptions
- Multi-device sync
- Search messages

---

## 🎯 WHAT'S NEXT?

Bạn chọn option nào, tôi sẽ:

1. ✅ Tạo SQL schema
2. ✅ Code integration vào React app
3. ✅ Migration từ localStorage
4. ✅ Test và verify

**Recommended: Option 1 (Simple Table)**
- Start simple
- Works great
- Easy to upgrade later

Bạn đồng ý không? 🚀
