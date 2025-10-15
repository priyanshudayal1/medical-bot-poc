"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";

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
      ctx.clearRect(0, 0, width, height);

      const bars = type === "listening" ? 5 : 7;
      const barWidth = 4;
      const gap = 8;
      const totalWidth = bars * barWidth + (bars - 1) * gap;
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < bars; i++) {
        const x = startX + i * (barWidth + gap);
        const amplitude = type === "listening" ? 20 : 30;
        const frequency = type === "listening" ? 0.5 : 0.3;
        const offset = i * 0.5;

        const barHeight = Math.abs(
          Math.sin(time * frequency + offset) * amplitude +
            Math.sin(time * 0.7 + offset * 2) * (amplitude * 0.5)
        );

        const gradient = ctx.createLinearGradient(
          x,
          height / 2 - barHeight,
          x,
          height / 2 + barHeight
        );

        if (type === "listening") {
          gradient.addColorStop(0, "#3b82f6");
          gradient.addColorStop(1, "#1d4ed8");
        } else {
          gradient.addColorStop(0, "#10b981");
          gradient.addColorStop(1, "#059669");
        }

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height / 2 - barHeight, barWidth, barHeight * 2);
      }

      time += 0.05;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, type]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className="flex items-center justify-center"
    >
      <canvas ref={canvasRef} width={200} height={60} className="rounded-lg" />
    </motion.div>
  );
}
