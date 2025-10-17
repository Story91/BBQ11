"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface AuroraBackgroundProps {
  className?: string;
  intensity?: number;
  speed?: number;
  colors?: string[];
}

export default function AuroraBackground({
  className = "",
  intensity = 0.3,
  speed = 1,
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"]
}: AuroraBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const blobs = container.querySelectorAll(".aurora-blob");

    // Create floating animation for each blob
    const createFloatingAnimation = (blob: Element, index: number) => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      tl.to(blob, {
        x: gsap.utils.random(-50, 50),
        y: gsap.utils.random(-30, 30),
        rotation: gsap.utils.random(-180, 180),
        duration: gsap.utils.random(3, 6) / speed,
        ease: "sine.inOut"
      });

      // Color transition
      tl.to(blob, {
        backgroundColor: colors[index % colors.length],
        duration: gsap.utils.random(2, 4) / speed,
        ease: "sine.inOut"
      }, "<");
    };

    // Scale and opacity pulsing
    const createPulseAnimation = (blob: Element) => {
      const tl = gsap.timeline({ repeat: -1, yoyo: true });
      
      tl.to(blob, {
        scale: gsap.utils.random(0.8, 1.2),
        opacity: gsap.utils.random(0.1, intensity),
        duration: gsap.utils.random(2, 4) / speed,
        ease: "sine.inOut"
      });
    };

    // Initialize animations
    blobs.forEach((blob, index) => {
      createFloatingAnimation(blob, index);
      createPulseAnimation(blob);
    });

    return () => {
      gsap.killTweensOf(blobs);
    };
  }, [intensity, speed, colors]);

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {/* Aurora Blobs */}
      <div className="aurora-blob absolute w-96 h-96 rounded-full opacity-20 blur-3xl" 
           style={{ 
             backgroundColor: colors[0],
             left: "10%",
             top: "20%",
             transform: "translate(-50%, -50%)"
           }} 
      />
      <div className="aurora-blob absolute w-80 h-80 rounded-full opacity-25 blur-3xl" 
           style={{ 
             backgroundColor: colors[1],
             right: "15%",
             top: "60%",
             transform: "translate(50%, -50%)"
           }} 
      />
      <div className="aurora-blob absolute w-72 h-72 rounded-full opacity-20 blur-3xl" 
           style={{ 
             backgroundColor: colors[2],
             left: "70%",
             bottom: "20%",
             transform: "translate(-50%, 50%)"
           }} 
      />
      <div className="aurora-blob absolute w-64 h-64 rounded-full opacity-30 blur-3xl" 
           style={{ 
             backgroundColor: colors[3],
             left: "30%",
             bottom: "40%",
             transform: "translate(-50%, 50%)"
           }} 
      />
      <div className="aurora-blob absolute w-56 h-56 rounded-full opacity-25 blur-3xl" 
           style={{ 
             backgroundColor: colors[0],
             right: "40%",
             top: "10%",
             transform: "translate(50%, -50%)"
           }} 
      />
    </div>
  );
}
