const Interaction = require("../models/Interaction");
const safetyService = require("../services/safetyService");
const ragService = require("../services/ragService");
const Conversation = require("../models/Conversation");

const getGuestHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .filter((message) => message && ["user", "assistant"].includes(message.role) && typeof message.content === "string")
    .slice(-10)
    .map((message) => ({ role: message.role, content: message.content.slice(0, 2500) }));
};

const saveTurn = async ({ req, question, answer, sources, isUnsafe, safeAlternative, conversation }) => {
  if (!req.user) return null;

  const interaction = await Interaction.create({
    userId: req.user._id,
    conversationId: conversation._id,
    userQuestion: question,
    answer,
    sources,
    isUnsafe,
  });

  conversation.messages.push(
    { role: "user", content: question },
    {
      role: "assistant",
      content: answer,
      sources,
      isUnsafe,
      safeAlternative: safeAlternative || "",
      interactionId: String(interaction._id),
    }
  );
  conversation.lastMessageAt = new Date();
  await conversation.save();
  return interaction;
};

// POST /ask
const askQuestion = async (req, res) => {
  try {
    const { question, conversationId } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }
    if (typeof question !== "string" || question.trim().length > 2000) {
      return res.status(400).json({ error: "Questions must be 1 to 2,000 characters." });
    }
    const cleanQuestion = question.trim();

    let conversation = null;
    let history = getGuestHistory(req.body.history);
    if (req.user) {
      if (conversationId) {
        conversation = await Conversation.findOne({ _id: conversationId, userId: req.user._id });
        if (!conversation) return res.status(404).json({ error: "Chat not found." });
      } else {
        conversation = await Conversation.create({
          userId: req.user._id,
          title: cleanQuestion.slice(0, 80),
        });
      }
      history = conversation.messages.slice(-10).map(({ role, content }) => ({ role, content }));
    }

    console.log(`[USER PROMPT]: ${cleanQuestion}`);
    const safetyCheck = safetyService.checkSafety(cleanQuestion);
    if (safetyCheck.isUnsafe) {
      const interaction = await saveTurn({
        req,
        question: cleanQuestion,
        answer: safetyCheck.warning,
        sources: [],
        isUnsafe: true,
        safeAlternative: safetyCheck.safeAlternative,
        conversation,
      });

      return res.json({
        answer: safetyCheck.warning,
        sources: [],
        isUnsafe: true,
        safeAlternative: safetyCheck.safeAlternative,
        conversationId: conversation ? String(conversation._id) : null,
        interactionId: interaction ? String(interaction._id) : null,
      });
    }

    const ragResult = await ragService.getAnswer(cleanQuestion, history);
    const interaction = await saveTurn({
      req,
      question: cleanQuestion,
      answer: ragResult.answer,
      sources: ragResult.sources,
      isUnsafe: false,
      conversation,
    });

    res.json({
      answer: ragResult.answer,
      sources: ragResult.sources,
      isUnsafe: false,
      conversationId: conversation ? String(conversation._id) : null,
      interactionId: interaction ? String(interaction._id) : null,
    });
  } catch (error) {
    console.error("Error in askQuestion:", error);
    const details = error.message || String(error);
    // Surface the actual error so it's easier to debug in production
    res.status(500).json({
      error: `An error occurred while processing your request: ${details}`,
      details,
    });
  }
};

// POST /feedback
const submitFeedback = async (req, res) => {
  try {
    const { questionId, feedback } = req.body; // feedback: 'up' or 'down'

    if (!questionId || !["up", "down"].includes(feedback)) {
      return res
        .status(400)
        .json({ error: "questionId and feedback are required" });
    }

    const interaction = await Interaction.findOne({ _id: questionId, userId: req.user._id });
    if (!interaction) {
      return res.status(404).json({ error: "Interaction not found" });
    }

    interaction.feedback = feedback;
    await interaction.save();

    res.json({ message: "Feedback submitted successfully" });
  } catch (error) {
    console.error("Error in submitFeedback:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  askQuestion,
  submitFeedback,
};
