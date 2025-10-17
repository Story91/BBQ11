"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface ParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  perspective?: number;
}

export default function ParallaxCard({
  children,
  className = "",
  intensity = 0.1,
  perspective = 1000
}: ParallaxCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * intensity;
      const deltaY = (e.clientY - centerY) * intensity;

      gsap.to(card, {
        rotationY: deltaX,
        rotationX: -deltaY,
        duration: 0.3,
        ease: "power2.out",
        transformPerspective: perspective
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotationY: 0,
        rotationX: 0,
        duration: 0.5,
        ease: "power2.out"
      });
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [intensity, perspective]);

  return (
    <div
      ref={cardRef}
      className={`transform-gpu ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      {children}
    </div>
  );
}

// Floating animation component
export function FloatingElement({
  children,
  className = "",
  duration = 3,
  intensity = 10
}: {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  intensity?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    gsap.to(element, {
      y: intensity,
      duration: duration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    return () => {
      gsap.killTweensOf(element);
    };
  }, [duration, intensity]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}
