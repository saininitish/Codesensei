const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/v1';

// ── Auth storage ───────────────────────────────────────────────────────────────
export const authStorage = {
  getUser: () => {
    try { return JSON.parse(localStorage.getItem('codesensei_user')); } catch { return null; }
  },
  setUser: (user) => {
    localStorage.setItem('codesensei_user', JSON.stringify(user));
    authStorage.saveAccount(user);
  },
  clear: () => localStorage.removeItem('codesensei_user'),

  // Saved accounts (Chrome-style user chooser)
  getSavedAccounts: () => {
    try { return JSON.parse(localStorage.getItem('codesensei_saved_accounts')) || []; } catch { return []; }
  },
  saveAccount: (user) => {
    if (!user?.email) return;
    const list = authStorage.getSavedAccounts().filter(a => a.email !== user.email);
    list.unshift({ id: user.id, name: user.name, email: user.email });
    localStorage.setItem('codesensei_saved_accounts', JSON.stringify(list.slice(0, 10)));
  },
  removeAccount: (email) => {
    const list = authStorage.getSavedAccounts().filter(a => a.email !== email);
    localStorage.setItem('codesensei_saved_accounts', JSON.stringify(list));
  },
};

// Helper: get the current user's ID (used for per-user isolation)
function currentUserId() {
  return authStorage.getUser()?.id || null;
}

// ── API client ────────────────────────────────────────────────────────────────
export const api = {

  // --- Auth ---
  signup: async (name, email, password) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Signup failed');
    authStorage.setUser(data.user);
    return data;
  },

  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    authStorage.setUser(data.user);
    return data;
  },

  logout: () => authStorage.clear(),

  // --- Reviews --- (all scoped to the logged-in user)
  submitReview: async (code, language, sourceType = 'pasted', sourceDisplay = 'Manual Paste') => {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code_input: code,
        language,
        source_type: sourceType,
        source_display: sourceDisplay,
        userId: currentUserId()
      })
    });
    if (!res.ok) throw new Error('Failed to submit review');
    return await res.json();
  },

  getReview: async (id) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`);
    if (!res.ok) throw new Error('Failed to fetch review');
    return await res.json();
  },

  renameReview: async (id, name) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!res.ok) throw new Error('Failed to rename review');
    return await res.json();
  },

  deleteReview: async (id) => {
    const res = await fetch(`${API_BASE}/reviews/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete review');
    return await res.json();
  },

  // Only fetch THIS user's reviews
  getHistory: async () => {
    const userId = currentUserId();
    const url = userId ? `${API_BASE}/reviews?userId=${userId}` : `${API_BASE}/reviews`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch history');
    return await res.json();
  },

  // Only fetch stats for THIS user
  getStats: async () => {
    const userId = currentUserId();
    const url = userId ? `${API_BASE}/dashboard/stats?userId=${userId}` : `${API_BASE}/dashboard/stats`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch stats');
    return await res.json();
  },

  // Per-user settings
  getSettings: async () => {
    const userId = currentUserId();
    const url = userId ? `${API_BASE}/user/settings?userId=${userId}` : `${API_BASE}/user/settings`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch settings');
    return await res.json();
  },

  updateSettings: async (settingsData) => {
    const res = await fetch(`${API_BASE}/user/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settingsData, userId: currentUserId() })
    });
    if (!res.ok) throw new Error('Failed to update settings');
    return await res.json();
  },

  deleteAccount: async () => {
    const res = await fetch(`${API_BASE}/user/account`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId() })
    });
    if (!res.ok) throw new Error('Failed to delete account');
    authStorage.clear();
    return await res.json();
  },

  shareReview: async (id, email, userName) => {
    const res = await fetch(`${API_BASE}/reviews/${id}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, userName })
    });
    if (!res.ok) throw new Error('Failed to share review');
    return await res.json();
  }
};
