import { useState, useRef, useEffect } from "react";
import Header from "./components/Header";
import SearchInput from "./components/SearchInput";
import LoadingState from "./components/LoadingState";
import SafetyWarning from "./components/SafetyWarning";
import AnswerCard from "./components/AnswerCard";

function App() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const resultRef = useRef(null);

  const handleAsk = () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);

    // Mock API call
    setTimeout(() => {
      // Mock response based on query keywords for demonstration
      const isUnsafe =
        query.toLowerCase().includes("pain") ||
        query.toLowerCase().includes("injury");

      setResult({
        answer:
          "To practice this pose safely, begin in Tadasana. Inhale and raise your arms overhead. Exhale and fold forward from your hips, keeping your spine long. If you have tight hamstrings, bend your knees slightly. Let your head hang heavy and relax your neck. Hold for 5-10 breaths.",
        safetyWarning: isUnsafe,
        sources: [
          { id: 1, title: "Light on Yoga - B.K.S. Iyengar" },
          { id: 2, title: "Yoga Journal - Safe Forward Folds" },
          { id: 3, title: "Anatomy of Hatha Yoga" },
        ],
      });
      setIsLoading(false);
    }, 2000);
  };

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 dark:selection:bg-indigo-900/30 flex flex-col">
      <div className="w-full h-full flex-1 flex flex-col items-center justify-center p-4 md:p-8 transition-all duration-500">
        <Header hasResult={!!result} />

        <SearchInput
          query={query}
          setQuery={setQuery}
          handleAsk={handleAsk}
          isLoading={isLoading}
        />

        {isLoading && <LoadingState />}

        {result && !isLoading && (
          <div
            ref={resultRef}
            className="w-full max-w-3xl mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-forwards"
          >
            <SafetyWarning isUnsafe={result.safetyWarning} />
            <AnswerCard answer={result.answer} sources={result.sources} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
