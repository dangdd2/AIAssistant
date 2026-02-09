import { useState, useEffect, useCallback } from 'react';
import { getUserId, getActiveConversationId, setActiveConversationId } from '../utils/storage';
import {
  listConversations,
  saveConversation,
  deleteConversation,
  updateConversationTitle,
} from '../services/supabaseService';
import {
  getLocalConversationIds,
  setLocalConversationIds,
  saveLocalConversation,
  getLocalConversation,
  deleteLocalConversation,
} from '../utils/storage';

const DEFAULT_TITLE = 'New chat';

/**
 * Custom hook for managing conversation list and active conversation
 * @returns {object} conversations, activeConversationId, setActiveConversationId, newChat, selectChat, deleteChat, refreshList
 */
export const useConversations = () => {
  const [userId] = useState(getUserId);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveIdState] = useState(null);

  const refreshList = useCallback(async () => {
    try {
      const list = await listConversations(userId);
      setConversations(list);
      setActiveIdState((current) => {
        if (list.length > 0 && !list.some((c) => c.id === current)) {
          const next = list[0].id;
          setActiveConversationId(next);
          return next;
        }
        return current;
      });
    } catch (err) {
      console.error('Error loading conversations:', err);
      const localIds = getLocalConversationIds();
      setConversations(
        localIds.map((id) => ({ id, title: DEFAULT_TITLE, updated_at: new Date().toISOString() }))
      );
    }
  }, [userId]);

  useEffect(() => {
    let mounted = true;
    const createFirstConversation = async () => {
      const id = crypto.randomUUID();
      const entry = { id, title: DEFAULT_TITLE, updated_at: new Date().toISOString() };
      try {
        await saveConversation(userId, id, DEFAULT_TITLE, []);
      } catch (err) {
        console.error('Error creating first conversation:', err);
      }
      saveLocalConversation(id, { title: DEFAULT_TITLE, messages: [], updatedAt: entry.updated_at });
      const localIds = getLocalConversationIds();
      if (!localIds.includes(id)) setLocalConversationIds([id, ...localIds]);
      if (!mounted) return;
      setConversations([entry]);
      setActiveIdState(id);
      setActiveConversationId(id);
    };

    const init = async () => {
      try {
        const list = await listConversations(userId);
        if (!mounted) return;
        setConversations(list);
        if (list.length === 0) {
          await createFirstConversation();
          return;
        }
        const savedActive = getActiveConversationId();
        const activeId =
          savedActive && list.some((c) => c.id === savedActive) ? savedActive : list[0].id;
        setActiveIdState(activeId);
        setActiveConversationId(activeId);
      } catch (err) {
        console.error('Error loading conversations:', err);
        if (!mounted) return;
        const localIds = getLocalConversationIds();
        if (localIds.length > 0) {
          setConversations(
            localIds.map((id) => ({
              id,
              title: DEFAULT_TITLE,
              updated_at: new Date().toISOString(),
            }))
          );
          const activeId = getActiveConversationId() || localIds[0];
          setActiveIdState(activeId);
          setActiveConversationId(activeId);
        } else {
          await createFirstConversation();
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [userId]);

  const newChat = useCallback(async () => {
    const id = crypto.randomUUID();
    const entry = { id, title: DEFAULT_TITLE, updated_at: new Date().toISOString() };
    try {
      await saveConversation(userId, id, DEFAULT_TITLE, []);
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
    saveLocalConversation(id, { title: DEFAULT_TITLE, messages: [], updatedAt: entry.updated_at });
    const localIds = getLocalConversationIds();
    if (!localIds.includes(id)) {
      setLocalConversationIds([id, ...localIds]);
    }
    setConversations((prev) => [entry, ...prev]);
    setActiveIdState(id);
    setActiveConversationId(id);
    return id;
  }, [userId]);

  const selectChat = useCallback((id) => {
    setActiveIdState(id);
    setActiveConversationId(id);
  }, []);

  const deleteChat = useCallback(
    async (id) => {
      try {
        await deleteConversation(userId, id);
      } catch (err) {
        console.error('Error deleting conversation:', err);
      }
      deleteLocalConversation(id);
      const ids = getLocalConversationIds().filter((x) => x !== id);
      setLocalConversationIds(ids);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      setActiveIdState((current) => {
        if (current === id) {
          const remaining = ids[0] || null;
          setActiveConversationId(remaining);
          return remaining;
        }
        return current;
      });
    },
    [userId]
  );

  const setActiveConversationIdAndState = useCallback((id) => {
    setActiveIdState(id);
    setActiveConversationId(id);
  }, []);

  const setConversationTitle = useCallback((id, title) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: title || c.title } : c))
    );
  }, []);

  const renameConversation = useCallback(
    async (id, title) => {
      const trimmed = (title || '').trim() || DEFAULT_TITLE;
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      );
      const local = getLocalConversation(id);
      if (local) {
        saveLocalConversation(id, {
          ...local,
          title: trimmed,
          updatedAt: new Date().toISOString(),
        });
      }
      try {
        await updateConversationTitle(userId, id, trimmed);
      } catch (err) {
        console.error('Error renaming conversation:', err);
      }
    },
    [userId]
  );

  return {
    conversations,
    activeConversationId,
    setActiveConversationId: setActiveConversationIdAndState,
    setConversationTitle,
    renameConversation,
    newChat,
    selectChat,
    deleteChat,
    refreshList,
  };
};
