import crypto from "crypto";

// Stateless, signed "magic link" tokens for the contractor self-service
// portal. No database/storage needed: the token itself encodes the
// contractor name plus an HMAC signature, so anyone holding a valid token
// can view that one contractor's data - and only that contractor, since
// the signature can't be forged without CONTRACTOR_PORTAL_SECRET.
//
// This mirrors the fail-closed pattern used for admin auth in lib/auth.js:
// no secret configured -> tokens can't be minted or verified, full stop.

function getPortalSecret() {
  return process.env.CONTRACTOR_PORTAL_SECRET || null;
}

function base64UrlEncode(str) {
  return Buffer.from(str, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str) {
  let s = String(str).replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64").toString("utf8");
}

function sign(name, secret) {
  return crypto.createHmac("sha256", secret).update(name, "utf8").digest("hex").slice(0, 24);
}

// Returns a URL-safe token string, or null if the portal secret isn't
// configured yet.
export function generateContractorToken(contractorName) {
  const secret = getPortalSecret();
  if (!secret || !contractorName) return null;
  const encoded = base64UrlEncode(contractorName);
  const sig = sign(contractorName, secret);
  return `${encoded}.${sig}`;
}

// Returns the contractor name if the token is valid, or null if the token
// is malformed, forged, or the portal secret isn't configured.
export function verifyContractorToken(token) {
  const secret = getPortalSecret();
  if (!secret || !token) return null;

  const parts = String(token).split(".");
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;

  let name;
  try {
    name = base64UrlDecode(encoded);
  } catch {
    return null;
  }
  if (!name) return null;

  const expected = sign(name, secret);
  const expectedBuf = Buffer.from(expected);
  const sigBuf = Buffer.from(String(sig));
  if (expectedBuf.length !== sigBuf.length) return null;

  return crypto.timingSafeEqual(expectedBuf, sigBuf) ? name : null;
}

export function isPortalConfigured() {
  return Boolean(getPortalSecret());
}
