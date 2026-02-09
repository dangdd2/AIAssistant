import { supabase } from './supabaseClient';

// --- Multi-chat: one row per conversation (id, user_id, title, messages, updated_at) ---

/**
 * List conversations for a user (id, title, updated_at, model), newest first
 * @param {string} userId - User ID
 * @returns {Promise<Array<{ id: string, title: string, updated_at: string, model?: string }>>}
 */
export const listConversations = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('id, title, updated_at, model')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map((row) => ({ ...row, model: row.model || null }));
};

/**
 * Load one conversation's messages, title, and model
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation UUID
 * @returns {Promise<{ messages: Array, title: string, model?: string }|null>}
 */
export const loadConversation = async (userId, conversationId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('messages, title, model')
    .eq('user_id', userId)
    .eq('id', conversationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data
    ? {
        messages: data.messages || [],
        title: data.title || 'New chat',
        model: data.model || null,
      }
    : null;
};

/**
 * Save (upsert) one conversation by id
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation UUID
 * @param {string} title - Conversation title
 * @param {Array} messages - Messages array
 * @param {string} [model] - Model name for this conversation
 */
export const saveConversation = async (userId, conversationId, title, messages, model) => {
  const payload = {
    id: conversationId,
    user_id: userId,
    title: title || 'New chat',
    messages: messages || [],
    updated_at: new Date().toISOString(),
  };
  if (model != null) payload.model = model;

  const { error } = await supabase.from('conversations').upsert(payload, { onConflict: 'id' });

  if (error) throw error;
};

/**
 * Update only the model (and updated_at) of a conversation
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation UUID
 * @param {string} model - Model name
 */
export const updateConversationModel = async (userId, conversationId, model) => {
  const { error } = await supabase
    .from('conversations')
    .update({
      model: model || null,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Update only the title (and updated_at) of a conversation
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation UUID
 * @param {string} title - New title
 */
export const updateConversationTitle = async (userId, conversationId, title) => {
  const { error } = await supabase
    .from('conversations')
    .update({
      title: title || 'New chat',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('id', conversationId);

  if (error) throw error;
};

/**
 * Delete one conversation
 * @param {string} userId - User ID
 * @param {string} conversationId - Conversation UUID
 */
export const deleteConversation = async (userId, conversationId) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId)
    .eq('id', conversationId);

  if (error) throw error;
};

// --- Legacy (single conversation per user); kept for reference / migration ---

/**
 * @deprecated Use loadConversation(userId, conversationId) for multi-chat
 */
export const loadMessages = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data?.messages || null;
};

/**
 * @deprecated Use saveConversation(userId, conversationId, title, messages) for multi-chat
 */
export const saveMessages = async (userId, messages) => {
  const { error } = await supabase
    .from('conversations')
    .upsert(
      {
        user_id: userId,
        messages: messages,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
};

/**
 * @deprecated Use deleteConversation(userId, conversationId) for multi-chat
 */
export const deleteMessages = async (userId) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};
