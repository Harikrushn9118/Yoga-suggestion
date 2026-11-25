const User = require("../models/User");
const { COOKIE_NAME, readCookie, verifySession } = require("../services/authService");

const optionalAuth = async (req, res, next) => {
  try {
    const claims = verifySession(readCookie(req, COOKIE_NAME));
    req.user = claims ? await User.findById(claims.sub) : null;
    next();
  } catch (error) {
    next(error);
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to access your saved chats." });
  next();
};

module.exports = { optionalAuth, requireAuth };
