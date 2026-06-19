import apiClient, { getToken } from './client';

// AI chat sessions (README Appendix B /api/chat/*).

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const listSessions = () => apiClient.get('/chat/sessions/').then((r) => r.data);

export const createSession = (data) =>
  apiClient.post('/chat/sessions/', data).then((r) => r.data);

export const getSession = (id) => apiClient.get(`/chat/sessions/${id}/`).then((r) => r.data);

// Sends a message and consumes the SSE token stream. `onToken(text)` is invoked
// for each streamed chunk; resolves when the server sends `[DONE]`. Uses fetch
// (not axios) because axios doesn't expose a readable stream in the browser.
// `mentionedUserIds` are resolved client-side via searchUsers (see API.md → Chat).
export const sendMessage = async (sessionId, content, mentionedUserIds = [], onToken) => {
  const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ content, mentioned_user_ids: mentionedUserIds }),
  });

  if (!response.ok || !response.body) {
    throw new Error('Chat request failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      const line = event.trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') return;
      try {
        onToken(JSON.parse(data).text || '');
      } catch {
        /* ignore malformed chunk */
      }
    }
  }
};
