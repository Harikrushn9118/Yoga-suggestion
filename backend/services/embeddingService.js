const genAI = require("../config/genAI");

// Use Gemini's embedding model via API — no local model, no memory issues.
const embeddingModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

const getEmbedding = async (text) => {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }] },
    outputDimensionality: 768,
  });
  return result.embedding.values; // 768-dim float array
};

module.exports = { getEmbedding };
