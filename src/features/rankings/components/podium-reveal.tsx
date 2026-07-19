"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Download, X } from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useTournamentStore } from "@/store/tournament.store";
import { createClient } from "@/lib/supabase/client";
import { rankingsService } from "../services/rankings.service";
import { Celebration } from "@/components/ui/celebration";
import { cn } from "@/lib/utils";

const MEDALS: Record<number, { label: string; color: string; ring: string }> = {
  1: { label: "Oro", color: "#F5D142", ring: "rgba(245,209,66,0.5)" },
  2: { label: "Plata", color: "#C7CDD6", ring: "rgba(199,205,214,0.5)" },
  3: { label: "Bronce", color: "#CD7F32", ring: "rgba(205,127,50,0.5)" },
};

function seenKey(tournamentId: string, userId: string) {
  return `quiniela_podium_seen_${tournamentId}_${userId}`;
}

export function PodiumReveal() {
  const { user } = useAuthStore();
  const { activeTournament } = useTournamentStore();
  const tournamentId = activeTournament?.id;
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { data: finalFinished } = useQuery({
    queryKey: ["podium-final-status", tournamentId],
    queryFn: async () => {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("matches")
        .select("status")
        .eq("tournament_id", tournamentId)
        .eq("phase", "final")
        .maybeSingle();
      return data?.status === "finished";
    },
    enabled: !!tournamentId,
    staleTime: 5 * 60 * 1000,
  });

  const { data: myRank } = useQuery({
    queryKey: ["podium-my-rank", user?.id, tournamentId],
    queryFn: () => rankingsService.getUserRank(user!.id, tournamentId!),
    enabled: !!user?.id && !!tournamentId && !!finalFinished,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (!user || !tournamentId || !finalFinished || !myRank?.rank_position) return;
    try {
      if (!localStorage.getItem(seenKey(tournamentId, user.id))) setOpen(true);
    } catch { /* noop */ }
  }, [user, tournamentId, finalFinished, myRank]);

  function close() {
    setOpen(false);
    if (user && tournamentId) {
      try { localStorage.setItem(seenKey(tournamentId, user.id), "1"); } catch { /* noop */ }
    }
  }

  function downloadCertificate() {
    const canvas = canvasRef.current;
    if (!canvas || !user || !myRank) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = 1000, H = 700;
    canvas.width = W; canvas.height = H;

    const medal = MEDALS[myRank.rank_position] ?? { label: "Participación", color: "#8b5cf6", ring: "rgba(139,92,246,0.5)" };

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#05070d");
    grad.addColorStop(1, "#0d1224");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = medal.color;
    ctx.lineWidth = 6;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    ctx.textAlign = "center";
    ctx.fillStyle = "#F5A500";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText("QUINIELA FIFA WORLD CUP 2026", W / 2, 100);

    ctx.beginPath();
    ctx.arc(W / 2, 210, 60, 0, Math.PI * 2);
    ctx.fillStyle = medal.color;
    ctx.fill();
    ctx.fillStyle = "#0a0a0a";
    ctx.font = "bold 42px sans-serif";
    ctx.fillText(String(myRank.rank_position), W / 2, 226);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px sans-serif";
    ctx.fillText(user.display_name ?? user.username ?? "Jugador", W / 2, 340);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "22px sans-serif";
    const posLabel = myRank.rank_position === 1 ? "¡GANADOR DE LA QUINIELA!" : `Posición #${myRank.rank_position} · Medalla de ${medal.label}`;
    ctx.fillText(posLabel, W / 2, 390);

    ctx.fillStyle = medal.color;
    ctx.font = "bold 60px sans-serif";
    ctx.fillText(`${myRank.total_points} pts`, W / 2, 470);

    ctx.fillStyle = "#6b7280";
    ctx.font = "18px sans-serif";
    ctx.fillText("Gracias por tu participación en la Quiniela FIFA World Cup 2026", W / 2, 560);
    ctx.fillText(new Date().toLocaleDateString("es-VE", { year: "numeric", month: "long", day: "numeric" }), W / 2, 590);

    const link = document.createElement("a");
    link.download = `certificado-quiniela-${(user.username ?? "jugador").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  if (!open || !myRank?.rank_position || !user) return null;

  const pos = myRank.rank_position;
  const isTop3 = pos <= 3;
  const medal = MEDALS[pos];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9997] flex items-center justify-center p-4"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={close} />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 18 }}
          className="relative z-10 w-full max-w-md rounded-2xl border p-6 shadow-2xl bg-[#0a0a0a] overflow-hidden"
          style={{ borderColor: (medal ?? { ring: "rgba(139,92,246,0.4)" }).ring }}
        >
          {isTop3 && <Celebration w={448} h={520} />}

          <button onClick={close} className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors z-20">
            <X className="h-4 w-4" />
          </button>

          <div className="relative flex flex-col items-center text-center gap-3 py-4">
            {pos === 1 ? (
              <motion.div
                animate={{ rotate: [0, -6, 6, -4, 4, 0], y: [0, -4, 0] }}
                transition={{ duration: 1.4, delay: 0.3 }}
              >
                <Trophy className="h-20 w-20" style={{ color: MEDALS[1].color, filter: `drop-shadow(0 0 18px ${MEDALS[1].ring})` }} />
              </motion.div>
            ) : (
              <motion.div
                initial={{ y: -40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", damping: 10, delay: 0.2 }}
              >
                <Medal
                  className="h-16 w-16"
                  style={{ color: (medal ?? { color: "#8b5cf6" }).color, filter: medal ? `drop-shadow(0 0 14px ${medal.ring})` : undefined }}
                />
              </motion.div>
            )}

            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-xl font-black text-white"
            >
              {pos === 1 ? "¡Eres el campeón de la Quiniela!" : isTop3 ? `¡Quedaste en ${pos}° lugar!` : "¡Torneo finalizado!"}
            </motion.h2>

            <p className="text-sm text-muted-foreground">
              {isTop3
                ? `Medalla de ${medal.label} · ${myRank.total_points} puntos`
                : `Terminaste en la posición #${pos} con ${myRank.total_points} puntos`}
            </p>

            {!isTop3 && (
              <div className="mt-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-white/70">
                  🏅 Certificado simbólico de participación — gracias por jugar la Quiniela FIFA World Cup 2026.
                </p>
              </div>
            )}

            <button
              onClick={downloadCertificate}
              className={cn(
                "mt-3 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90",
                pos === 1 ? "bg-gradient-to-r from-yellow-500 to-amber-600" : "bg-[hsl(var(--brand-blue-light))]"
              )}
            >
              <Download className="h-4 w-4" />
              Descargar certificado
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
