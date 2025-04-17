// client/src/auth.js
/* Simple helpers for token handling + auto‑header fetch */

export const getToken  = () => localStorage.getItem('token');
export const setToken  = (t) => localStorage.setItem('token', t);
export const clearAuth = () => localStorage.removeItem('token');
export const isAuthed  = () => Boolean(getToken());

export const apiFetch = (url, opts = {}) => {
  const headers = { ...opts.headers };
  const t = getToken();
  if (t) headers['Authorization'] = `Bearer ${t}`;

  return fetch(url, { ...opts, headers });
};
