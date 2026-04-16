// src/api/client.js
import {
  getSessionCookie,
  readEncryptedTokens,
  clearSessionArtifacts,
} from "../security/authSession.security.js";
import { refreshAccessToken } from "./auth.api.js";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function resolveUsableTokens(sessionId) {
  if (!sessionId) return null;
  const tokens = await readEncryptedTokens(sessionId).catch(() => null);
  if (!tokens?.accessToken) return null;

  const expiresAt = Number(tokens.accessTokenExpiresAt || 0);
  const shouldRefresh = expiresAt > 0 && Date.now() >= expiresAt - 5000;
  if (!shouldRefresh) return tokens;

  try {
    const refreshed = await refreshAccessToken();
    return refreshed;
  } catch {
    clearSessionArtifacts();
    return null;
  }
}

async function buildHeaders() {
  const sessionId = getSessionCookie();
  const tokens = await resolveUsableTokens(sessionId);

  const headers = { "Content-Type": "application/json" };
  if (tokens?.accessToken) headers.Authorization = `Bearer ${tokens.accessToken}`;
  if (sessionId) headers["X-Session-Id"] = sessionId;
  return headers;
}

async function request(method, path, body = null, hasRetried = false) {
  const headers = await buildHeaders();

  const options = {
    method,
    credentials: "include", // necessario per i cookie di sessione
    headers,
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

  if (res.status === 401) {
    if (!hasRetried) {
      try {
        await refreshAccessToken();
        return request(method, path, body, true);
      } catch {
        clearSessionArtifacts();
      }
    }
    clearSessionArtifacts();
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || "Errore API");
  }

  return res.status === 204 ? null : res.json();
}

export const api = {
  get:    (path)         => request("GET",    path),
  post:   (path, body)   => request("POST",   path, body),
  put:    (path, body)   => request("PUT",    path, body),
  delete: (path)         => request("DELETE", path),
};
