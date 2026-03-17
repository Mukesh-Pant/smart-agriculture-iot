import { auth } from "@/lib/auth";

export default function Logo() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      {/* Logo with Emoji */}
      <div className="relative">
        <span className="text-2xl">🌱</span>
      </div>

      {/* Brand Name */}
      <div className="flex-1">
        <h1 className="text-base font-bold text-gray-900 dark:text-white leading-tight">
          Smart Agriculture
        </h1>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wider">
            IoT
          </span>
          <span className="text-[10px] text-gray-400 dark:text-gray-500">•</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Real-time</span>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 dark:bg-green-900/20 rounded-full">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] font-medium text-green-700 dark:text-green-400">Live</span>
      </div>
    </div>
  );
}