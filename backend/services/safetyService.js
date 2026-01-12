const unsafeKeywords = [
  "pregnant",
  "pregnancy",
  "trimester",
  "baby",
  "prenatal",
  "medical",
  "surgery",
  "pain",
  "doctor",
  "hospital",
  "hernia",
  "glaucoma",
  "blood pressure",
  "bp",
  "heart condition",
  "injury",
  "diagnosis",
  "cure",
  "treatment",
  "medication",
];

const checkSafety = (query) => {
  const lowerQuery = query.toLowerCase();
  const foundKeywords = unsafeKeywords.filter((keyword) =>
    lowerQuery.includes(keyword)
  );

  if (foundKeywords.length > 0) {
    return {
      isUnsafe: true,
      warning:
        "I cannot provide medical advice or suggestions for specific medical conditions (like pregnancy, injuries, or chronic diseases). Please consult a certified yoga therapist or medical professional.",
      safeAlternative:
        "Try asking about general yoga poses for relaxation, flexibility, or strength.",
    };
  }

  return { isUnsafe: false };
};

module.exports = { checkSafety };
