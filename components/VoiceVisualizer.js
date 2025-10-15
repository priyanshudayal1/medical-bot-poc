"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { FaMicrophone, FaVolumeUp } from "react-icons/fa";

export default function VoiceVisualizer({ isActive, type = "listening" }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    let time = 0;

    const draw = () => {
      // Semi-transparent clear for trailing effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.fillRect(0, 0, width, height);

      const bars = type === "listening" ? 7 : 9;
      const barWidth = 6;
      const gap = 10;
      const totalWidth = bars * barWidth + (bars - 1) * gap;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < bars; i++) {
        const x = startX + i * (barWidth + gap);
        const amplitude = type === "listening" ? 25 : 35;
        const frequency = type === "listening" ? 0.6 : 0.4;
        const offset = i * 0.8;

        // Multiple sine waves for more organic motion
        const barHeight = Math.abs(
          Math.sin(time * frequency + offset) * amplitude +
            Math.sin(time * 0.7 + offset * 2) * (amplitude * 0.4) +
            Math.sin(time * 1.2 + offset * 0.5) * (amplitude * 0.2)
        );

        // Create gradient with glow effect
        const gradient = ctx.createLinearGradient(
          x,
          height / 2 - barHeight,
          x,
          height / 2 + barHeight
        );

        if (type === "listening") {
          gradient.addColorStop(0, "#60a5fa");
          gradient.addColorStop(0.5, "#3b82f6");
          gradient.addColorStop(1, "#2563eb");
        } else {
          gradient.addColorStop(0, "#34d399");
          gradient.addColorStop(0.5, "#10b981");
          gradient.addColorStop(1, "#059669");
        }

        ctx.fillStyle = gradient;

        // Rounded bars
        ctx.beginPath();
        ctx.roundRect(
          x,
          height / 2 - barHeight,
          barWidth,
          barHeight * 2,
          barWidth / 2
        );
        ctx.fill();

        // Glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = type === "listening" ? "#3b82f6" : "#10b981";
      }

      time += 0.06;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type]);

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center py-6 text-gray-400 dark:text-gray-600"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" />
          <div className="w-2 h-2 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 10 }}
      className="relative flex items-center justify-center py-4"
    >
      {/* Background glow */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 rounded-2xl blur-2xl ${
          type === "listening" ? "bg-blue-500/20" : "bg-green-500/20"
        }`}
      />

      {/* Icon indicator */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute left-4 p-2 rounded-full ${
          type === "listening"
            ? "bg-blue-500/20 text-blue-500"
            : "bg-green-500/20 text-green-500"
        }`}
      >
        {type === "listening" ? (
          <FaMicrophone className="text-lg" />
        ) : (
          <FaVolumeUp className="text-lg" />
        )}
      </motion.div>

      {/* Canvas with enhanced styling */}
      <canvas
        ref={canvasRef}
        width={250}
        height={80}
        className="relative z-10 rounded-xl"
      />

      {/* Status text */}
      <motion.div
        animate={{
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute right-4 text-sm font-medium ${
          type === "listening" ? "text-blue-500" : "text-green-500"
        }`}
      >
        {type === "listening" ? "Listening..." : "Speaking..."}
      </motion.div>
    </motion.div>
  );
}
