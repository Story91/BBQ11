"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Home, Store, Mountain } from "lucide-react";

interface AnimatedTileProps {
  tile: {
    id: string;
    x: number;
    y: number;
    owner: string | null;
    building: 'empty' | 'house' | 'shop' | 'attraction';
    income: number;
    lastHarvest: number;
  };
  isSelected: boolean;
  onClick: () => void;
  accountAddress?: string;
}

export default function AnimatedTile({
  tile,
  isSelected,
  onClick,
  accountAddress
}: AnimatedTileProps) {
  const tileRef = useRef<HTMLButtonElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!tileRef.current) return;

    const tileElement = tileRef.current;
    
    // Initial animation on mount
    gsap.fromTo(tileElement, 
      { 
        scale: 0,
        rotation: 180,
        opacity: 0
      },
      { 
        scale: 1,
        rotation: 0,
        opacity: 1,
        duration: 0.5,
        delay: (tile.x + tile.y) * 0.02,
        ease: "back.out(1.7)"
      }
    );
  }, []);

  useEffect(() => {
    if (!tileRef.current || !iconRef.current) return;

    const tileElement = tileRef.current;
    const iconElement = iconRef.current;

    if (isSelected) {
      gsap.to(tileElement, {
        scale: 1.1,
        boxShadow: "0 0 20px rgba(59, 130, 246, 0.5)",
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(iconElement, {
        scale: 1.2,
        rotation: 360,
        duration: 0.6,
        ease: "power2.out"
      });
    } else {
      gsap.to(tileElement, {
        scale: 1,
        boxShadow: "0 0 0px rgba(59, 130, 246, 0)",
        duration: 0.3,
        ease: "power2.out"
      });

      gsap.to(iconElement, {
        scale: 1,
        rotation: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isSelected]);

  useEffect(() => {
    if (!tileRef.current) return;

    const tileElement = tileRef.current;

    if (isHovered) {
      gsap.to(tileElement, {
        scale: 1.05,
        y: -2,
        duration: 0.2,
        ease: "power2.out"
      });
    } else {
      gsap.to(tileElement, {
        scale: 1,
        y: 0,
        duration: 0.2,
        ease: "power2.out"
      });
    }
  }, [isHovered]);

  const getTileColor = () => {
    if (!tile.owner) return '#f3f4f6'; // Gray for unowned
    if (tile.owner === accountAddress) return '#10b981'; // Green for owned by user
    return '#f59e0b'; // Orange for owned by others
  };

  const getBuildingIcon = () => {
    switch (tile.building) {
      case 'house': return <Home className="w-3 h-3" />;
      case 'shop': return <Store className="w-3 h-3" />;
      case 'attraction': return <Mountain className="w-3 h-3" />;
      default: return null;
    }
  };

  const handleClick = () => {
    if (!tileRef.current) return;

    // Click animation
    gsap.to(tileRef.current, {
      scale: 0.95,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: "power2.inOut",
      onComplete: onClick
    });
  };

  return (
    <button
      ref={tileRef}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        w-10 h-10 border rounded flex items-center justify-center text-xs
        transition-all cursor-pointer relative overflow-hidden cursor-target
        ${isSelected ? 'ring-2 ring-blue-500' : ''}
      `}
      style={{ backgroundColor: getTileColor() }}
      title={`Tile (${tile.x}, ${tile.y}) - ${tile.owner ? 'Owned' : 'Available'}`}
    >
      <div ref={iconRef} className="flex items-center justify-center">
        {getBuildingIcon()}
      </div>
      
      {/* Glow effect for owned tiles */}
      {tile.owner && (
        <div 
          className="absolute inset-0 rounded opacity-20 blur-sm"
          style={{ 
            backgroundColor: tile.owner === accountAddress ? '#10b981' : '#f59e0b',
            animation: 'pulse 2s infinite'
          }}
        />
      )}
    </button>
  );
}
