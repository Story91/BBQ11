"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

interface BlobCursorProps {
  size?: number;
  color?: string;
  opacity?: number;
  magnetic?: boolean;
  className?: string;
}

export default function BlobCursor({
  size = 40,
  color = "#3b82f6",
  opacity = 0.3,
  magnetic = true,
  className = ""
}: BlobCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!cursorRef.current || !followerRef.current) return;

    const cursor = cursorRef.current;
    const follower = followerRef.current;
    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    const updateCursor = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      gsap.to(cursor, {
        x: mouseX - size / 2,
        y: mouseY - size / 2,
        duration: 0.1,
        ease: "power2.out"
      });
    };

    const updateFollower = () => {
      const diffX = mouseX - followerX;
      const diffY = mouseY - followerY;
      
      followerX += diffX * 0.1;
      followerY += diffY * 0.1;
      
      gsap.to(follower, {
        x: followerX - size / 2,
        y: followerY - size / 2,
        duration: 0.3,
        ease: "power2.out"
      });
      
      requestAnimationFrame(updateFollower);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.matches('button, a, [data-cursor="magnetic"]')) {
        gsap.to(cursor, {
          scale: 1.5,
          backgroundColor: "#ef4444",
          duration: 0.3,
          ease: "power2.out"
        });
        
        if (magnetic) {
          const rect = target.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          gsap.to(cursor, {
            x: centerX - size / 2,
            y: centerY - size / 2,
            duration: 0.3,
            ease: "power2.out"
          });
        }
      }
    };

    const handleMouseLeave = () => {
      gsap.to(cursor, {
        scale: 1,
        backgroundColor: color,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    // Initial setup
    gsap.set(cursor, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      scale: 1
    });

    gsap.set(follower, {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      scale: 1.2
    });

    // Event listeners
    window.addEventListener("mousemove", updateCursor);
    window.addEventListener("mousemove", handleMouseEnter);
    document.addEventListener("mouseleave", handleMouseLeave);
    
    updateFollower();

    return () => {
      window.removeEventListener("mousemove", updateCursor);
      window.removeEventListener("mousemove", handleMouseEnter);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [size, color, magnetic]);

  return (
    <>
      <div
        ref={cursorRef}
        className={`fixed pointer-events-none z-50 rounded-full mix-blend-difference ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          opacity,
          left: 0,
          top: 0
        }}
      />
      <div
        ref={followerRef}
        className={`fixed pointer-events-none z-40 rounded-full ${className}`}
        style={{
          width: size * 1.2,
          height: size * 1.2,
          backgroundColor: color,
          opacity: opacity * 0.5,
          left: 0,
          top: 0
        }}
      />
    </>
  );
}
