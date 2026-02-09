# Migration: Multi-Chat (Conversations Table Schema)

The app now supports **multiple conversations per user**. Supabase must use a schema where **one row = one conversation** (not one row per user).

## New schema (Option A)

Table: `conversations`

| Column       | Type         | Description                    |
|-------------|--------------|--------------------------------|
| `id`        | UUID         | Primary key (gen_random_uuid())|
| `user_id`   | TEXT         | User identifier                |
| `title`     | TEXT         | Conversation title             |
| `messages`  | JSONB        | Array of messages              |
| `updated_at`| TIMESTAMPTZ  | Last updated                   |

- **Primary key:** `id`
- **Index:** `(user_id, updated_at DESC)` for listing a user’s conversations

## SQL (fresh install)

Run in Supabase SQL Editor:

```sql
-- Drop old table if you had single-conversation-per-user layout
-- DROP TABLE IF EXISTS conversations;

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New chat',
  messages JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_updated
  ON conversations (user_id, updated_at DESC);

-- RLS (optional): allow users to read/write only their rows
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users own their conversations"
--   ON conversations FOR ALL USING (auth.uid()::text = user_id);
-- If you use anonymous user_id from localStorage, skip RLS or adapt.
```

## Migrating from old schema (one row per user_id)

If you previously had:

- `conversations ( user_id TEXT PRIMARY KEY, messages JSONB, updated_at TIMESTAMPTZ )`

then migrate data and switch to the new table:

```sql
-- 1) Rename old table
ALTER TABLE conversations RENAME TO conversations_old;

-- 2) Create new table (same as above)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  title TEXT DEFAULT 'New chat',
  messages JSONB DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_updated
  ON conversations (user_id, updated_at DESC);

-- 3) Copy existing data (one row per user -> one row per user with new id)
INSERT INTO conversations (id, user_id, title, messages, updated_at)
SELECT gen_random_uuid(), user_id, 'Chat', messages, COALESCE(updated_at, NOW())
FROM conversations_old;

-- 4) Drop old table
DROP TABLE conversations_old;
```

After running the migration, the app will use `listConversations`, `loadConversation`, `saveConversation`, and `deleteConversation` against this new schema.
