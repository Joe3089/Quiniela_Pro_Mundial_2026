"use client";

import { useRef } from "react";
import { motion, useAnimationFrame } from "framer-motion";
import Image from "next/image";

interface WCTrophyProps {
  size?: number;
  className?: string;
}

export default function WCTrophy({ size = 140, className }: WCTrophyProps) {
  const rotY = useRef(0);
  const imgRef = useRef<HTMLDivElement>(null);

  useAnimationFrame((_, delta) => {
    rotY.current = (rotY.current + delta * 0.045) % 360;
    if (imgRef.current) {
      const rad = (rotY.current * Math.PI) / 180;
      const scaleX = Math.cos(rad);
      // Natural perspective foreshortening: scaleX shrinks to ~0.05 at 90°
      const perspScale = Math.max(Math.abs(scaleX), 0.05);
      // Brightness dips slightly at edge-on view
      const brightness = 0.75 + 0.25 * Math.abs(scaleX);
      // Shadow shifts left/right with rotation
      const shadowX = -scaleX * 6;
      imgRef.current.style.transform = `scaleX(${perspScale})`;
      imgRef.current.style.filter = `
        drop-shadow(${shadowX}px 8px 18px rgba(180,120,0,0.55))
        drop-shadow(0 2px 6px rgba(0,0,0,0.4))
        brightness(${brightness})
      `;
    }
  });

  const pad = Math.round(size * 0.08);

  return (
    <div
      className={className}
      style={{
        width: size + pad * 2,
        height: size + pad * 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* Ambient gold glow underneath */}
      <div
        style={{
          position: "absolute",
          bottom: pad,
          left: "50%",
          transform: "translateX(-50%)",
          width: size * 0.55,
          height: size * 0.12,
          background: "radial-gradient(ellipse, rgba(212,160,12,0.35) 0%, transparent 70%)",
          borderRadius: "50%",
          filter: "blur(6px)",
          pointerEvents: "none",
        }}
      />

      {/* Trophy image with 3D rotation */}
      <div
        ref={imgRef}
        style={{
          width: size,
          height: size,
          willChange: "transform, filter",
          transformOrigin: "center center",
        }}
      >
        <Image
          src="/trophy.png"
          alt="FIFA World Cup Trophy"
          width={size}
          height={size}
          className="object-contain select-none pointer-events-none"
          priority
          unoptimized
        />
      </div>

      {/* Reflection below — subtle faded mirror */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: size,
          height: size * 0.22,
          overflow: "hidden",
          opacity: 0.18,
          pointerEvents: "none",
        }}
      >
        <Image
          src="/trophy.png"
          alt=""
          aria-hidden
          width={size}
          height={size}
          className="object-contain"
          style={{
            transform: `scaleY(-1)`,
            objectPosition: "bottom",
            filter: "blur(1px)",
          }}
          unoptimized
        />
      </div>
    </div>
  );
}
