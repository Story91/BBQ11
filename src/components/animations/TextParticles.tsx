"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface TextParticlesProps {
  text: string;
  className?: string;
  particleColor?: string;
  particleCount?: number;
  animationDuration?: number;
  trigger?: boolean;
}

export default function TextParticles({
  text,
  className = "",
  particleColor = "#3b82f6",
  particleCount = 50,
  animationDuration = 2,
  trigger = true
}: TextParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !textRef.current || !trigger) return;

    const container = containerRef.current;
    const textElement = textRef.current;
    const rect = textElement.getBoundingClientRect();

    // Create particles
    const particles: HTMLElement[] = [];
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "text-particle absolute rounded-full";
      particle.style.width = "4px";
      particle.style.height = "4px";
      particle.style.backgroundColor = particleColor;
      particle.style.left = `${rect.left + Math.random() * rect.width}px`;
      particle.style.top = `${rect.top + Math.random() * rect.height}px`;
      particle.style.opacity = "0";
      
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    particles.forEach((particle, index) => {
      const delay = (index / particleCount) * 0.5;
      
      gsap.to(particle, {
        opacity: 1,
        duration: 0.1,
        delay: delay
      });

      gsap.to(particle, {
        x: gsap.utils.random(-200, 200),
        y: gsap.utils.random(-200, 200),
        scale: gsap.utils.random(0.5, 2),
        opacity: 0,
        duration: animationDuration,
        delay: delay,
        ease: "power2.out"
      });
    });

    // Cleanup
    const cleanup = () => {
      particles.forEach(particle => {
        gsap.killTweensOf(particle);
        particle.remove();
      });
    };

    setTimeout(cleanup, (animationDuration + 1) * 1000);

    return cleanup;
  }, [text, particleColor, particleCount, animationDuration, trigger]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div ref={textRef}>{text}</div>
    </div>
  );
}

// Typing animation component
export function TypingAnimation({
  text,
  className = "",
  speed = 100,
  delay = 0
}: {
  text: string;
  className?: string;
  speed?: number;
  delay?: number;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    const chars = text.split("");
    
    element.textContent = "";

    const tl = gsap.timeline({ delay });
    
    chars.forEach((char, index) => {
      const span = document.createElement("span");
      span.textContent = char === " " ? "\u00A0" : char;
      span.style.opacity = "0";
      element.appendChild(span);

      tl.to(span, {
        opacity: 1,
        duration: speed / 1000,
        ease: "none"
      }, index * speed / 1000);
    });

    return () => {
      gsap.killTweensOf(element);
    };
  }, [text, speed, delay]);

  return (
    <div ref={textRef} className={className} />
  );
}

// Glitch text effect
export function GlitchText({
  text,
  className = "",
  glitchIntensity = 0.1,
  glitchDuration = 0.1
}: {
  text: string;
  className?: string;
  glitchIntensity?: number;
  glitchDuration?: number;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    let glitchInterval: NodeJS.Timeout;

    const createGlitch = () => {
      if (Math.random() < glitchIntensity) {
        gsap.to(element, {
          x: gsap.utils.random(-5, 5),
          skewX: gsap.utils.random(-2, 2),
          duration: glitchDuration,
          ease: "power2.inOut",
          onComplete: () => {
            gsap.to(element, {
              x: 0,
              skewX: 0,
              duration: glitchDuration,
              ease: "power2.inOut"
            });
          }
        });
      }
    };

    glitchInterval = setInterval(createGlitch, 100);

    return () => {
      clearInterval(glitchInterval);
    };
  }, [glitchIntensity, glitchDuration]);

  return (
    <div ref={textRef} className={className}>
      {text}
    </div>
  );
}
