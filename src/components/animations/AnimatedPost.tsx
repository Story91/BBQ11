"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ExternalLink, Heart, Repeat2, Send, Loader2 } from "lucide-react";
import { formatDate } from "../../lib/utils";

interface AnimatedPostProps {
  post: {
    id: string;
    author: {
      name: string;
      display_name: string;
      username: string;
      pfp_url: string;
      power_badge: boolean;
      custody_address: `0x${string}`;
      verified_addresses: {
        eth_addresses: `0x${string}`[];
        sol_addresses: string[];
      };
    };
    embeds: {
      metadata: {
        content_type: string;
      };
      url: string;
    }[];
    text: string;
    timestamp: string;
    reactions: {
      likes_count: number;
      recasts_count: number;
    };
    replies: {
      count: number;
    };
  };
  onTipSuccess: () => void;
  sendTransaction: any;
  isTransactionPending: boolean;
  isConfirming: boolean;
  isConfirmed: boolean;
  resetTransaction: () => void;
  tippingPostId: string | null;
  setTippingPostId: (id: string | null) => void;
}

export default function AnimatedPost({
  post,
  onTipSuccess,
  sendTransaction,
  isTransactionPending,
  isConfirming,
  isConfirmed,
  resetTransaction,
  tippingPostId,
  setTippingPostId
}: AnimatedPostProps) {
  const postRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!postRef.current) return;

    const postElement = postRef.current;
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            
            // Animate post entrance
            gsap.fromTo(postElement,
              {
                y: 50,
                opacity: 0,
                scale: 0.95
              },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.6,
                ease: "power2.out"
              }
            );

            // Stagger animations for child elements
            if (avatarRef.current) {
              gsap.fromTo(avatarRef.current,
                { scale: 0, rotation: -180 },
                { scale: 1, rotation: 0, duration: 0.5, delay: 0.1, ease: "back.out(1.7)" }
              );
            }

            if (contentRef.current) {
              gsap.fromTo(contentRef.current,
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, delay: 0.2, ease: "power2.out" }
              );
            }

            if (buttonsRef.current) {
              gsap.fromTo(buttonsRef.current,
                { y: 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, delay: 0.3, ease: "power2.out" }
              );
            }
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(postElement);

    return () => {
      observer.unobserve(postElement);
    };
  }, [isVisible]);

  // Hover animations
  const handleMouseEnter = () => {
    if (!postRef.current) return;
    
    gsap.to(postRef.current, {
      y: -5,
      scale: 1.02,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  const handleMouseLeave = () => {
    if (!postRef.current) return;
    
    gsap.to(postRef.current, {
      y: 0,
      scale: 1,
      duration: 0.3,
      ease: "power2.out"
    });
  };

  return (
    <div
      ref={postRef}
      className="border rounded-lg p-4 bg-card/80 backdrop-blur-sm border-white/10 hover:bg-card/90 transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3">
          <Avatar ref={avatarRef} className="h-10 w-10">
            <AvatarImage
              src={post.author.pfp_url}
              alt={post.author.display_name}
            />
            <AvatarFallback>
              {post.author.display_name.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div ref={contentRef}>
            <div className="font-medium">{post.author.display_name}</div>
            <div className="text-sm text-muted-foreground">
              @{post.author.username} · {formatDate(post.timestamp)}
            </div>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
          <a
            href={`https://warpcast.com/~/conversations/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="mb-3 whitespace-pre-wrap">{post.text}</div>

      <div ref={buttonsRef} className="flex items-center justify-between pt-2 border-t border-white/10">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span>{post.reactions.likes_count}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Repeat2 className="h-4 w-4 text-muted-foreground" />
            <span>{post.reactions.recasts_count}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="gap-1 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all duration-300"
            disabled={isConfirming || isTransactionPending}
            onClick={() => {
              // Tip animation
              gsap.to(buttonsRef.current, {
                scale: 0.95,
                duration: 0.1,
                yoyo: true,
                repeat: 1,
                ease: "power2.inOut"
              });
            }}
          >
            <Send className="h-4 w-4" />
            <span>
              {tippingPostId === post.id && (isTransactionPending || isConfirming)
                ? "Tipping..."
                : "Tip 0.10 USDC"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
