"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ParticleSystemProps {
  className?: string;
  particleCount?: number;
  colors?: string[];
  speed?: number;
  size?: number;
}

export default function ParticleSystem({
  className = "",
  particleCount = 20,
  colors = ["#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"],
  speed = 1,
  size = 4
}: ParticleSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const particles: HTMLElement[] = [];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement("div");
      particle.className = "particle absolute rounded-full";
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.backgroundColor = colors[i % colors.length];
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      particle.style.opacity = Math.random() * 0.5 + 0.2;
      
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    particles.forEach((particle, index) => {
      const tl = gsap.timeline({ repeat: -1 });
      
      // Random floating animation
      tl.to(particle, {
        x: gsap.utils.random(-50, 50),
        y: gsap.utils.random(-50, 50),
        rotation: gsap.utils.random(-180, 180),
        duration: gsap.utils.random(3, 6) / speed,
        ease: "sine.inOut"
      });

      // Opacity pulsing
      tl.to(particle, {
        opacity: gsap.utils.random(0.1, 0.8),
        duration: gsap.utils.random(1, 3) / speed,
        ease: "sine.inOut"
      }, "<");

      // Scale animation
      tl.to(particle, {
        scale: gsap.utils.random(0.5, 1.5),
        duration: gsap.utils.random(2, 4) / speed,
        ease: "sine.inOut"
      }, "<");
    });

    return () => {
      particles.forEach(particle => {
        gsap.killTweensOf(particle);
        particle.remove();
      });
    };
  }, [particleCount, colors, speed, size]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    />
  );
}
