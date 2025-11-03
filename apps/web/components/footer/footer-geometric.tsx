"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "motion/react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { env } from "@/lib/config/env";

interface FooterGeometricProps {
  className?: string;
}

/**
 * Renders a responsive animated canvas background with a geometric pattern that adapts to the current theme.
 *
 * The pattern consists of a grid of dots and several random lines, with colors and opacity adjusted for dark or light mode. If dark mode is disabled via environment configuration, the pattern always uses light theme styling. The canvas resizes automatically and redraws when the theme changes.
 *
 * @param className - Optional additional CSS class names for the container.
 */
export function FooterGeometric({ className }: FooterGeometricProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    // When dark mode is disabled, always use light theme styling
    const isDark = env.DISABLE_DARK_MODE ? false : theme === "dark";
    
    // Set canvas dimensions
    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    
    // Draw geometric patterns
    const drawPattern = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background color
      ctx.fillStyle = "transparent";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw grid dots
      const dotSize = 1;
      const spacing = 20;
      const dotColor = isDark ? "rgba(255, 255, 255, 0.15)" : "rgba(0, 0, 0, 0.1)";
      
      for (let x = spacing; x < canvas.width / window.devicePixelRatio; x += spacing) {
        for (let y = spacing; y < canvas.height / window.devicePixelRatio; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }
      
      // Draw random lines
      const lineCount = 5;
      const lineColors = isDark 
        ? ["rgba(59, 130, 246, 0.2)", "rgba(139, 92, 246, 0.2)", "rgba(236, 72, 153, 0.2)"]
        : ["rgba(59, 130, 246, 0.1)", "rgba(139, 92, 246, 0.1)", "rgba(236, 72, 153, 0.1)"];
      
      for (let i = 0; i < lineCount; i++) {
        const x1 = Math.random() * canvas.width / window.devicePixelRatio;
        const y1 = Math.random() * canvas.height / window.devicePixelRatio;
        const x2 = Math.random() * canvas.width / window.devicePixelRatio;
        const y2 = Math.random() * canvas.height / window.devicePixelRatio;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = lineColors[i % lineColors.length];
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    };
    
    drawPattern();
    
    // Redraw on theme change
    const observer = new MutationObserver(() => {
      drawPattern();
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
    };
  }, [theme]);
  
  return (
    <div className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}>
      <motion.canvas
        ref={canvasRef}
        className="w-full h-full opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1 }}
      />
    </div>
  );
} 