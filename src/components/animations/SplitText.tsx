"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface SplitTextProps {
  text: string;
  delay?: number;
  duration?: number;
  className?: string;
  stagger?: number;
  animationType?: "fadeUp" | "scale" | "slideIn" | "bounce";
}

export default function SplitText({
  text,
  delay = 0,
  duration = 0.6,
  className = "",
  stagger = 0.1,
  animationType = "fadeUp"
}: SplitTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const words = container.querySelectorAll(".word");
    
    // Set initial states based on animation type
    const setInitialState = () => {
      switch (animationType) {
        case "fadeUp":
          gsap.set(words, { y: 50, opacity: 0 });
          break;
        case "scale":
          gsap.set(words, { scale: 0, opacity: 0 });
          break;
        case "slideIn":
          gsap.set(words, { x: -100, opacity: 0 });
          break;
        case "bounce":
          gsap.set(words, { y: -50, opacity: 0 });
          break;
      }
    };

    const animateIn = () => {
      const tl = gsap.timeline({ delay });
      
      switch (animationType) {
        case "fadeUp":
          tl.to(words, {
            y: 0,
            opacity: 1,
            duration,
            stagger,
            ease: "power2.out"
          });
          break;
        case "scale":
          tl.to(words, {
            scale: 1,
            opacity: 1,
            duration,
            stagger,
            ease: "back.out(1.7)"
          });
          break;
        case "slideIn":
          tl.to(words, {
            x: 0,
            opacity: 1,
            duration,
            stagger,
            ease: "power2.out"
          });
          break;
        case "bounce":
          tl.to(words, {
            y: 0,
            opacity: 1,
            duration,
            stagger,
            ease: "bounce.out"
          });
          break;
      }
    };

    setInitialState();
    animateIn();

    return () => {
      gsap.killTweensOf(words);
    };
  }, [text, delay, duration, stagger, animationType]);

  const words = text.split(" ");

  return (
    <div ref={containerRef} className={className}>
      {words.map((word, index) => (
        <span
          key={index}
          className="word inline-block mr-2"
        >
          {word}
        </span>
      ))}
    </div>
  );
}
