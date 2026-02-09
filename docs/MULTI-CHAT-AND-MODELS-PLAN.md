# Plan: Model List, Model Switcher & Multi-Chat (ChatGPT/Claude Style)

This document plans three features based on the current repo:

1. **List current Ollama models** and let the user **change the model**
2. **Multi chat history** (multiple conversations per user)
3. **New chat** flow and sidebar like ChatGPT/Claude

---

## Current State Summary

| Area | Current behavior |
|------|------------------|
| **Models** | Single model name from Settings (text input). Default: `kimi-k2.5:cloud`. No listing from Ollama. |
| **Persistence** | One `conversations` row per `user_id` with a single `messages` JSONB array (Option 2 in DATABASE-SCHEMA-OPTIONS.md). |
| **Chat UI** | Single conversation; "Clear History" wipes everything. No sidebar, no list of chats. |
| **Ollama API** | Only `POST /api/chat` is used. Ollama exposes `GET /api/tags` for listing models (see `diagnose.sh`). |

---

## 1. List All Models & Allow User to Change Model

### 1.1 Ollama API for listing models

- **Endpoint:** `GET {ollamaUrl}/api/tags`
- **Response shape:** `{ models: [ { name, size, modified_at, ... }, ... ] }`
- **Usage:** Call on Settings open (or on app load) and when Ollama URL changes.

### 1.2 Backend / service

- **File:** `src/services/ollamaService.js`
  - Add `listModels(ollamaUrl)` that fetches `GET /api/tags`, returns `models` array (or `[]` on error).
  - Handle network/CORS errors and invalid URL (e.g. show empty list or error message).

### 1.3 Settings UI

- **File:** `src/components/Settings/SettingsPanel.jsx`
  - Replace the model **text input** with a **model selector**:
    - **Primary:** `<select>` populated from `listModels(ollamaUrl)` (option value = `model.name`).
    - **Fallback:** Keep a text input or “Custom model” option so users can type a model name not in the list (e.g. remote or not yet pulled).
  - On panel open (or when Ollama URL changes), call `listModels(ollamaUrl)` and set options; show loading/error state.
  - Selected value updates `modelName`; “Save Settings” continues to persist via existing `useSettings` / storage.

### 1.4 Optional: quick model switch in header

- **File:** `src/components/Chat/ChatHeader.jsx`
  - Option A: Keep model display-only in header; change only in Settings.
  - Option B: Add a small dropdown or button in the header that opens the same model list and updates `modelName` (and optionally persists), for faster switching without opening full Settings.

**Deliverables:**  
- `ollamaService.listModels(ollamaUrl)`  
- Settings panel uses it for a dropdown (+ optional custom field)  
- Optional header model switcher  

---

## 2. Multi Chat History (Conversation Categories)

Right now there is **one conversation per user**. To support multiple chats (categories/conversations), the app needs a **conversation identity** and storage that supports many conversations per user.

### 2.1 Data model options

**Option A – Extend current Supabase (recommended for minimal migration)**  
- Keep table `conversations` but change meaning: **one row = one conversation (chat)**.
- Schema change:
  - Add `id` (UUID) as primary key for each conversation.
  - Keep `user_id` to scope to user.
  - Replace single `messages` column with: `messages JSONB`, and add `title TEXT`, `updated_at TIMESTAMP`.
  - So: `(id, user_id, title, messages, updated_at)`.
- One “active” conversation per user in the UI; load/save by `conversations.id`.

**Option B – Hybrid (sessions + messages)**  
- As in `docs/DATABASE-SCHEMA-OPTIONS.md` Option 3: `sessions` (id, user_id, title, created_at, updated_at) and `messages` (id, session_id, role, content, timestamp).
- More normalized and scalable; requires more code changes (load/save by session, join sessions + messages).

**Recommendation:** Start with **Option A** (one table, one row per chat, JSONB messages) so you can keep most of the current load/save logic and only add `conversation_id` and `title`. Migrate to Option B later if needed.

### 2.2 Storage / Supabase

- **LocalStorage (fallback):**  
  - Change from a single key (e.g. `ollama-chat-history`) to keyed by conversation, e.g. `ollama-chat-{conversationId}` or store an object `{ activeId, conversations: [ { id, title, messages, updatedAt } ] }`.
- **Supabase:**  
  - **If Option A:**  
    - Migration: add `id` (UUID, default gen_random_uuid()), `title` (TEXT), keep `messages` (JSONB), add/use `updated_at`.  
    - Ensure unique constraint on `(user_id, id)` or use `id` as primary key and index `user_id`.  
    - New APIs (or extend existing):  
      - `listConversations(userId)` → list of `{ id, title, updated_at }`.  
      - `loadConversation(userId, conversationId)` → one row’s `messages`.  
      - `saveConversation(userId, conversationId, title, messages)` → upsert by `id` (and user_id).  
      - `deleteConversation(userId, conversationId)` → delete one row.  
  - **If Option B:**  
    - Implement `sessions` + `messages` and equivalent list/load/save/delete.

### 2.3 App state

- **Active conversation:**  
  - Store `activeConversationId` (and optionally `conversations` list) in React state (e.g. in a new hook or in `App.js`).
- **Per-conversation state:**  
  - Messages, loading, and input are for the **active** conversation only. When user switches conversation, load that conversation’s messages and set it as active.

**Deliverables:**  
- Supabase schema change (Option A or B) and migration steps.  
- `storage.js` (and/or Supabase service) updated for multiple conversations (list, get, set, delete).  
- App state: `activeConversationId`, list of conversations, and “current messages” = messages of active conversation.

---

## 3. New Chat & Sidebar (ChatGPT/Claude Style)

### 3.1 “New chat” action

- **Button:** e.g. “+ New chat” in the sidebar or header.
- **Behavior:**  
  - Create a new conversation (new UUID, empty messages, default title like “New chat”).  
  - Set it as the active conversation.  
  - Clear the current message list in the UI and optionally clear any “upload” context for this chat.  
  - Persist the new conversation (Supabase + optional localStorage).

### 3.2 Sidebar layout

- **Layout:**  
  - Left: **sidebar** (collapsible on small screens if desired) showing:  
    - “+ New chat”  
    - List of conversations (title + optional date/time).  
  - Right: **main area**: current header, message list, input (unchanged in structure, but bound to active conversation).
- **Conversation list:**  
  - Source: from `listConversations(userId)` (and optional local state).  
  - Each item: click to switch active conversation (load its messages).  
  - Optional: context menu or icon to delete/rename a conversation.

### 3.3 Conversation title

- **Auto-title:** When the first user message is sent, set conversation title to a truncated version of that message (e.g. first 30–50 chars) or “New chat” until then.
- **Optional:** Allow user to edit title in the sidebar (rename); persist via `saveConversation(..., title, ...)`.

### 3.4 Files to touch

- **Layout:**  
  - `App.js`: Add sidebar + state for `conversations`, `activeConversationId`, and handlers (new chat, switch chat, delete chat).  
  - `App.css`: Styles for sidebar and two-column layout (sidebar + main).
- **Components:**  
  - New: `Sidebar.jsx` (or `ChatSidebar.jsx`) with “New chat” button and list of conversations; receives `conversations`, `activeId`, `onNewChat`, `onSelectChat`, `onDeleteChat` (optional).  
  - `ChatHeader`: Can stay as is; optionally add “New chat” here too for small screens.  
  - `MessageList` / `ChatInput`: No API change; they still receive `messages` and `sendMessage` for the **active** conversation (provided by parent).
- **Hooks:**  
  - Refactor **`useChat`** to accept `conversationId` (and optionally `userId`): load/save messages for that conversation only.  
  - New hook or logic in `App.js`: **conversations list** (load from Supabase/local), **activeConversationId**, **newChat**, **selectChat**, **deleteChat**, **updateTitle**.
- **Services:**  
  - As in section 2: `listConversations`, `loadConversation`, `saveConversation`, `deleteConversation` in Supabase (and optionally in storage.js for fallback).

### 3.5 Clear history

- **Current “Clear history”:** Either:  
  - **Option 1:** Becomes “Delete this chat” for the **active** conversation only (delete one conversation, then create or switch to a new one).  
  - **Option 2:** Keep a separate “Clear history” that only clears messages of the current chat (and optionally reset title to “New chat”).  
- Decide and document in UI (e.g. “Delete chat” vs “Clear messages”).

**Deliverables:**  
- Sidebar component with “New chat” and conversation list.  
- App layout: sidebar + main; state for active conversation and list.  
- `useChat` refactored to be per-conversation.  
- New chat creates new conversation and switches to it.  
- Optional: delete chat, rename/auto-title.

---

## 4. Implementation Order

1. **Models (1)**  
   - Add `listModels` in `ollamaService.js`.  
   - Update Settings panel with model dropdown (and optional custom model).  
   - Optionally add header model switcher.

2. **Data model for multi-chat (2)**  
   - Decide Option A vs B; update Supabase schema and add migration.  
   - Implement list/load/save/delete for conversations in `supabaseService.js` (and storage.js if used).

3. **App state and useChat (2 + 3)**  
   - Introduce `activeConversationId` and conversations list in App.  
   - Refactor `useChat(ollamaUrl, modelName, conversationId, ...)` to load/save one conversation.  
   - Wire “new chat” and “switch chat” to this state.

4. **Sidebar and UI (3)**  
   - Add `Sidebar` component and layout in `App.js`/`App.css`.  
   - Implement “New chat” and conversation list; wire delete/rename if desired.  
   - Adjust “Clear history” to “Delete chat” or “Clear messages” as chosen.

5. **Polish**  
   - Auto-title from first message; loading/error states for model list and conversations; mobile-friendly sidebar (e.g. collapse to icon or drawer).

---

## 5. Quick Reference

- **Ollama list models:** `GET {ollamaUrl}/api/tags` → `response.models[]` with `.name`.  
- **Current Supabase:** One row per user in `conversations` with `messages` JSONB.  
- **Target:** Multiple rows per user (one per conversation) with `id`, `title`, `messages`, `updated_at` (Option A), or sessions + messages (Option B).  
- **New chat:** Create new conversation, set active, show empty message list.  
- **Sidebar:** List conversations; select = load that conversation’s messages into the main view.

This plan gives a clear path to list models, switch model, support multiple chat histories, and provide a ChatGPT/Claude-style “New chat” and sidebar.
