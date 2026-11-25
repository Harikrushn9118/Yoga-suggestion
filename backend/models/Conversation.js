const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 12000 },
    sources: { type: [String], default: [] },
    isUnsafe: { type: Boolean, default: false },
    safeAlternative: { type: String, default: "" },
    interactionId: { type: String, default: "" },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    messages: { type: [messageSchema], default: [] },
    lastMessageAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Conversation", conversationSchema);
