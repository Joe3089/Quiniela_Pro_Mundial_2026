"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, X, FileText, CheckCircle2, Target, UserPlus, UserMinus, Mail, Phone, Users, MessageCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useLeaderboard, useUserRank } from "../hooks/use-rankings";
import { useAuthStore } from "@/store/auth.store";
import { useTournamentStore } from "@/store/tournament.store";
import { getInitials, cn } from "@/lib/utils";
import { predictionsService } from "@/features/predictions/services/predictions.service";
import { ChatModal } from "@/features/messages/components/chat-modal";
import type { Prediction } from "@/types/predictions";
import type { LeaderboardEntry } from "@/types/rankings";

/* ── Privacy helpers ──────────────────────────────────────── */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return `${local.slice(0, 2)}${"*".repeat(Math.max(3, local.length - 2))}@${domain}`;
}

function maskPhone(phone: string): string {
  const clean = phone.replace(/\s/g, "");
  if (clean.length <= 5) return phone;
  return `${clean.slice(0, 3)}${"*".repeat(clean.length - 6)}${clean.slice(-3)}`;
}

/* ── Rank icon ────────────────────────────────────────────── */
function RankIcon({ position }: { position: number }) {
  if (position === 1) return <Trophy className="h-5 w-5 text-yellow-400" />;
  if (position === 2) return <Medal className="h-5 w-5 text-slate-300" />;
  if (position === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground tabular-nums w-5 text-center">{position}</span>;
}

/* ── User Profile Modal ───────────────────────────────────── */
function UserProfileModal({
  entry, onClose, onShowDetails,
}: {
  entry: LeaderboardEntry; onClose: () => void; onShowDetails: () => void;
}) {
  const { user: currentUser } = useAuthStore();
  const isAdmin = currentUser?.is_admin ?? false;
  const isSelf = currentUser?.id === entry.user_id;
  const qc = useQueryClient();
  const [showChat, setShowChat] = useState(false);

  const displayName = entry.user?.display_name ?? entry.user?.username ?? "Usuario";
  const email = (entry.user as any)?.email ?? null;
  const phone = (entry.user as any)?.whatsapp_phone ?? null;

  // Fetch follow stats (followers, following, follows, followed_by)
  const { data: followStats, isLoading: loadingStats } = useQuery({
    queryKey: ["follow-stats", entry.user_id, currentUser?.id],
    queryFn: async () => {
      const res = await fetch(`/api/follows?profile_id=${entry.user_id}`);
      return res.json() as Promise<{
        follows: boolean; followed_by: boolean;
        followers_count: number; following_count: number;
      }>;
    },
    staleTime: 30_000,
  });

  const followMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ following_id: entry.user_id }),
      });
      return res.json() as Promise<{ follows: boolean; error?: string }>;
    },
    onSuccess: (data) => {
      if (!data.error) {
        qc.setQueryData(["follow-stats", entry.user_id, currentUser?.id], (old: any) => ({
          ...old,
          follows: data.follows,
          followers_count: (old?.followers_count ?? 0) + (data.follows ? 1 : -1),
        }));
      }
    },
  });

  const isFollowing = followStats?.follows ?? false;
  const followedByMe = !isSelf && !!currentUser;

  // Chat peer for sending messages
  const chatPeer = entry.user
    ? { id: entry.user_id, username: entry.user.username ?? "", display_name: entry.user.display_name ?? null, avatar_url: entry.user.avatar_url ?? null }
    : null;

  if (showChat && chatPeer) {
    return <ChatModal peer={chatPeer} onClose={() => setShowChat(false)} />;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-sm glass-strong rounded-2xl border border-border/40 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-20 bg-gradient-to-br from-primary/30 to-brand-blue-dark/30" />
        <button onClick={onClose} className="absolute top-3 right-3 h-7 w-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="px-5 pb-5">
          {/* Avatar + name + "Te sigue" */}
          <div className="-mt-10 mb-3 flex items-end gap-3">
            <Avatar className="h-20 w-20 ring-4 ring-background shrink-0">
              <AvatarImage src={entry.user?.avatar_url ?? undefined} />
              <AvatarFallback className="text-2xl font-black bg-gradient-to-br from-primary to-brand-blue-dark text-white">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="pb-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-base leading-tight truncate">{displayName}</p>
                {followStats?.followed_by && !isSelf && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 border border-primary/30 text-primary shrink-0">
                    Te sigue
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">@{entry.user?.username}</p>
            </div>
          </div>

          {/* Followers/Following row */}
          <div className="flex items-center gap-4 mb-3 text-xs text-muted-foreground">
            {loadingStats ? (
              <span className="text-[10px]">Cargando...</span>
            ) : (
              <>
                <span><b className="text-foreground">{followStats?.followers_count ?? 0}</b> seguidores</span>
                <span><b className="text-foreground">{followStats?.following_count ?? 0}</b> siguiendo</span>
              </>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center glass rounded-lg py-2 border border-border/20">
              <p className="text-lg font-black text-gradient">{entry.total_points}</p>
              <p className="text-[10px] text-muted-foreground">pts</p>
            </div>
            <div className="text-center glass rounded-lg py-2 border border-border/20">
              <p className="text-lg font-black text-yellow-400">{entry.exact_scores}</p>
              <p className="text-[10px] text-muted-foreground">exactos</p>
            </div>
            <div className="text-center glass rounded-lg py-2 border border-border/20">
              <p className="text-lg font-black text-emerald-400">{entry.correct_winners}</p>
              <p className="text-[10px] text-muted-foreground">ganadores</p>
            </div>
          </div>

          {/* Contact info */}
          {(email || phone) && (
            <div className="space-y-1.5 mb-4">
              {email && (
                <div className="flex items-center gap-2 text-xs glass rounded-lg px-3 py-2 border border-border/20">
                  <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{isAdmin ? email : maskEmail(email)}</span>
                  {!isAdmin && <span className="ml-auto text-[9px] text-muted-foreground/50 shrink-0">privado</span>}
                </div>
              )}
              {phone && (
                <div className="flex items-center gap-2 text-xs glass rounded-lg px-3 py-2 border border-border/20">
                  <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground truncate">{isAdmin ? phone : maskPhone(phone)}</span>
                  {!isAdmin && <span className="ml-auto text-[9px] text-muted-foreground/50 shrink-0">privado</span>}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {!isSelf && currentUser && (
              <button
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending || loadingStats}
                className={cn(
                  "flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg border transition-all",
                  followedByMe
                    ? isFollowing
                      ? "bg-white/5 border-white/10 text-muted-foreground hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 px-3"
                      : "bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 px-3"
                    : "hidden"
                )}
              >
                {followMutation.isPending ? (
                  <span className="h-3 w-3 border border-current/40 border-t-current rounded-full animate-spin" />
                ) : isFollowing ? (
                  <><UserMinus className="h-3 w-3" /> Siguiendo</>
                ) : (
                  <><UserPlus className="h-3 w-3" /> Seguir</>
                )}
              </button>
            )}
            {!isSelf && currentUser && chatPeer && (
              <button
                onClick={() => setShowChat(true)}
                className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
              >
                <MessageCircle className="h-3 w-3" />
                Mensaje
              </button>
            )}
            <button
              onClick={() => { onClose(); onShowDetails(); }}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
            >
              <FileText className="h-3 w-3" />
              Predicciones
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Detalles modal ───────────────────────────────────────── */
function DetallesModal({ entry, onClose }: { entry: LeaderboardEntry; onClose: () => void }) {
  const { activeTournament } = useTournamentStore();

  const { data: preds, isLoading } = useQuery<Prediction[]>({
    queryKey: ["user-predictions-detail", entry.user_id, activeTournament?.id],
    queryFn: () => predictionsService.getUserPredictions(entry.user_id, activeTournament!.id),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60,
  });

  const sorted = preds
    ?.filter((p) => p.match != null)
    .slice()
    .sort((a, b) => new Date(a.match.match_date).getTime() - new Date(b.match.match_date).getTime());

  const displayName = entry.user?.display_name ?? entry.user?.username ?? "Usuario";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-2xl max-h-[90vh] flex flex-col glass-strong rounded-2xl border border-border/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
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
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4">
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)}</div>
          ) : !sorted || sorted.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No hay predicciones registradas</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-3 pb-1">
                <span>Partido</span>
                <span className="text-center w-14">Pred.</span>
                <span className="text-center w-14">Real</span>
                <span className="text-right w-10">Pts</span>
              </div>
              {sorted.map((pred) => {
                const m = pred.match;
                const isFinished = m.status === "finished";
                const isLive = m.status === "live";
                const hasPrediction = pred.home_score_prediction != null && pred.away_score_prediction != null;
                const homeShort = m.home_team?.short_name ?? m.home_team?.name ?? "?";
                const awayShort = m.away_team?.short_name ?? m.away_team?.name ?? "?";

                // Predicted winner
                const pH = pred.home_score_prediction ?? 0;
                const pA = pred.away_score_prediction ?? 0;
                const predWinner: "home" | "away" | "draw" = pH > pA ? "home" : pH < pA ? "away" : "draw";
                const predDrawTeam = predWinner === "draw" && pred.qualifier_team_id
                  ? (pred.qualifier_team_id === m.home_team?.id ? "home" : "away")
                  : null;
                const predOutcome = pred.outcome_prediction;

                // Actual winner
                const rH = m.home_score ?? 0;
                const rA = m.away_score ?? 0;
                const realWinner: "home" | "away" | "draw" =
                  isFinished ? (rH > rA ? "home" : rH < rA ? "away" : "draw") : "draw";
                const realDrawTeam = realWinner === "draw" && isFinished
                  ? ((m.home_score_penalties ?? 0) > (m.away_score_penalties ?? 0) ? "home" : "away")
                  : null;
                const isPen = (m as any).api_football_status === "PEN";
                const isAET = (m as any).api_football_status === "AET";

                return (
                  <div
                    key={pred.id}
                    className={cn(
                      "grid grid-cols-[1fr_auto_auto_auto] gap-x-3 items-start px-3 py-2 rounded-lg text-xs",
                      isFinished && (pred.points_earned ?? 0) > 0
                        ? "bg-emerald-500/8 border border-emerald-500/15"
                        : "bg-white/3 border border-border/20"
                    )}
                  >
                    {/* Match name */}
                    <span className="truncate text-foreground/90 font-medium pt-0.5">
                      {m.home_team?.name ?? "?"} vs {m.away_team?.name ?? "?"}
                    </span>

                    {/* Prediction score + winner */}
                    <div className="w-14 text-center">
                      {hasPrediction ? (
                        <>
                          <div className="font-mono font-bold text-blue-300">
                            {pH}-{pA}
                          </div>
                          <div className="text-[9px] leading-tight mt-0.5">
                            {predWinner === "home" && <span className="text-blue-400 font-semibold">{homeShort}</span>}
                            {predWinner === "away" && <span className="text-blue-400 font-semibold">{awayShort}</span>}
                            {predWinner === "draw" && predDrawTeam && (
                              <span className="text-amber-400 font-semibold">
                                {predOutcome === "penalties" ? "PEN " : predOutcome === "extra_time" ? "Prórroga " : ""}
                                {predDrawTeam === "home" ? homeShort : awayShort}
                              </span>
                            )}
                            {predWinner === "draw" && !predDrawTeam && (
                              <span className="text-muted-foreground">Empate</span>
                            )}
                          </div>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-[10px]">—</span>
                      )}
                    </div>

                    {/* Real score + winner */}
                    <div className="w-14 text-center">
                      {isFinished ? (
                        <>
                          <div className="font-mono font-bold text-foreground">{rH}-{rA}</div>
                          <div className="text-[9px] leading-tight mt-0.5">
                            {realWinner === "home" && <span className="text-emerald-400 font-semibold">{homeShort}</span>}
                            {realWinner === "away" && <span className="text-emerald-400 font-semibold">{awayShort}</span>}
                            {realWinner === "draw" && realDrawTeam && (
                              <span className="text-emerald-400 font-semibold">
                                {isPen ? "PEN " : isAET ? "Prórroga " : ""}
                                {realDrawTeam === "home" ? homeShort : awayShort}
                              </span>
                            )}
                            {realWinner === "draw" && !realDrawTeam && (
                              <span className="text-muted-foreground">Empate</span>
                            )}
                          </div>
                        </>
                      ) : isLive ? (
                        <Badge className="text-[9px] px-1.5 py-0 bg-red-500/20 text-red-400 border-red-500/30 font-bold">EN VIVO</Badge>
                      ) : (
                        <Badge className="text-[9px] px-1.5 py-0 bg-yellow-500/15 text-yellow-400 border-yellow-500/25">PROG.</Badge>
                      )}
                    </div>

                    {/* Points */}
                    <span className="w-10 text-right pt-0.5">
                      {isFinished ? (
                        <span className={cn("font-bold tabular-nums", pred.points_earned === 5 ? "text-yellow-400" : (pred.points_earned ?? 0) > 0 ? "text-emerald-400" : "text-muted-foreground")}>
                          {pred.points_earned ?? 0}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {sorted && sorted.length > 0 && (
          <div className="border-t border-border/30 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>{sorted.length} predicciones</span>
            <span className="font-bold text-foreground">Total: <span className="text-gradient">{entry.total_points} pts</span></span>
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
  const [profileEntry, setProfileEntry] = useState<LeaderboardEntry | null>(null);

  const openProfile = useCallback((entry: LeaderboardEntry) => {
    if (entry.user_id === user?.id) return;
    setProfileEntry(entry);
  }, [user?.id]);

  if (isLoading) {
    return <div className="space-y-2">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>;
  }

  return (
    <>
      <div className="space-y-2">
        {userRank && user && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl border border-primary/30 p-3 mb-4 flex items-center gap-3"
          >
            <div className="flex items-center justify-center w-8"><RankIcon position={userRank.rank_position ?? 999} /></div>
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatar_url ?? undefined} />
              <AvatarFallback>{getInitials(user.display_name ?? user.username)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.display_name ?? user.username} <span className="text-xs text-primary">(Tú)</span></p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>🎯 {userRank.exact_scores} exactos</span>
                <span>✅ {userRank.correct_winners} ganadores</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gradient">{userRank.total_points}</p>
              <p className="text-xs text-muted-foreground">pts</p>
            </div>
            <button onClick={() => setDetailEntry(userRank)} className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-colors shrink-0">
              <FileText className="h-3 w-3" />Detalles
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
                  position <= 3 ? "glass border-yellow-500/20 bg-yellow-500/5" : "glass border-border/30",
                  isCurrentUser && "border-primary/40 bg-primary/5"
                )}
              >
                <div className="flex items-center justify-center w-8 shrink-0"><RankIcon position={position} /></div>

                <button
                  onClick={() => openProfile(entry)}
                  disabled={isCurrentUser}
                  className="flex items-center gap-2 flex-1 min-w-0 text-left disabled:pointer-events-none"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarImage src={entry.user?.avatar_url ?? undefined} />
                    <AvatarFallback className="text-xs">{getInitials(entry.user?.display_name ?? entry.user?.username ?? "?")}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className={cn("text-sm font-semibold truncate", position <= 3 && "text-gradient-gold", !isCurrentUser && "hover:text-primary transition-colors")}>
                      {entry.user?.display_name ?? entry.user?.username}
                      {isCurrentUser && <span className="ml-1.5 text-xs text-primary font-normal">(Tú)</span>}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>⚽ {entry.predictions_count} pred.</span>
                      <span>🎯 {entry.exact_scores}</span>
                      <span>✅ {entry.correct_winners}</span>
                    </div>
                  </div>
                </button>

                <div className="text-right shrink-0">
                  <p className={cn("text-base font-bold tabular-nums", position === 1 ? "text-gradient-gold" : "text-foreground")}>{entry.total_points}</p>
                  <p className="text-[10px] text-muted-foreground">pts</p>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <button onClick={() => setDetailEntry(entry)} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                    <FileText className="h-3 w-3" />Detalles
                  </button>
                  {!isCurrentUser && (
                    <button onClick={() => openProfile(entry)} className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
                      <Users className="h-3 w-3" />Perfil
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {(!entries || entries.length === 0) && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Nadie ha hecho predicciones aún</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {profileEntry && (
          <UserProfileModal entry={profileEntry} onClose={() => setProfileEntry(null)} onShowDetails={() => setDetailEntry(profileEntry)} />
        )}
        {detailEntry && (
          <DetallesModal entry={detailEntry} onClose={() => setDetailEntry(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
