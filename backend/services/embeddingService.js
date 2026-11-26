const genAI = require("../config/genAI");

// Use Gemini's text-embedding-004 (768 dimensions by default).
// This runs entirely via API — no local model, no memory issues on Render.
const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

const getEmbedding = async (text) => {
  const result = await embeddingModel.embedContent(text);
  return result.embedding.values; // 768-dim float array
};

module.exports = { getEmbedding };
