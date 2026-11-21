import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, IS_MOCK_ENV } from '../lib/supabase';
import { dispatchRollback } from '../lib/rollback';

const MessagingContext = createContext();

const ADMIN_ID = 'usr_admin';

export function MessagingProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messagingLoading, setMessagingLoading] = useState(true);

  useEffect(() => {
    if (IS_MOCK_ENV) {
      setMessagingLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const { data: convData, error: convErr } = await supabase.from('conversations').select('*');
        if (convData && !convErr) {
          setConversations(convData.map(c => ({
            id: c.id, userId: c.user_id, adminUnread: c.admin_unread,
            userUnread: c.user_unread, lastTimestamp: c.last_timestamp
          })));
        }

        const { data: msgData, error: msgErr } = await supabase.from('messages').select('*');
        if (msgData && !msgErr) {
          setMessages(msgData.map(m => ({
            id: m.id, conversationId: m.conversation_id, senderId: m.sender_id,
            senderRole: m.sender_role, content: m.content, timestamp: m.timestamp,
            attachments: m.attachments, txContext: m.tx_context
          })));
        }
      } catch (e) {
        console.error('[MessagingContext] Failed to fetch data', e);
      } finally {
        setMessagingLoading(false);
      }
    };

    fetchData();

    // Live subscription for real-time messages
    const channel = supabase
      .channel('messages_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Get or create conversation for a user
  const getOrCreateConversation = async (userId) => {
    const existing = conversations.find((c) => c.userId === userId);
    if (existing) return existing;
    const newConv = {
      id: `conv_${userId}`,
      userId,
      adminUnread: 0,
      userUnread: 0,
      lastTimestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    const prevConversations = [...conversations];
    setConversations((prev) => [newConv, ...prev]);

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('conversations').upsert({
            id: newConv.id,
            user_id: newConv.userId,
            admin_unread: newConv.adminUnread,
            user_unread: newConv.userUnread,
            last_timestamp: newConv.lastTimestamp
          });
          if (error) throw error;
        } catch (err) {
          console.error('[getOrCreateConversation bg sync error - reverting]', err);
          setConversations(prevConversations);
          dispatchRollback('Failed to create support chat on backend. Reverted.');
        }
      })();
    }
    return newConv;
  };

  // Helper to parse timestamps reliably
  const getTimestampMs = (m) => {
    if (!m) return 0;
    if (m.timestamp) {
      if (typeof m.timestamp === 'number') return m.timestamp;
      const str = String(m.timestamp).trim();
      const normalized = str.replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:)/, '$1T');
      const parsed = new Date(normalized).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    if (m.id) {
      const match = String(m.id).match(/\d{10,}/);
      if (match) return parseInt(match[0], 10);
    }
    return 0;
  };

  // Get messages for a conversation (chronological: oldest first)
  const getMessages = (conversationId) =>
    messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => getTimestampMs(a) - getTimestampMs(b));

  const getConversationByUserId = (userId) =>
    conversations.find((c) => c.userId === userId) || null;

  // Send a message
  const sendMessage = async ({ conversationId, senderId, senderRole, content, attachments = [], txContext = null }) => {
    const timestamp = new Date().toISOString();
    const newMsg = {
      id: `msg_${Date.now()}`,
      conversationId,
      senderId,
      senderRole,
      content: content.trim(),
      timestamp,
      attachments,
      txContext,
    };

    const prevMessages = [...messages];
    const prevConversations = [...conversations];

    setMessages((prev) => [...prev, newMsg]);

    let updatedConv;
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== conversationId) return c;
        updatedConv = {
          ...c,
          lastTimestamp: timestamp,
          adminUnread: senderRole === 'user' ? c.adminUnread + 1 : c.adminUnread,
          userUnread: senderRole === 'admin' ? c.userUnread + 1 : c.userUnread,
        };
        return updatedConv;
      })
    );

    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const targetConv = updatedConv || {
            id: conversationId,
            userId: senderRole === 'user' ? senderId : conversationId.replace('conv_', ''),
            adminUnread: senderRole === 'user' ? 1 : 0,
            userUnread: senderRole === 'admin' ? 1 : 0,
            lastTimestamp: timestamp,
          };

          await supabase.from('conversations').upsert({
            id: targetConv.id,
            user_id: targetConv.userId,
            admin_unread: targetConv.adminUnread,
            user_unread: targetConv.userUnread,
            last_timestamp: targetConv.lastTimestamp,
          });

          const { error: msgErr } = await supabase.from('messages').insert({
            id: newMsg.id,
            conversation_id: newMsg.conversationId,
            sender_id: newMsg.senderId,
            sender_role: newMsg.senderRole,
            content: newMsg.content,
            timestamp: newMsg.timestamp,
            attachments: newMsg.attachments,
            tx_context: newMsg.txContext,
          });
          if (msgErr) throw msgErr;
        } catch (err) {
          console.error('[sendMessage bg sync error - reverting]', err);
          setMessages(prevMessages);
          setConversations(prevConversations);
          dispatchRollback('Message delivery failed on backend. Message was reverted.');
        }
      })();
    }

    return newMsg;
  };

  const markAdminRead = async (conversationId) => {
    const prevConversations = [...conversations];
    setConversations((prevConvs) =>
      prevConvs.map((c) => (c.id === conversationId ? { ...c, adminUnread: 0 } : c))
    );
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('conversations').update({ admin_unread: 0 }).eq('id', conversationId);
          if (error) throw error;
        } catch (err) {
          console.error('[markAdminRead bg sync error - reverting]', err);
          setConversations(prevConversations);
          dispatchRollback('Failed to update unread status on backend. Reverted.');
        }
      })();
    }
  };

  const markUserRead = async (conversationId) => {
    const prevConversations = [...conversations];
    setConversations((prevConvs) =>
      prevConvs.map((c) => (c.id === conversationId ? { ...c, userUnread: 0 } : c))
    );
    if (!IS_MOCK_ENV) {
      (async () => {
        try {
          const { error } = await supabase.from('conversations').update({ user_unread: 0 }).eq('id', conversationId);
          if (error) throw error;
        } catch (err) {
          console.error('[markUserRead bg sync error - reverting]', err);
          setConversations(prevConversations);
          dispatchRollback('Failed to update unread status on backend. Reverted.');
        }
      })();
    }
  };

  const totalAdminUnread = conversations.reduce((sum, c) => sum + (c.adminUnread || 0), 0);

  const getUserUnread = (userId) => {
    const conv = conversations.find((c) => c.userId === userId);
    return conv?.userUnread || 0;
  };

  const sortedConversations = [...conversations].sort(
    (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
  );

  return (
    <MessagingContext.Provider
      value={{
        conversations: sortedConversations,
        messages,
        messagingLoading,
        getMessages,
        getConversationByUserId,
        getOrCreateConversation,
        sendMessage,
        markAdminRead,
        markUserRead,
        totalAdminUnread,
        getUserUnread,
        ADMIN_ID,
      }}
    >
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  return useContext(MessagingContext);
}
