import { Leaf } from "lucide-react";

function Header({ hasResult }) {
  return (
    <div
      className={`text-center mb-8 transition-all duration-500 ${hasResult ? "mt-4" : "mt-12"
        }`}
    >
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="p-3 bg-teal-600 rounded-2xl shadow-lg shadow-teal-600/20 text-white animate-float">
          <Leaf className="w-8 h-8" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-600 dark:from-teal-400 dark:to-emerald-400">
          Yogaflow
        </h1>
      </div>
      <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
        Find your perfect rhythm with intelligent guidance.
      </p>
    </div >
  );
}

export default Header;
