const User = require("../models/User");
const { verifyGoogleIdToken } = require("../services/googleTokenService");
const {
  setSessionCookie,
  clearSessionCookie,
  hashPassword,
  comparePassword,
} = require("../services/authService");

const publicUser = (user) => ({
  id: String(user._id),
  name: user.displayName,
  email: user.email,
  avatarUrl: user.avatarUrl || "",
});

const authIsConfigured = () => process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32;

const register = async (req, res) => {
  try {
    if (!authIsConfigured()) return res.status(503).json({ error: "Account sign-in is not configured yet." });
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (name.length < 2 || name.length > 100) {
      return res.status(400).json({ error: "Enter a name between 2 and 100 characters." });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (password.length < 8 || password.length > 200) {
      return res.status(400).json({ error: "Use a password between 8 and 200 characters." });
    }

    const user = await User.create({ displayName: name, email, passwordHash: await hashPassword(password) });
    setSessionCookie(res, user._id);
    res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ error: "An account with this email already exists." });
    console.error("Registration failed:", error);
    res.status(500).json({ error: "Could not create your account. Please try again." });
  }
};

const login = async (req, res) => {
  try {
    if (!authIsConfigured()) return res.status(503).json({ error: "Account sign-in is not configured yet." });
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await comparePassword(password, user.passwordHash))) {
      return res.status(401).json({ error: "Email or password is incorrect." });
    }
    setSessionCookie(res, user._id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Login failed:", error);
    res.status(500).json({ error: "Could not sign in. Please try again." });
  }
};

const googleLogin = async (req, res) => {
  try {
    if (!authIsConfigured()) return res.status(503).json({ error: "Account sign-in is not configured yet." });
    const credential = typeof req.body.credential === "string" ? req.body.credential : "";
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(503).json({ error: "Google sign-in is not configured yet." });
    if (!credential) return res.status(400).json({ error: "Google did not return a sign-in credential." });

    let claims;
    try {
      claims = await verifyGoogleIdToken(credential, clientId);
    } catch {
      return res.status(401).json({ error: "Google sign-in could not be verified." });
    }

    let user = await User.findOne({ $or: [{ googleSub: claims.sub }, { email: claims.email.toLowerCase() }] });
    if (!user) {
      user = await User.create({
        displayName: claims.name || claims.email.split("@")[0],
        email: claims.email,
        googleSub: claims.sub,
        avatarUrl: claims.picture || "",
      });
    } else {
      if (!user.googleSub) user.googleSub = claims.sub;
      if (!user.avatarUrl && claims.picture) user.avatarUrl = claims.picture;
      await user.save();
    }

    setSessionCookie(res, user._id);
    res.json({ user: publicUser(user) });
  } catch (error) {
    console.error("Google sign-in failed:", error);
    res.status(502).json({ error: "Could not complete Google sign-in. Please try again." });
  }
};

const me = (req, res) => res.json({ user: publicUser(req.user) });

const logout = (req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
};

module.exports = { register, login, googleLogin, me, logout };
