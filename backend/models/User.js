const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    displayName: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    passwordHash: { type: String, default: null, select: false },
    googleSub: { type: String, unique: true, sparse: true },
    avatarUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
