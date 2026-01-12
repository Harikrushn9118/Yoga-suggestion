import { ThumbsUp, ThumbsDown } from "lucide-react";

function ActionButtons({ onFeedback }) {
  return (
    <div className="mt-8 flex items-center justify-between">
      <span className="text-sm text-gray-500 font-medium">
        Was this helpful?
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onFeedback("up")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 hover:text-green-600 transition-colors cursor-pointer"
        >
          <ThumbsUp className="w-5 h-5" />
        </button>
        <button
          onClick={() => onFeedback("down")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-500 hover:text-red-500 transition-colors cursor-pointer"
        >
          <ThumbsDown className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

export default ActionButtons;
