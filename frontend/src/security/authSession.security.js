const SESSION_COOKIE_NAME = "pbh_session";
const TOKEN_STORAGE_KEY = "pbh_tokens_encrypted";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(bytes) {
  let binary = "";
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  arr.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function fromBase64(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function isSecureContextEnabled() {
  return typeof window !== "undefined" && window.isSecureContext && typeof crypto?.subtle !== "undefined";
}

async function deriveAesKey(material) {
  const materialBytes = encoder.encode(material);
  const digest = await crypto.subtle.digest("SHA-256", materialBytes);
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function getCookieValue(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
}

export function setSessionCookie(sessionId, maxAgeSeconds = 2 * 60 * 60) {
  if (typeof document === "undefined") return;
  const secure = window?.location?.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Strict${secure}`;
}

export function getSessionCookie() {
  return getCookieValue(SESSION_COOKIE_NAME);
}

export function clearSessionCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Strict`;
}

export async function saveEncryptedTokens(tokens, sessionId) {
  if (!sessionId || typeof sessionStorage === "undefined") return;

  const payload = JSON.stringify(tokens);
  if (!isSecureContextEnabled()) {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify({ mode: "plain", payload }));
    return;
  }

  const key = await deriveAesKey(`pbh:${sessionId}`);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(payload)
  );

  sessionStorage.setItem(
    TOKEN_STORAGE_KEY,
    JSON.stringify({
      mode: "aes-gcm",
      iv: toBase64(iv),
      payload: toBase64(new Uint8Array(encrypted)),
    })
  );
}

export async function readEncryptedTokens(sessionId) {
  if (!sessionId || typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(TOKEN_STORAGE_KEY);
  if (!raw) return null;

  const parsed = JSON.parse(raw);
  if (parsed.mode === "plain") {
    return JSON.parse(parsed.payload);
  }

  if (!isSecureContextEnabled()) return null;

  const key = await deriveAesKey(`pbh:${sessionId}`);
  const iv = fromBase64(parsed.iv);
  const payload = fromBase64(parsed.payload);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    payload
  );
  return JSON.parse(decoder.decode(decrypted));
}

export function clearStoredTokens() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function clearSessionArtifacts() {
  clearSessionCookie();
  clearStoredTokens();
}
