const { pipeline } = require("@xenova/transformers");

// Use a singleton pattern to lazy-load the model
let extractor = null;

// 'Xenova/all-mpnet-base-v2' outputs 768-dim vectors, matching the Pinecone index.
const MODEL_NAME = "Xenova/all-mpnet-base-v2";
const EMBEDDING_DIM = 768;

const getEmbedding = async (text) => {
  if (!extractor) {
    console.log(`Loading embedding model: ${MODEL_NAME} (${EMBEDDING_DIM}d)...`);
    extractor = await pipeline("feature-extraction", MODEL_NAME);
    console.log("Embedding model loaded.");
  }

  // Generate embedding
  const output = await extractor(text, { pooling: "mean", normalize: true });

  // Convert Tensor to standard array
  return Array.from(output.data);
};

module.exports = { getEmbedding, EMBEDDING_DIM };
