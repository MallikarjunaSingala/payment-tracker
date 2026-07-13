const COOKIE_NAME = "pt_session";
const USER_COOKIE_NAME = "pt_user";

// Usernames are not sensitive, so a sane default is fine here. The password
// and session secret are NOT defaulted on purpose: this repo is public, and
// a hardcoded fallback secret would be visible to anyone browsing GitHub,
// making the login gate bypassable. Both must be set as real env vars.
function getAllowedUsers() {
  const raw = process.env.AUTH_USERS || "Mallikarjuna,Raju,Naik,Shakir";
  return raw
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
}

function getPassword() {
  return process.env.AUTH_PASSWORD || null;
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || null;
}

export function validateCredentials(username, password) {
  const configuredPassword = getPassword();
  if (!configuredPassword) return null; // fail closed if not configured

  const users = getAllowedUsers();
  const match = users.find((u) => u.toLowerCase() === String(username || "").trim().toLowerCase());
  if (!match) return null;
  if (password !== configuredPassword) return null;
  return match;
}

export function isValidSession(cookieValue) {
  const secret = getSessionSecret();
  if (!secret) return false; // fail closed if not configured
  return Boolean(cookieValue) && cookieValue === secret;
}

export { COOKIE_NAME, USER_COOKIE_NAME, getAllowedUsers, getSessionSecret };
