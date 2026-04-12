// src/api/client.js
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(method, path, body = null) {
  const options = {
    method,
    credentials: "include", // necessario per i cookie di sessione
    headers: { "Content-Type": "application/json" },
  };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(`${BASE_URL}${path}`, options);

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
