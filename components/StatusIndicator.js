"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  FaMicrophone,
  FaSpinner,
  FaCheckCircle,
  FaExclamationCircle,
} from "react-icons/fa";

export default function StatusIndicator({ status, message }) {
  const statusConfig = {
    connecting: {
      icon: FaSpinner,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10",
      spin: true,
    },
    connected: {
      icon: FaCheckCircle,
      color: "text-green-500",
      bg: "bg-green-500/10",
      spin: false,
    },
    listening: {
      icon: FaMicrophone,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      spin: false,
    },
    processing: {
      icon: FaSpinner,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      spin: true,
    },
    error: {
      icon: FaExclamationCircle,
      color: "text-red-500",
      bg: "bg-red-500/10",
      spin: false,
    },
  };

  const config = statusConfig[status] || statusConfig.connected;
  const Icon = config.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.bg}`}
      >
        <motion.div
          animate={config.spin ? { rotate: 360 } : {}}
          transition={
            config.spin ? { duration: 1, repeat: Infinity, ease: "linear" } : {}
          }
        >
          <Icon className={`${config.color} text-lg`} />
        </motion.div>
        <span className={`text-sm font-medium ${config.color}`}>{message}</span>
      </motion.div>
    </AnimatePresence>
  );
}
