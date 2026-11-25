const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const authController = require("../controllers/authController");
const conversationController = require("../controllers/conversationController");
const { requireAuth } = require("../middleware/auth");

router.post("/auth/register", authController.register);
router.post("/auth/login", authController.login);
router.post("/auth/google", authController.googleLogin);
router.get("/auth/me", requireAuth, authController.me);
router.post("/auth/logout", authController.logout);

router.get("/conversations", requireAuth, conversationController.listConversations);
router.get("/conversations/:id", requireAuth, conversationController.getConversation);
router.post("/ask", chatController.askQuestion);
router.post("/feedback", requireAuth, chatController.submitFeedback);

module.exports = router;
