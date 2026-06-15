"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, X, FileText, CheckCircle2, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useUserRank } from "../hooks/use-rankings";
import { useAuthStore } from "@/store/auth.store";
import { useTournamentStore } from "@/store/tournament.store";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { predictionsService } from "@/features/predictions/services/predictions.service";
import type { Prediction } from "@/types/predictions";
import type { LeaderboardEntry } from "@/types/rankings";

/* ── Rank icon ────────────────────────────────────────────── */
function RankIcon({ position }: { position: number }) {
  if (position === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return (
    <span className="text-sm font-bold text-muted-foreground tabular-nums w-5 text-center">
      {position}
    </span>
  );
}

/* ── Detalles modal ───────────────────────────────────────── */
function DetallesModal({
  entry,
  onClose,
}: {
  entry: LeaderboardEntry;
  onClose: () => void;
}) {
  const { activeTournament } = useTournamentStore();

  const { data: preds, isLoading } = useQuery<Prediction[]>({
    queryKey: ["user-predictions-detail", entry.user_id, activeTournament?.id],
    queryFn: () => predictionsService.getUserPredictions(entry.user_id, activeTournament!.id),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60,
  });

  const sorted = preds?.slice().sort((a, b) => {
    const da = new Date(a.match.match_date).getTime();
    const db2 = new Date(b.match.match_date).getTime();
    return da - db2;
  });

  const displayName = entry.user?.display_name ?? entry.user?.username ?? "Usuario";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col glass-strong rounded-2xl border border-border/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/30">
          <Avatar className="h-9 w-9">
            <AvatarImage src={entry.user?.avatar_url ?? undefined} />
            <AvatarFallback className="text-xs">{getInitials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{displayName}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Target className="h-3 w-3 text-yellow-400" /> {entry.exact_scores} exactos</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-400" /> {entry.correct_winners} ganadores</span>
              <span className="font-bold text-foreground">{entry.total_points} pts</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !sorted || sorted.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay predicciones registradas</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {/* Table header */}
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-3 pb-1">
                <span>Partido</span>
                <span className="text-center w-14">Pred.</span>
                <span className="text-center w-14">Real</span>
                <span className="text-right w-10">Pts</span>
              </div>

              {sorted.map((pred) => {
                const m = pred.match;
                const home = m.home_team?.name ?? "?";
                const away = m.away_team?.name ?? "?";
                const isFinished = m.status === "finished";
                const isLive = m.status === "live";
                const hasPrediction = pred.home_score_prediction != null && pred.away_score_prediction != null;

                return (
                  <div
                    key={pred.id}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-center px-3 py-2 rounded-lg text-xs",
                      isFinished
                        ? pred.points_earned != null && pred.points_earned > 0
                          ? "bg-emerald-500/8 border border-emerald-500/15"
                          : "bg-white/3 border border-border/20"
                        : "bg-white/3 border border-border/20"
                    )}
                  >
                    {/* Match name */}
                    <span className="truncate text-foreground/90 font-medium">
                      {home} vs {away}
                    </span>

                    {/* Prediction */}
                    <span className="w-14 text-center font-mono font-bold text-blue-300">
                      {hasPrediction
                        ? `${pred.home_score_prediction} - ${pred.away_score_prediction}`
                        : <span className="text-muted-foreground text-[10px]">—</span>
                      }
                    </span>

                    {/* Real score */}
                    <span className="w-14 text-center">
                      {isFinished ? (
                        <span className="font-mono font-bold text-foreground">
                          {m.home_score ?? 0} - {m.away_score ?? 0}
                        </span>
                      ) : isLive ? (
                        <Badge className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30 font-bold">
                          EN VIVO
                        </Badge>
                      ) : (
                        <Badge className="text-[9px] px-1.5 py-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/25">
                          PROG.
                        </Badge>
                      )}
                    </span>

                    {/* Points */}
                    <span className="w-10 text-right">
                      {isFinished ? (
                        <span className={cn(
                          "font-bold tabular-nums",
                          pred.points_earned === 5 ? "text-yellow-400"
                            : pred.points_earned && pred.points_earned > 0 ? "text-emerald-400"
                            : "text-muted-foreground"
                        )}>
                          {pred.points_earned ?? 0}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary */}
        {sorted && sorted.length > 0 && (
          <div className="border-t border-border/30 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{sorted.length} predicciones</span>
            <span className="font-bold text-foreground">
              Total: <span className="text-gradient">{entry.total_points} pts</span>
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ── Leaderboard ──────────────────────────────────────────── */
export function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard(100);
  const { data: userRank } = useUserRank();
  const { user } = useAuthStore();
  const [detailEntry, setDetailEntry] = useState<LeaderboardEntry | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {/* User's own rank sticky */}
        {userRank && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl border border-primary/30 p-3 mb-4 flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-8">
              <RankIcon position={userRank.rank_position ?? 999} />
            </div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>{getInitials(user.display_name ?? user.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">
                {user.display_name ?? user.username}{" "}
                <span className="text-xs text-primary">(Tú)</span>
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>🎯 {userRank.exact_scores} exactos</span>
                <span>✅ {userRank.correct_winners} ganadores</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gradient">{userRank.total_points}</p>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
            <button
              onClick={() => setDetailEntry(userRank)}
              className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors shrink-0"
            >
              <FileText className="h-3 w-3" />
              Detalles
            </button>
          </motion.div>
        )}

        <AnimatePresence>
          {entries?.map((entry, idx) => {
            const isCurrentUser = entry.user_id === user?.id;
            const position = entry.rank_position ?? idx + 1;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border transition-all",
                  position <= 3
                    ? "glass border-yellow-500/20 bg-yellow-500/5"
                    : "glass border-border/30",
                  isCurrentUser && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-center w-8 shrink-0">
                  <RankIcon position={position} />
                </div>

                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage src={entry.user?.avatar_url ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(entry.user?.display_name ?? entry.user?.username ?? "?")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold truncate", position <= 3 && "text-gradient-gold")}>
                    {entry.user?.display_name ?? entry.user?.username}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-primary font-normal">(Tú)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <span>⚽ {entry.predictions_count} pred.</span>
                    <span>🎯 {entry.exact_scores}</span>
                    <span>✅ {entry.correct_winners}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className={cn(
                    "text-base font-bold tabular-nums",
                    position === 1 ? "text-gradient-gold" : "text-foreground"
                  )}>
                    {entry.total_points}
                  </p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>

                <button
                  onClick={() => setDetailEntry(entry)}
                  className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors shrink-0"
                >
                  <FileText className="h-3 w-3" />
                  Detalles
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(!entries || entries.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nadie ha hecho predicciones aún</p>
            <p className="text-xs mt-1">¡Sé el primero!</p>
          </div>
        )}
      </div>

      {/* Detalles modal */}
      <AnimatePresence>
        {detailEntry && (
          <DetallesModal
            entry={detailEntry}
            onClose={() => setDetailEntry(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
