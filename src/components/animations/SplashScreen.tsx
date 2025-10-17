"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import SplitText from "./SplitText";
import LoadingAnimation from "./LoadingAnimation";
import ParticleSystem from "./ParticleSystem";

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
  title?: string;
  subtitle?: string;
}

export default function SplashScreen({
  onComplete,
  duration = 3000,
  title = "World Builder",
  subtitle = "Building the future of virtual worlds with Base Account"
}: SplashScreenProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const tl = gsap.timeline();

    // Initial setup
    gsap.set(container, { opacity: 1 });

    // Fade out
    tl.to(container, {
      opacity: 0,
      duration: 0.8,
      ease: "power2.inOut",
      onComplete: () => {
        setIsVisible(false);
        onComplete();
      }
    }, `+=${duration / 1000}`);

    return () => {
      gsap.killTweensOf(container);
    };
  }, [onComplete, duration]);

  if (!isVisible) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50"
    >
      <ParticleSystem 
        particleCount={30} 
        speed={0.3} 
        size={4}
        colors={["#0000ff", "#0066ff", "#0099ff", "#00ccff", "#00ffff"]}
      />
      
      <div className="relative z-10 text-center">
        <div className="mb-4">
          <SplitText
            text={title}
            animationType="fadeUp"
            className="text-4xl md:text-6xl font-bold text-[#0000ff] mb-4"
            delay={0.3}
            duration={0.8}
          />
        </div>
        
        <div className="mb-8">
          <SplitText
            text={subtitle}
            animationType="fadeUp"
            className="text-lg md:text-xl text-[#0000ff] opacity-80"
            delay={0.8}
            stagger={0.1}
          />
        </div>
        
        <div className="flex justify-center">
          <LoadingAnimation 
            size={60} 
            color="#0000ff" 
            speed={0.8}
          />
        </div>
      </div>
    </div>
  );
}

// Loading overlay component
export function LoadingOverlay({
  isLoading,
  message = "Loading...",
  className = ""
}: {
  isLoading: boolean;
  message?: string;
  className?: string;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!overlayRef.current) return;

    if (isLoading) {
      gsap.fromTo(overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power2.out" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          if (overlayRef.current) {
            overlayRef.current.style.display = "none";
          }
        }
      });
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-40 ${className}`}
    >
      <div className="bg-card/90 backdrop-blur-md p-8 rounded-lg border border-white/10 text-center">
        <LoadingAnimation size={50} color="#3b82f6" />
        <p className="mt-4 text-lg font-medium">{message}</p>
      </div>
    </div>
  );
}
