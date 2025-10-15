"use client";

import { motion } from "motion/react";
import { FaUser, FaRobot } from "react-icons/fa";

export default function ChatMessage({ message, index }) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.05,
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={`flex gap-4 ${
        isBot ? "flex-row" : "flex-row-reverse"
      } mb-6 group`}
    >
      {/* Avatar with enhanced styling */}
      <motion.div
        whileHover={{ scale: 1.1, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg relative ${
          isBot
            ? "bg-gradient-to-br from-blue-500 to-blue-600 ring-2 ring-blue-400/50"
            : "bg-gradient-to-br from-green-500 to-emerald-600 ring-2 ring-green-400/50"
        }`}
      >
        {/* Glowing effect */}
        <div
          className={`absolute inset-0 rounded-full blur-md opacity-50 ${
            isBot ? "bg-blue-500" : "bg-green-500"
          }`}
        />

        {isBot ? (
          <FaRobot className="text-white text-xl relative z-10" />
        ) : (
          <FaUser className="text-white text-lg relative z-10" />
        )}
      </motion.div>

      {/* Message bubble with enhanced styling */}
      <motion.div
        initial={{ scale: 0.9, x: isBot ? -20 : 20 }}
        animate={{ scale: 1, x: 0 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-md relative ${
          isBot
            ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
            : "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/30"
        }`}
      >
        {/* Message tail */}
        <div
          className={`absolute top-4 ${
            isBot ? "-left-2" : "-right-2"
          } w-4 h-4 transform rotate-45 ${
            isBot
              ? "bg-gray-50 dark:bg-gray-800 border-l border-b border-gray-200 dark:border-gray-700"
              : "bg-blue-500"
          }`}
        />

        {/* Content */}
        <p className="text-sm leading-relaxed relative z-10 whitespace-pre-wrap">
          {message.content}
        </p>

        {/* Timestamp with enhanced styling */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`text-xs font-medium relative z-10 ${
              isBot ? "text-gray-500 dark:text-gray-400" : "text-blue-100"
            }`}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>

        {/* Hover effect overlay */}
        <motion.div
          className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity ${
            isBot
              ? "bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20"
              : "bg-white/10"
          }`}
        />
      </motion.div>
    </motion.div>
  );
}
