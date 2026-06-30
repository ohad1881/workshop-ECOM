import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ChatWidgetContext } from './ChatWidgetContext';
import { createSession, sendMessage } from '../../api/chat';

const EMPTY_STREAM = { sessionId: null, pendingUser: '', buffer: '', isStreaming: false, error: null };

// Owns the widget's open/view state AND the in-flight SSE stream. Because the
// provider sits above the router and the panel is non-modal, a streaming answer
// keeps running while the user browses or closes the panel.
export const ChatWidgetProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'conversation'
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [stream, setStream] = useState(EMPTY_STREAM);

  const close = useCallback(() => setOpen(false), []);
  const showList = useCallback(() => { setView('list'); setActiveSessionId(null); }, []);
  const openSession = useCallback((id) => { setActiveSessionId(id); setView('conversation'); setOpen(true); }, []);

  // Stream a turn. Held here so it outlives the conversation component.
  const sendInSession = useCallback(async ({ sessionId, content, mentionedUserIds = [], mentionedProductIds = [] }) => {
    setStream({ sessionId, pendingUser: content, buffer: '', isStreaming: true, error: null });
    try {
      await sendMessage(
        sessionId,
        content,
        { mentionedUserIds, mentionedProductIds },
        (text) => setStream((s) => (s.sessionId === sessionId ? { ...s, buffer: s.buffer + text } : s)),
      );
    } catch {
      setStream((s) => ({ ...s, isStreaming: false, error: 'Something went wrong. Please try again.' }));
      return;
    }
    // Persisted server-side now — refetch history, then drop the local stream state.
    await queryClient.invalidateQueries({ queryKey: ['chat', 'session', sessionId] });
    queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    setStream(EMPTY_STREAM);
  }, [queryClient]);

  // Create a session and jump into it. Called blank for a fresh free-text chat, or with
  // context. The gift-builder handoff passes `bundle_product_ids`; the backend then seeds
  // the session with a handoff message + a canned greeting carrying the bundle card.
  const startSession = useCallback(async (payload = {}) => {
    const body = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== null));
    const session = await createSession(body);
    queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] });
    openSession(session.id);
  }, [queryClient, openSession]);

  // FAB / external entry point. With a prefill (gift-builder) we start a session
  // immediately; otherwise we open the session list.
  const openChat = useCallback((prefill = null) => {
    setOpen(true);
    if (prefill) {
      const bundleProductIds = (prefill.bundleItems ?? []).map((item) => item.product?.id).filter(Boolean);
      startSession({
        recipient_id: prefill.recipient?.id,
        budget: prefill.budget,
        event_type: prefill.eventType,
        bundle_product_ids: bundleProductIds,
      });
    } else {
      setView((v) => (v === 'conversation' ? v : 'list'));
    }
  }, [startSession]);

  const value = useMemo(() => ({
    open, view, activeSessionId, stream,
    openChat, close, showList, openSession, startSession, sendInSession,
  }), [open, view, activeSessionId, stream, openChat, close, showList, openSession, startSession, sendInSession]);

  return <ChatWidgetContext.Provider value={value}>{children}</ChatWidgetContext.Provider>;
};
