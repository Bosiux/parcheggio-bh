import {
  setSessionCookie,
  getSessionCookie,
  clearSessionArtifacts,
  saveEncryptedTokens,
} from "../security/authSession.security.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function authRequest(path, method, body = null) {
  const sessionId = getSessionCookie();
  const headers = { "Content-Type": "application/json" };
  if (sessionId) headers["X-Session-Id"] = sessionId;

  const options = {
    method,
    credentials: "include",
    headers,
  };

  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.message || "Errore autenticazione");
  return payload;
}

async function persistSession(payload) {
  if (!payload?.sessionId || !payload?.tokens) return;
  setSessionCookie(payload.sessionId, 2 * 60 * 60);
  await saveEncryptedTokens(payload.tokens, payload.sessionId);
}

export const login = async (username, password) => {
  const payload = await authRequest("/auth/login", "POST", { username, password });
  await persistSession(payload);
  return payload.user;
};

export const register = async ({ username, password }) => {
  const payload = await authRequest("/auth/register", "POST", { username, password });
  await persistSession(payload);
  return payload.user;
};

export const logout = async () => {
  try {
    await authRequest("/auth/logout", "POST");
  } finally {
    clearSessionArtifacts();
  }
  return null;
};

export const getMe = async () => {
  const payload = await authRequest("/auth/me", "GET");
  return payload.user;
};

export const refreshAccessToken = async () => {
  const payload = await authRequest("/auth/refresh", "POST", {
    sessionId: getSessionCookie(),
  });

  const sessionId = payload.sessionId || getSessionCookie();
  if (sessionId && payload.tokens) {
    await saveEncryptedTokens(payload.tokens, sessionId);
  }

  return payload.tokens || null;
};
