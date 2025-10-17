"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { Button } from "@/components/ui/button";

interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  animationType?: "bounce" | "pulse" | "glow" | "shake" | "scale";
  hoverEffect?: boolean;
}

export default function AnimatedButton({
  children,
  variant = "default",
  size = "default",
  className = "",
  onClick,
  disabled = false,
  animationType = "scale",
  hoverEffect = true
}: AnimatedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;

    // Initial entrance animation
    gsap.fromTo(button,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" }
    );
  }, []);

  const handleMouseEnter = () => {
    if (!buttonRef.current || !hoverEffect || disabled) return;

    const button = buttonRef.current;

    switch (animationType) {
      case "bounce":
        gsap.to(button, {
          y: -5,
          duration: 0.3,
          ease: "power2.out"
        });
        break;
      case "pulse":
        gsap.to(button, {
          scale: 1.05,
          duration: 0.3,
          ease: "power2.out"
        });
        break;
      case "glow":
        gsap.to(button, {
          boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
          duration: 0.3,
          ease: "power2.out"
        });
        break;
      case "shake":
        gsap.to(button, {
          x: -5,
          duration: 0.1,
          yoyo: true,
          repeat: 3,
          ease: "power2.inOut"
        });
        break;
      case "scale":
      default:
        gsap.to(button, {
          scale: 1.05,
          y: -2,
          duration: 0.3,
          ease: "power2.out"
        });
        break;
    }
  };

  const handleMouseLeave = () => {
    if (!buttonRef.current || !hoverEffect || disabled) return;

    const button = buttonRef.current;

    gsap.to(button, {
      scale: 1,
      y: 0,
      x: 0,
      boxShadow: "0 0 0px rgba(59, 130, 246, 0)",
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleClick = () => {
    if (!buttonRef.current || disabled) return;

    const button = buttonRef.current;

    // Click animation
    gsap.to(button, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: onClick
    });
  };

  return (
    <Button
      ref={buttonRef}
      variant={variant}
      size={size}
      className={`transition-all duration-300 ${className}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

// Special button with ripple effect
export function RippleButton({
  children,
  className = "",
  onClick,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  [key: string]: any;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const createRipple = (e: React.MouseEvent) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const ripple = document.createElement("div");
    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      pointer-events: none;
    `;

    button.appendChild(ripple);

    gsap.to(ripple, {
      scale: 1,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out",
      onComplete: () => ripple.remove()
    });

    onClick?.();
  };

  return (
    <Button
      ref={buttonRef}
      className={`relative overflow-hidden ${className}`}
      onClick={createRipple}
      {...props}
    >
      {children}
    </Button>
  );
}
