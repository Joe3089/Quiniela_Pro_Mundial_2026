"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Trophy, Medal, Star, TrendingUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useUserRank } from "../hooks/use-rankings";
import { useAuthStore } from "@/store/auth.store";
import { getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

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

export function Leaderboard() {
  const { data: entries, isLoading } = useLeaderboard(100);
  const { data: userRank } = useUserRank();
  const { user } = useAuthStore();

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
  );
}
