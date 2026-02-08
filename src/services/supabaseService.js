import { supabase } from './supabaseClient';

/**
 * Load messages from Supabase for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array|null>} Messages array or null if not found
 */
export const loadMessages = async (userId) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('messages')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No existing conversation
      return null;
    }
    throw error;
  }

  return data?.messages || null;
};

/**
 * Save messages to Supabase
 * @param {string} userId - User ID
 * @param {Array} messages - Messages array
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
 * Delete all messages for a user
 * @param {string} userId - User ID
 */
export const deleteMessages = async (userId) => {
  const { error } = await supabase
    .from('conversations')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};
