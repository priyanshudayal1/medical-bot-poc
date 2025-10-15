"use client";

import { motion } from "motion/react";
import { FaUser, FaRobot } from "react-icons/fa";

export default function ChatMessage({ message, index }) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`flex gap-3 ${isBot ? "flex-row" : "flex-row-reverse"} mb-4`}
    >
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
          isBot ? "bg-blue-500" : "bg-green-500"
        }`}
      >
        {isBot ? (
          <FaRobot className="text-white text-xl" />
        ) : (
          <FaUser className="text-white text-lg" />
        )}
      </div>

      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isBot
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            : "bg-blue-500 text-white"
        }`}
      >
        <p className="text-sm leading-relaxed">{message.content}</p>
        <span className="text-xs opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </motion.div>
    </motion.div>
  );
}
