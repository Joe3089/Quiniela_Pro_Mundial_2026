"use client";

import { motion } from "framer-motion";

const CONFETTI_COLORS = ["#F5A500", "#1D4ED8", "#ffffff", "#F59E0B", "#3B82F6"];

// Confetti + fireworks burst — plays once per mount. Cover the area with an
// absolutely-positioned parent (position: relative) sized w x h.
export function Celebration({ w, h, count = 36 }: { w: number; h: number; count?: number }) {
  const confetti = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * w,
    delay: Math.random() * 0.6,
    duration: 2.2 + Math.random() * 1.4,
    rotate: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 5,
  }));
  const bursts = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    x: (w / 6) * (i + 1) + (Math.random() * 20 - 10),
    y: h * (0.15 + Math.random() * 0.35),
    delay: 0.2 + i * 0.35,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ width: w, height: h }}>
      {confetti.map((c) => (
        <motion.span
          key={c.id}
          initial={{ y: -20, x: c.x, opacity: 1, rotate: 0 }}
          animate={{ y: h + 20, rotate: c.rotate, opacity: [1, 1, 0] }}
          transition={{ duration: c.duration, delay: c.delay, ease: "easeIn" }}
          style={{ position: "absolute", width: c.size, height: c.size * 2.2, background: c.color, borderRadius: 1 }}
        />
      ))}
      {bursts.map((b) => (
        <motion.span
          key={b.id}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 2.2, 2.6] }}
          transition={{ duration: 0.9, delay: b.delay, ease: "easeOut" }}
          style={{
            position: "absolute", left: b.x, top: b.y, width: 6, height: 6, borderRadius: "50%",
            background: b.color, boxShadow: `0 0 24px 10px ${b.color}`,
          }}
        />
      ))}
    </div>
  );
}
