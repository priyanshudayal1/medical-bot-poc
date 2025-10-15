"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  FaMicrophone,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
  FaBrain,
} from "react-icons/fa";

export default function StatusIndicator({ status, message }) {
  const statusConfig = {
    connecting: {
      icon: FaSpinner,
      color: "text-yellow-500",
      bg: "bg-gradient-to-r from-yellow-500/10 to-orange-500/10",
      ring: "ring-yellow-500/30",
      glow: "shadow-yellow-500/20",
      spin: true,
    },
    connected: {
      icon: FaCheckCircle,
      color: "text-green-500",
      bg: "bg-gradient-to-r from-green-500/10 to-emerald-500/10",
      ring: "ring-green-500/30",
      glow: "shadow-green-500/20",
      spin: false,
      pulse: true,
    },
    listening: {
      icon: FaMicrophone,
      color: "text-blue-500",
      bg: "bg-gradient-to-r from-blue-500/10 to-cyan-500/10",
      ring: "ring-blue-500/30",
      glow: "shadow-blue-500/30",
      spin: false,
      pulse: true,
    },
    processing: {
      icon: FaBrain,
      color: "text-purple-500",
      bg: "bg-gradient-to-r from-purple-500/10 to-pink-500/10",
      ring: "ring-purple-500/30",
      glow: "shadow-purple-500/20",
      spin: false,
      pulse: true,
    },
    speaking: {
      icon: FaMicrophone,
      color: "text-green-500",
      bg: "bg-gradient-to-r from-green-500/10 to-teal-500/10",
      ring: "ring-green-500/30",
      glow: "shadow-green-500/20",
      spin: false,
      pulse: true,
    },
    error: {
      icon: FaExclamationCircle,
      color: "text-red-500",
      bg: "bg-gradient-to-r from-red-500/10 to-rose-500/10",
      ring: "ring-red-500/30",
      glow: "shadow-red-500/20",
      spin: false,
      shake: true,
    },
  };

  const config = statusConfig[status] || statusConfig.connected;
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.9 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={`flex items-center gap-3 px-5 py-2.5 rounded-full ${config.bg} ${config.glow} ring-1 ${config.ring} shadow-lg backdrop-blur-sm`}
      >
        {/* Icon with animations */}
        <motion.div
          animate={
            config.spin
              ? { rotate: 360 }
              : config.pulse
              ? { scale: [1, 1.2, 1] }
              : config.shake
              ? { x: [-2, 2, -2, 2, 0] }
              : {}
          }
          transition={
            config.spin
              ? { duration: 1, repeat: Infinity, ease: "linear" }
              : config.pulse
              ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
              : config.shake
              ? { duration: 0.5 }
              : {}
          }
          className="relative"
        >
          {/* Glow effect behind icon */}
          <div
            className={`absolute inset-0 rounded-full blur-md opacity-50 ${config.color.replace(
              "text-",
              "bg-"
            )}`}
          />

          <Icon className={`${config.color} text-lg relative z-10`} />
        </motion.div>

        {/* Message text with gradient */}
        <span className={`text-sm font-semibold ${config.color} relative`}>
          {message}

          {/* Animated dots for active states */}
          {(status === "connecting" || status === "processing") && (
            <motion.span
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="ml-1"
            >
              ...
            </motion.span>
          )}
        </span>

        {/* Animated border */}
        {config.pulse && (
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className={`absolute inset-0 rounded-full border-2 ${config.color.replace(
              "text-",
              "border-"
            )} opacity-30`}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
