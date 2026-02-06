import { Send, Circle } from "lucide-react";

function SearchInput({ query, setQuery, handleAsk, handleStop, isLoading }) {
  return (
    <div className="w-full max-w-2xl relative group z-10">
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl opacity-20 group-hover:opacity-40 transition duration-500 blur-lg"></div>
      <div className="relative bg-white dark:bg-zinc-800/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center p-2 border border-white/20 dark:border-white/10">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => !isLoading && e.key === "Enter" && handleAsk()}
          placeholder={isLoading ? "Thinking..." : "Ask anything about yoga..."}
          disabled={isLoading}
          className={`flex-1 bg-transparent border-none outline-none px-6 py-4 text-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 w-full disabled:opacity-60 disabled:cursor-not-allowed`}
        />
        <button
          onClick={isLoading ? handleStop : handleAsk}
          disabled={!isLoading && !query.trim()}
          className={`${isLoading
              ? "bg-gray-100 dark:bg-zinc-700/50 hover:bg-gray-200 dark:hover:bg-zinc-700"
              : "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 text-white"
            } p-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg active:scale-95 cursor-pointer flex items-center justify-center min-w-[3rem] min-h-[3rem]`}
        >
          {isLoading ? (
            <div className="relative">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
              <Circle className="relative w-4 h-4 fill-rose-500 text-rose-500" />
            </div>
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
}

export default SearchInput;
