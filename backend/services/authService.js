const crypto = require("node:crypto");
const { promisify } = require("node:util");

const scrypt = promisify(crypto.scrypt);
const COOKIE_NAME = "yogaflow_session";
const SESSION_SECONDS = 60 * 60 * 24 * 7;

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set to a random value with at least 32 characters.");
  }
  return secret;
}

function signSession(userId) {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({ sub: String(userId), exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })
  ).toString("base64url");
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", getSecret()).update(unsignedToken).digest("base64url");
  return `${unsignedToken}.${signature}`;
}

function readCookie(req, name) {
  const cookieHeader = req.headers.cookie || "";
  const item = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  if (!item) return null;
  try {
    return decodeURIComponent(item.slice(name.length + 1));
  } catch {
    return null;
  }
}

function verifySession(token) {
  if (!token || typeof token !== "string") return null;
  const [header, payload, encodedSignature, extra] = token.split(".");
  if (!header || !payload || !encodedSignature || extra) return null;

  let expected;
  try {
    expected = crypto.createHmac("sha256", getSecret()).update(`${header}.${payload}`).digest();
  } catch {
    return null;
  }

  let received;
  try {
    received = Buffer.from(encodedSignature, "base64url");
  } catch {
    return null;
  }
  if (expected.length !== received.length || !crypto.timingSafeEqual(expected, received)) return null;

  try {
    const tokenHeader = JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
    if (tokenHeader.alg !== "HS256" || tokenHeader.typ !== "JWT") return null;
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!claims.sub || !Number.isFinite(claims.exp) || claims.exp <= Date.now() / 1000) return null;
    return claims;
  } catch {
    return null;
  }
}

function cookieOptions() {
  const defaultSameSite = process.env.NODE_ENV === "production" ? "none" : "lax";
  const sameSite = (process.env.AUTH_COOKIE_SAME_SITE || defaultSameSite).toLowerCase();
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || sameSite === "none",
    sameSite,
    path: "/",
    maxAge: SESSION_SECONDS * 1000,
  };
}

function setSessionCookie(res, userId) {
  res.cookie(COOKIE_NAME, signSession(userId), cookieOptions());
}

function clearSessionCookie(res) {
  const { maxAge, ...options } = cookieOptions();
  res.clearCookie(COOKIE_NAME, options);
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

async function comparePassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") return false;
  const [salt, hashHex] = storedHash.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await scrypt(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

module.exports = {
  COOKIE_NAME,
  SESSION_SECONDS,
  readCookie,
  verifySession,
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
  comparePassword,
};
