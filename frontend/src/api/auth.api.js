// src/api/auth.api.js — MOCK TEMPORANEO (nessun backend richiesto)
// Credenziali disponibili:
//   utente:  username "user"  | password "user123"
//   admin:   username "admin" | password "admin123"

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

const USERS = {
  user:  { id: 1, username: "user",  role: "user" },
  admin: { id: 2, username: "admin", role: "admin" },
};
const PASSWORDS = { user: "user123", admin: "admin123" };

let currentUser = null;

export const login = async (username, password) => {
  await delay(600);
  if (!USERS[username] || PASSWORDS[username] !== password)
    throw new Error("Credenziali non valide.");
  currentUser = USERS[username];
  return currentUser;
};

export const logout = async () => {
  await delay(300);
  currentUser = null;
  return null;
};

export const getMe = async () => {
  await delay(200);
  if (!currentUser) throw new Error("Non autenticato.");
  return currentUser;
};
