"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface LoadingAnimationProps {
  className?: string;
  size?: number;
  color?: string;
  speed?: number;
}

export default function LoadingAnimation({
  className = "",
  size = 60,
  color = "#3b82f6",
  speed = 1
}: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const dots = container.querySelectorAll(".loading-dot");

    // Create rotating animation
    const tl = gsap.timeline({ repeat: -1 });

    dots.forEach((dot, index) => {
      gsap.set(dot, {
        rotation: (360 / dots.length) * index,
        transformOrigin: `0 ${size / 2}px`
      });

      tl.to(dot, {
        rotation: `+=360`,
        duration: 2 / speed,
        ease: "none"
      }, 0);
    });

    // Scale animation
    gsap.to(dots, {
      scale: 1.2,
      duration: 0.5 / speed,
      yoyo: true,
      repeat: -1,
      stagger: 0.1,
      ease: "power2.inOut"
    });

    return () => {
      gsap.killTweensOf(dots);
    };
  }, [size, speed]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      {[...Array(8)].map((_, index) => (
        <div
          key={index}
          className="loading-dot absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: color,
            left: size / 2,
            top: size / 2,
            transformOrigin: `0 ${size / 2}px`
          }}
        />
      ))}
    </div>
  );
}

// Alternative loading animation - Bouncing dots
export function BouncingDots({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const dots = containerRef.current.querySelectorAll(".bounce-dot");
    
    gsap.to(dots, {
      y: -20,
      duration: 0.6,
      stagger: 0.2,
      repeat: -1,
      yoyo: true,
      ease: "power2.inOut"
    });

    return () => {
      gsap.killTweensOf(dots);
    };
  }, []);

  return (
    <div ref={containerRef} className={`flex gap-2 ${className}`}>
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="bounce-dot w-3 h-3 bg-blue-500 rounded-full"
        />
      ))}
    </div>
  );
}

// Spiral loading animation
export function SpiralLoader({ className = "" }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    
    gsap.to(container, {
      rotation: 360,
      duration: 1,
      repeat: -1,
      ease: "none"
    });

    return () => {
      gsap.killTweensOf(container);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full ${className}`}
    />
  );
}
