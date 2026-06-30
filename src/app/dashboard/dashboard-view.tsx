"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  Trophy, Target, BarChart3, Calendar, TrendingUp,
  Zap, ArrowRight, Star, MapPin, CheckCircle2, Medal, Users2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagImage } from "@/components/ui/flag-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useUserRank, useLeaderboard } from "@/features/rankings/hooks/use-rankings";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { useQuery } from "@tanstack/react-query";
import { SCORING } from "@/constants";
import { useFormatDate } from "@/hooks/use-format-date";
import type { AFFixture } from "@/services/api-football";
import dynamic from "next/dynamic";

const WCTrophy = dynamic(() => import("@/components/ui/wc-trophy"), {
  ssr: false,
  loading: () => <div style={{ width: 72, height: 72 }} />,
});

async function fetchLiveMatches(): Promise<AFFixture[]> {
  try {
    const res = await fetch("/api/football/live", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function RankBadge({ pos }: { pos: number }) {
  if (pos === 1) return <span className="text-[10px] font-black text-yellow-400">🥇</span>;
  if (pos === 2) return <span className="text-[10px] font-black text-slate-300">🥈</span>;
  if (pos === 3) return <span className="text-[10px] font-black text-amber-600">🥉</span>;
  return <span className="text-[10px] font-bold text-muted-foreground tabular-nums w-4">#{pos}</span>;
}

export function DashboardView() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: userRank, isLoading: rankLoading } = useUserRank();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();
  const { data: upcomingMatches, isLoading: matchesLoading } = useMatches();
  const { data: leaderboard } = useLeaderboard(5);
  const { formatTime, formatDateShort } = useFormatDate();

  const { data: liveFixtures = [] } = useQuery<AFFixture[]>({
    queryKey: ["dashboard-live"],
    queryFn: fetchLiveMatches,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const liveApiFixtureIds = new Set(liveFixtures.map((f) => f.fixture.id));
  const now = Date.now();

  const nextMatches = upcomingMatches
    ?.filter((m) => {
      if (m.status === "finished") return false;
      if (m.status === "live") {
        if (liveFixtures.length > 0) return false;
        if (m.api_football_fixture_id && liveApiFixtureIds.has(m.api_football_fixture_id)) return false;
        return true;
      }
      if (m.status !== "scheduled") return false;
      return new Date(m.match_date).getTime() > now;
    })
    .sort((a, b) => {
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
    })
    .slice(0, 5) ?? [];

  const todayStr = new Date().toDateString();
  const todayResults = upcomingMatches
    ?.filter((m) => {
      const isToday = new Date(m.match_date).toDateString() === todayStr;
      return isToday && (m.status === "finished" || m.status === "live");
    })
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    ?? [];

  const pendingPredictions = nextMatches.filter(
    (m) => !predictions?.find((p) => p.match_id === m.id)
  ).length;

  const accuracy = (() => {
    const total = predictions?.length ?? 0;
    const exact = userRank?.exact_scores ?? 0;
    if (!total) return null;
    return Math.round((exact / total) * 100);
  })();

  const stats = [
    {
      label: "Posición",
      value: rankLoading ? null : userRank?.rank_position ? `#${userRank.rank_position}` : "—",
      icon: Trophy,
      color: "text-[hsl(var(--brand-gold))]",
      bg: "bg-[hsl(var(--brand-gold)/0.12)]",
      border: "border-[hsl(var(--brand-gold)/0.2)]",
    },
    {
      label: "Puntos",
      value: rankLoading ? null : userRank?.total_points ?? 0,
      icon: TrendingUp,
      color: "text-[hsl(var(--primary))]",
      bg: "bg-[hsl(var(--primary)/0.12)]",
      border: "border-[hsl(var(--primary)/0.2)]",
    },
    {
      label: "Exactos",
      value: rankLoading ? null : userRank?.exact_scores ?? 0,
      icon: Zap,
      color: "text-[hsl(var(--accent))]",
      bg: "bg-[hsl(var(--accent)/0.12)]",
      border: "border-[hsl(var(--accent)/0.2)]",
    },
    {
      label: "% Acierto",
      value: predsLoading || rankLoading ? null : accuracy !== null ? `${accuracy}%` : "—",
      icon: Target,
      color: "text-[hsl(var(--brand-violet))]",
      bg: "bg-[hsl(var(--brand-violet)/0.12)]",
      border: "border-[hsl(var(--brand-violet)/0.2)]",
    },
  ];

  const isLiveNow = liveFixtures.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5 relative">
      {/* Background blobs */}
      <div className="blob blob-red w-[280px] h-[280px] -top-10 -right-16 opacity-15 pointer-events-none" />
      <div className="blob blob-purple w-[240px] h-[240px] bottom-20 -left-16 opacity-12 pointer-events-none" />

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden rounded-2xl border border-white/8"
        style={{ background: "linear-gradient(135deg, hsl(222 28% 8%) 0%, hsl(240 20% 10%) 50%, hsl(258 28% 9%) 100%)" }}
      >
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 70% 50%, hsl(var(--primary)/0.2) 0%, transparent 60%)" }} />
        <div className="relative px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold border"
                style={{ background: "hsl(var(--primary)/0.15)", borderColor: "hsl(var(--primary)/0.3)", color: "hsl(var(--primary))" }}>
                <Star className="h-2.5 w-2.5 fill-current" />
                FIFA World Cup 2026
              </div>
              {isLiveNow && (
                <div className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  {liveFixtures.length} en vivo
                </div>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              {authLoading ? (
                <span className="inline-block h-7 w-32 rounded-lg bg-white/10 animate-pulse align-middle" />
              ) : (
                <>
                  Hola, <span className="text-gradient-vivid">{user?.display_name ?? user?.username ?? ""}</span>
                </>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {rankLoading ? "Calculando posición..." : userRank?.rank_position
                ? `Posición #${userRank.rank_position} · ${userRank.total_points ?? 0} puntos`
                : "Bienvenido a tu panel de predicciones"}
            </p>
          </div>
          {/* WC Trophy */}
          <div className="shrink-0 flex items-center justify-center" style={{ minWidth: 72 }}>
            <WCTrophy size={72} />
          </div>
          {/* Compact stat highlight */}
          <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
            <div className="flex items-center gap-1.5">
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Puntos</p>
                {rankLoading ? (
                  <Skeleton className="h-7 w-10 ml-auto" />
                ) : (
                  <p className="text-2xl font-black text-[hsl(var(--primary))] tabular-nums leading-none">{userRank?.total_points ?? 0}</p>
                )}
              </div>
              <div className="h-10 w-[1px] bg-white/10 mx-1" />
              <div className="text-right">
                <p className="text-[10px] text-muted-foreground">Exactos</p>
                {rankLoading ? (
                  <Skeleton className="h-7 w-8 ml-auto" />
                ) : (
                  <p className="text-2xl font-black text-[hsl(var(--accent))] tabular-nums leading-none">{userRank?.exact_scores ?? 0}</p>
                )}
              </div>
            </div>
            {pendingPredictions > 0 && (
              <Link href="/predictions" className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-[hsl(var(--primary)/0.15)] border border-[hsl(var(--primary)/0.25)] text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.25)] transition-colors">
                {pendingPredictions} partido{pendingPredictions > 1 ? "s" : ""} sin predecir →
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Mobile pending alert ──────────────────────────────────────── */}
      {pendingPredictions > 0 && (
        <div className="sm:hidden flex items-center justify-between gap-3 rounded-xl border border-[hsl(var(--primary)/0.3)] bg-[hsl(var(--primary)/0.08)] px-4 py-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-[hsl(var(--primary))]" />
            <p className="text-xs font-semibold text-white">{pendingPredictions} partido{pendingPredictions > 1 ? "s" : ""} sin predecir</p>
          </div>
          <Link href="/predictions" className="text-[10px] font-bold text-[hsl(var(--primary))] hover:opacity-80">
            Predecir →
          </Link>
        </div>
      )}

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.3 }}
            className={`glass-card rounded-xl border ${stat.border} p-3.5 flex items-center gap-3`}
          >
            <div className={`h-8 w-8 rounded-lg ${stat.bg} flex items-center justify-center shrink-0`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-medium leading-none mb-1">{stat.label}</p>
              {stat.value === null ? (
                <Skeleton className="h-5 w-10" />
              ) : (
                <p className={`text-lg font-black tabular-nums leading-none ${stat.color}`}>{stat.value}</p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Live banner ───────────────────────────────────────────────── */}
      {isLiveNow && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl border border-red-500/30 bg-red-500/8 overflow-hidden"
        >
          <Link href="/en-vivo" className="block">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                <span className="text-xs font-black text-red-400 tracking-widest uppercase">En Vivo Ahora</span>
                <span className="text-xs text-muted-foreground">— {liveFixtures.length} partido{liveFixtures.length > 1 ? "s" : ""}</span>
              </div>
              <span className="text-xs font-semibold text-red-400 flex items-center gap-1">Ver <ArrowRight className="h-3 w-3" /></span>
            </div>
            <div className="border-t border-red-500/15 px-4 py-2 flex gap-4 overflow-x-auto">
              {liveFixtures.slice(0, 3).map((f) => (
                <div key={f.fixture.id} className="flex items-center gap-2 shrink-0 text-xs font-bold text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.teams.home.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                  <span>{f.teams.home.name}</span>
                  <span className="text-red-400 font-black">{f.goals.home ?? 0}–{f.goals.away ?? 0}</span>
                  <span>{f.teams.away.name}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.teams.away.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                  {f.fixture.status.elapsed != null && (
                    <span className="text-muted-foreground">{f.fixture.status.elapsed}&apos;</span>
                  )}
                </div>
              ))}
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Main 2-col grid ───────────────────────────────────────────── */}
      <div className="grid md:grid-cols-[1fr_300px] gap-5">

        {/* Left: Today Results + Upcoming */}
        <div className="space-y-4">
          {/* Today Results */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl border border-white/8 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                </div>
                Resultados del día
              </h2>
              {todayResults.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">
                  {todayResults.length} partidos
                </span>
              )}
            </div>
            <div className="p-3 space-y-1">
              {matchesLoading
                ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)
                : todayResults.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground/60">Sin resultados hoy</p>
                  </div>
                )
                : todayResults.map((match) => {
                  const isLive = match.status === "live";
                  return (
                    <Link key={match.id} href="/fixtures">
                      <div className={`rounded-lg px-3 py-2 transition-colors ${isLive ? "border border-cyan-400/50 bg-cyan-400/5 hover:bg-cyan-400/10" : "border border-white/6 hover:bg-white/5"}`}>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <span className="text-xs font-semibold text-white truncate max-w-[60px]">{match.home_team?.short_name ?? "LOC"}</span>
                            {match.home_team?.fifa_code && <FlagImage fifaCode={match.home_team.fifa_code} size="sm" className="shrink-0" />}
                          </div>
                          <div className="flex flex-col items-center w-12 shrink-0">
                            <span className={`text-sm font-black tabular-nums text-center ${isLive ? "text-cyan-400" : "text-white"}`}>
                              {match.home_score ?? 0} – {match.away_score ?? 0}
                            </span>
                            {match.api_football_status === "PEN" && (
                              <span className="text-[8px] font-bold text-amber-400 leading-none">
                                ({match.home_score_penalties}-{match.away_score_penalties} pen)
                              </span>
                            )}
                            {match.api_football_status === "AET" && (
                              <span className="text-[8px] font-bold text-blue-400 leading-none">ET</span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-1 justify-start">
                            {match.away_team?.fifa_code && <FlagImage fifaCode={match.away_team.fifa_code} size="sm" className="shrink-0" />}
                            <span className="text-xs font-semibold text-white truncate max-w-[60px]">{match.away_team?.short_name ?? "VIS"}</span>
                          </div>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${isLive ? "bg-cyan-400/20 text-cyan-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                            {isLive ? "LIVE" : match.api_football_status === "PEN" ? "PEN" : match.api_football_status === "AET" ? "AET" : "FT"}
                          </span>
                        </div>
                        {isLive && (
                          <div className="flex justify-center mt-0.5">
                            <span className="h-1 w-1 rounded-full bg-cyan-400 animate-pulse" />
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
            </div>
          </motion.div>

          {/* Upcoming matches */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl border border-white/8 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-bold flex items-center gap-2">
                <div className={`h-6 w-6 rounded-md flex items-center justify-center ${isLiveNow ? "bg-cyan-400/15" : "bg-[hsl(var(--primary)/0.15)]"}`}>
                  <Calendar className={`h-3 w-3 ${isLiveNow ? "text-cyan-400" : "text-[hsl(var(--primary))]"}`} />
                </div>
                Próximos partidos
              </h2>
              <Link href="/fixtures" className="text-[10px] text-muted-foreground hover:text-white transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="divide-y divide-white/4">
              {matchesLoading
                ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-none" />)
                : nextMatches.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground/60">No hay partidos próximos</p>
                  </div>
                )
                : nextMatches.map((match) => {
                  const dateStr = formatDateShort(match.match_date);
                  const timeStr = formatTime(match.match_date);
                  const isLive = match.status === "live";
                  const hasPred = !!predictions?.find((p) => p.match_id === match.id);

                  return (
                    <Link key={match.id} href={isLive ? "/en-vivo" : `/predictions?match=${match.id}`}>
                      <div className={`px-4 py-2.5 flex items-center gap-3 hover:bg-white/4 transition-colors ${isLive ? "bg-cyan-400/4" : ""}`}>
                        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-0">
                          <span className="text-xs font-semibold text-white truncate max-w-[56px]">{match.home_team?.short_name ?? "TBD"}</span>
                          {match.home_team?.fifa_code && <FlagImage fifaCode={match.home_team.fifa_code} size="sm" className="shrink-0" />}
                        </div>

                        {isLive ? (
                          <div className="flex flex-col items-center shrink-0 w-14">
                            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[9px] font-black text-cyan-400 mt-0.5">LIVE</span>
                            <span className="text-sm font-black text-white tabular-nums">{match.home_score ?? 0}–{match.away_score ?? 0}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center shrink-0 w-14 text-center">
                            <span className="text-[9px] text-muted-foreground/70 leading-none">{dateStr}</span>
                            <span className="text-xs font-bold text-white leading-tight mt-0.5">{timeStr}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {match.away_team?.fifa_code && <FlagImage fifaCode={match.away_team.fifa_code} size="sm" className="shrink-0" />}
                          <span className="text-xs font-semibold text-white truncate max-w-[56px]">{match.away_team?.short_name ?? "TBD"}</span>
                        </div>

                        <div className="shrink-0">
                          {hasPred ? (
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 block" title="Predicción guardada" />
                          ) : (
                            <Target className="h-3 w-3 text-muted-foreground/40" />
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
            </div>
          </motion.div>
        </div>

        {/* Right: Mini Ranking + Scoring + Actions */}
        <div className="space-y-4">
          {/* Mini ranking top 5 */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="glass-card rounded-2xl border border-white/8 overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[hsl(var(--brand-gold)/0.15)] flex items-center justify-center">
                  <Medal className="h-3 w-3 text-[hsl(var(--brand-gold))]" />
                </div>
                Top Ranking
              </h2>
              <Link href="/rankings" className="text-[10px] text-muted-foreground hover:text-white transition-colors">
                Ver todos →
              </Link>
            </div>
            <div className="divide-y divide-white/4">
              {!leaderboard
                ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="h-4 w-8 rounded" />
                  </div>
                ))
                : leaderboard.slice(0, 5).map((entry) => {
                  const isMe = entry.user_id === user?.id;
                  const entryName = entry.user?.display_name ?? entry.user?.username ?? "—";
                  return (
                    <div
                      key={entry.user_id}
                      className={`px-4 py-2.5 flex items-center gap-2.5 ${isMe ? "bg-[hsl(var(--primary)/0.06)]" : "hover:bg-white/3 transition-colors"}`}
                    >
                      <div className="w-5 flex justify-center shrink-0">
                        <RankBadge pos={entry.rank_position ?? 0} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-semibold truncate ${isMe ? "text-[hsl(var(--primary))]" : "text-white"}`}>
                          {entryName}
                          {isMe && <span className="ml-1 text-[9px] opacity-70">(tú)</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{entry.exact_scores ?? 0} exactos</p>
                      </div>
                      <p className={`text-sm font-black tabular-nums shrink-0 ${isMe ? "text-[hsl(var(--primary))]" : "text-white"}`}>
                        {entry.total_points ?? 0}
                      </p>
                    </div>
                  );
                })}
            </div>
            {/* My rank if not in top 5 */}
            {userRank && (userRank.rank_position ?? 99) > 5 && (
              <div className="px-4 py-2.5 border-t border-white/5 flex items-center gap-2.5 bg-[hsl(var(--primary)/0.06)]">
                <div className="w-5 flex justify-center">
                  <span className="text-[10px] font-bold text-muted-foreground">#{userRank.rank_position}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[hsl(var(--primary))] truncate">{user?.display_name ?? user?.username} (tú)</p>
                </div>
                <p className="text-sm font-black tabular-nums text-[hsl(var(--primary))]">{userRank.total_points ?? 0}</p>
              </div>
            )}
          </motion.div>

          {/* Sistema de puntos — compact */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28 }}
            className="glass-card rounded-2xl border border-white/8 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-white/5">
              <h2 className="text-xs font-bold flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[hsl(var(--brand-gold)/0.15)] flex items-center justify-center">
                  <Zap className="h-3 w-3 text-[hsl(var(--brand-gold))]" />
                </div>
                Puntuación
              </h2>
            </div>
            <div className="px-4 py-3 space-y-2">
              {[
                { pts: SCORING.EXACT_WIN,     label: "Victoria exacta",  tc: "text-[hsl(var(--primary))]",      bc: "hsl(var(--primary))",      pct: 100 },
                { pts: SCORING.EXACT_DRAW,    label: "Empate exacto",    tc: "text-[hsl(var(--brand-gold))]",   bc: "hsl(var(--brand-gold))",   pct: 80 },
                { pts: SCORING.CORRECT_WINNER,label: "Ganador correcto", tc: "text-[hsl(var(--brand-violet))]", bc: "hsl(var(--brand-violet))", pct: 60 },
                { pts: SCORING.CORRECT_DRAW,  label: "Empate correcto",  tc: "text-[hsl(var(--accent))]",       bc: "hsl(var(--accent))",       pct: 20 },
                { pts: SCORING.WRONG,         label: "Incorrecto",        tc: "text-muted-foreground",           bc: "rgba(255,255,255,0.05)",   pct: 0 },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <span className={`text-sm font-black w-4 shrink-0 tabular-nums ${s.tc}`}>{s.pts}</span>
                  <div className="flex-1">
                    <div className="mb-0.5">
                      <span className="text-[10px] text-muted-foreground">{s.label}</span>
                    </div>
                    <div className="h-1 bg-white/5 rounded-full">
                      <div className="h-full rounded-full transition-all" style={{ width: `${s.pct}%`, background: s.bc }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32 }}
            className="grid grid-cols-3 gap-2"
          >
            {[
              { href: "/predictions", icon: Target,   label: "Predecir", color: "text-[hsl(var(--primary))]",      bg: "bg-[hsl(var(--primary)/0.1)]",      border: "border-[hsl(var(--primary)/0.25)]" },
              { href: "/rankings",    icon: BarChart3, label: "Ranking",  color: "text-[hsl(var(--brand-violet))]", bg: "bg-[hsl(var(--brand-violet)/0.1)]", border: "border-[hsl(var(--brand-violet)/0.25)]" },
              { href: "/fixtures",    icon: Calendar,  label: "Partidos", color: "text-[hsl(var(--brand-gold))]",   bg: "bg-[hsl(var(--brand-gold)/0.1)]",   border: "border-[hsl(var(--brand-gold)/0.25)]" },
              { href: "/groups",      icon: Users2,    label: "Grupos",   color: "text-emerald-400",                bg: "bg-emerald-500/10",                  border: "border-emerald-500/25" },
              { href: "/selecciones", icon: Trophy,    label: "Equipos",  color: "text-cyan-400",                   bg: "bg-cyan-500/10",                     border: "border-cyan-500/25" },
              { href: "/eliminatorias", icon: Star,    label: "Bracket",  color: "text-purple-400",                 bg: "bg-purple-500/10",                   border: "border-purple-500/25" },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className={`flex flex-col items-center gap-1.5 rounded-xl border ${a.border} ${a.bg} p-3 hover:brightness-110 transition-all active:scale-[0.97]`}
              >
                <a.icon className={`h-4 w-4 ${a.color}`} />
                <span className="text-[10px] font-semibold text-white">{a.label}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
