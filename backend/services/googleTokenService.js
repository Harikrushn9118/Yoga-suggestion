const crypto = require("node:crypto");

const GOOGLE_KEYS_URL = "https://www.googleapis.com/oauth2/v3/certs";
let cachedKeys = new Map();
let keysExpireAt = 0;

const decodePart = (part) => JSON.parse(Buffer.from(part, "base64url").toString("utf8"));

async function loadGoogleKeys(forceRefresh = false) {
  if (!forceRefresh && cachedKeys.size && Date.now() < keysExpireAt) return cachedKeys;

  const response = await fetch(GOOGLE_KEYS_URL, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("Could not load Google's signing keys.");
  const body = await response.json();
  const keys = new Map((body.keys || []).filter((key) => key.kid && key.kty === "RSA").map((key) => [key.kid, key]));
  if (!keys.size) throw new Error("Google returned no signing keys.");

  const maxAge = Number(response.headers.get("cache-control")?.match(/max-age=(\d+)/i)?.[1] || 3600);
  cachedKeys = keys;
  keysExpireAt = Date.now() + maxAge * 1000;
  return cachedKeys;
}

async function verifyGoogleIdToken(token, expectedClientId) {
  if (typeof token !== "string" || token.length > 12000) throw new Error("Invalid Google credential.");
  const [encodedHeader, encodedPayload, encodedSignature, extra] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature || extra) throw new Error("Invalid Google credential.");

  const header = decodePart(encodedHeader);
  const claims = decodePart(encodedPayload);
  if (header.alg !== "RS256" || !header.kid) throw new Error("Unsupported Google credential signature.");

  let keySet = await loadGoogleKeys();
  if (!keySet.has(header.kid)) keySet = await loadGoogleKeys(true);
  const jwk = keySet.get(header.kid);
  if (!jwk) throw new Error("Google credential uses an unknown signing key.");

  const publicKey = crypto.createPublicKey({ key: jwk, format: "jwk" });
  const validSignature = crypto.verify(
    "RSA-SHA256",
    Buffer.from(`${encodedHeader}.${encodedPayload}`),
    publicKey,
    Buffer.from(encodedSignature, "base64url")
  );
  if (!validSignature) throw new Error("Google credential signature is invalid.");

  const validIssuer = ["accounts.google.com", "https://accounts.google.com"].includes(claims.iss);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  const validAudience = audiences.includes(expectedClientId);
  const validAuthorizedParty = audiences.length === 1 || claims.azp === expectedClientId;
  const now = Math.floor(Date.now() / 1000);
  const validTime = Number(claims.exp) > now
    && (!claims.iat || Number(claims.iat) <= now + 60)
    && (claims.nbf === undefined || Number(claims.nbf) <= now);
  const verifiedEmail = claims.email_verified === true || claims.email_verified === "true";

  if (!validIssuer || !validAudience || !validAuthorizedParty || !validTime || !verifiedEmail || !claims.sub || !claims.email) {
    throw new Error("Google credential claims are invalid.");
  }
  return claims;
}

module.exports = { verifyGoogleIdToken };
