const STORAGE_KEY = 'webmind-chat-sessions';

function loadSessions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function getSessions() {
  return loadSessions();
}

export function createSession() {
  const sessions = loadSessions();
  const session = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    title: 'New chat',
    messages: [],
    createdAt: new Date().toISOString(),
  };
  sessions.unshift(session);
  saveSessions(sessions);
  return session;
}

export function getSession(id) {
  return loadSessions().find(s => s.id === id) || null;
}

export function updateSession(id, updates) {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  saveSessions(sessions);
  return sessions[idx];
}

export function deleteSession(id) {
  const sessions = loadSessions().filter(s => s.id !== id);
  saveSessions(sessions);
}

export function addMessage(sessionId, message) {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === sessionId);
  if (idx === -1) return;
  sessions[idx].messages.push(message);
  // Auto-title from first user message
  if (sessions[idx].title === 'New chat' && message.role === 'user') {
    sessions[idx].title = message.text.slice(0, 60);
  }
  saveSessions(sessions);
}
