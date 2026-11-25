const Conversation = require("../models/Conversation");

const listConversations = async (req, res) => {
  const conversations = await Conversation.find({ userId: req.user._id })
    .sort({ lastMessageAt: -1 })
    .limit(50)
    .select("title createdAt updatedAt lastMessageAt");
  res.json({
    conversations: conversations.map((conversation) => ({
      id: String(conversation._id),
      title: conversation.title,
      updatedAt: conversation.lastMessageAt,
    })),
  });
};

const getConversation = async (req, res) => {
  const conversation = await Conversation.findOne({ _id: req.params.id, userId: req.user._id });
  if (!conversation) return res.status(404).json({ error: "Chat not found." });
  res.json({
    conversation: {
      id: String(conversation._id),
      title: conversation.title,
      messages: conversation.messages,
    },
  });
};

module.exports = { listConversations, getConversation };
