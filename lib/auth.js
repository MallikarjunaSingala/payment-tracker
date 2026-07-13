const COOKIE_NAME = "pt_session";
const USER_COOKIE_NAME = "pt_user";

function getAllowedUsers() {
  const raw = process.env.AUTH_USERS || "Mallikarjuna,Raju,Naik,Shakir";
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

function getPassword() {
  return process.env.AUTH_PASSWORD || "Sleek1@";
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || "dev-only-insecure-secret-change-me";
}

export function validateCredentials(username, password) {
  const users = getAllowedUsers();
  const match = users.find((u) => u.toLowerCase() === String(username || "").trim().toLowerCase());
  if (!match) return null;
  if (password !== getPassword()) return null;
  return match;
}

export function isValidSession(cookieValue) {
  return Boolean(cookieValue) && cookieValue === getSessionSecret();
}

export { COOKIE_NAME, USER_COOKIE_NAME, getAllowedUsers, getSessionSecret };
