"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Target, BarChart3, Calendar, TrendingUp, Zap, ArrowRight, Star, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlagImage } from "@/components/ui/flag-image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useUserRank } from "@/features/rankings/hooks/use-rankings";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { useQuery } from "@tanstack/react-query";
import { SCORING } from "@/constants";
import { useFormatDate } from "@/hooks/use-format-date";
import type { AFFixture } from "@/services/api-football";
import dynamic from "next/dynamic";

const WCTrophy = dynamic(() => import("@/components/ui/wc-trophy"), {
  ssr: false,
  loading: () => <div style={{ width: 96, height: 96 }} />,
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

export function DashboardView() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: userRank, isLoading: rankLoading } = useUserRank();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();
  const { data: upcomingMatches, isLoading: matchesLoading } = useMatches();
  const { formatTime, formatDateShort } = useFormatDate();

  // Live data from the same source as En Vivo section (API-Football)
  const { data: liveFixtures = [] } = useQuery<AFFixture[]>({
    queryKey: ["dashboard-live"],
    queryFn: fetchLiveMatches,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Live matches shown first, then upcoming scheduled
  // Exclude DB-live matches already rendered via liveFixtures (API-Football) to prevent duplicates
  const liveApiFixtureIds = new Set(liveFixtures.map((f) => f.fixture.id));
  const now = Date.now();
  const nextMatches = upcomingMatches
    ?.filter((m) => {
      if (m.status === "finished") return false;
      if (m.status === "live") {
        // If API-Football has live data, don't show DB live matches (prevents duplicate)
        if (liveFixtures.length > 0) return false;
        // If a specific fixture ID matches one already shown, skip it
        if (m.api_football_fixture_id && liveApiFixtureIds.has(m.api_football_fixture_id)) return false;
        return true;
      }
      if (m.status !== "scheduled") return false;
      const matchTime = new Date(m.match_date).getTime();
      return matchTime > now;
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

  const stats = [
    {
      label: "Posición",
      value: rankLoading ? null : userRank?.rank_position ? `#${userRank.rank_position}` : "—",
      icon: Trophy,
      color: "text-[hsl(var(--brand-gold))]",
      iconBg: "bg-[hsl(var(--brand-gold)/0.15)]",
      border: "border-[hsl(var(--brand-gold)/0.2)]",
      loading: rankLoading,
    },
    {
      label: "Puntos",
      value: rankLoading ? null : userRank?.total_points ?? 0,
      icon: TrendingUp,
      color: "text-[hsl(var(--primary))]",
      iconBg: "bg-[hsl(var(--primary)/0.15)]",
      border: "border-[hsl(var(--primary)/0.2)]",
      loading: rankLoading,
    },
    {
      label: "Exactos",
      value: rankLoading ? null : userRank?.exact_scores ?? 0,
      icon: Zap,
      color: "text-[hsl(var(--accent))]",
      iconBg: "bg-[hsl(var(--accent)/0.15)]",
      border: "border-[hsl(var(--accent)/0.2)]",
      loading: rankLoading,
    },
    {
      label: "Predicciones",
      value: predsLoading ? null : predictions?.length ?? 0,
      icon: Target,
      color: "text-[hsl(var(--brand-violet))]",
      iconBg: "bg-[hsl(var(--brand-violet)/0.15)]",
      border: "border-[hsl(var(--brand-violet)/0.2)]",
      loading: predsLoading,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 relative">
      {/* Subtle blobs */}
      <div className="blob blob-red w-[350px] h-[350px] -top-20 -right-20 opacity-20 pointer-events-none" />
      <div className="blob blob-purple w-[300px] h-[300px] bottom-0 -left-20 opacity-15 pointer-events-none" />

      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8 flex items-center justify-between"
      >
        <div>
          <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-semibold border border-[hsl(var(--primary)/0.2)] text-[hsl(var(--primary))] mb-3">
            <Star className="h-2.5 w-2.5 fill-current" />
            FIFA World Cup 2026
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-1 flex items-center gap-2 flex-wrap">
            Hola,{" "}
            {authLoading ? (
              <span className="inline-block h-9 w-36 rounded-xl bg-white/10 animate-pulse align-middle" />
            ) : (
              <span className="text-gradient-vivid">
                {user?.display_name ?? user?.username ?? ""}
              </span>
            )}
          </h1>
          <p className="text-muted-foreground text-sm">Bienvenido a tu panel de predicciones</p>
        </div>
        <div className="hidden sm:block shrink-0">
          <WCTrophy size={96} />
        </div>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.35 }}
            className={`relative glass-card rounded-2xl border ${stat.border} p-4 overflow-hidden`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
              <div className={`h-7 w-7 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              </div>
            </div>
            {stat.value === null ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className={`text-3xl font-black tabular-nums ${stat.color}`}>{stat.value}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Alert: pending predictions */}
      {pendingPredictions > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="relative rounded-2xl border border-[hsl(var(--primary)/0.3)] bg-gradient-to-r from-[hsl(var(--primary)/0.12)] to-[hsl(var(--brand-purple)/0.08)] p-4 mb-8 flex items-center justify-between overflow-hidden"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--primary)/0.2)] flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-[hsl(var(--primary))]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {pendingPredictions} partido{pendingPredictions > 1 ? "s" : ""} sin predecir
              </p>
              <p className="text-xs text-muted-foreground">¡No pierdas puntos valiosos!</p>
            </div>
          </div>
          <Button
            size="sm"
            asChild
            className="bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--brand-purple))] text-white hover:opacity-90 shrink-0"
          >
            <Link href="/predictions">
              Predecir
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </motion.div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Today's results */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              </div>
              Resultados del día
            </h2>
          </div>
          <div className="p-3 space-y-1">
            {matchesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))
              : todayResults.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-white/60">Sin resultados hoy</p>
                  <p className="text-xs text-muted-foreground mt-1">Los resultados aparecen aquí al finalizar</p>
                </div>
              )
              : todayResults.map((match) => {
                const isLive = match.status === "live";
                const homeScore = match.home_score ?? 0;
                const awayScore = match.away_score ?? 0;
                const timeStr = formatTime(match.match_date);
                return (
                  <Link key={match.id} href="/fixtures">
                    <div className={`rounded-xl px-3 py-2.5 mb-1 transition-colors ${isLive ? "border-2 border-cyan-400/70 bg-cyan-400/5 hover:bg-cyan-400/10" : "border border-white/8 bg-white/3 hover:bg-white/6"}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        {isLive ? (
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">EN VIVO</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">{timeStr}</span>
                        )}
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isLive ? "bg-cyan-400/20 text-cyan-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                          {isLive ? "En vivo" : "FT"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-1 justify-end">
                          <span className="text-sm font-bold text-white truncate max-w-[64px]">{match.home_team?.name ?? "Local"}</span>
                          {match.home_team?.fifa_code && <FlagImage fifaCode={match.home_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />}
                        </div>
                        <span className={`text-xl font-black tabular-nums px-2 shrink-0 ${isLive ? "text-cyan-400" : "text-white"}`}>
                          {homeScore} – {awayScore}
                        </span>
                        <div className="flex items-center gap-1.5 flex-1 justify-start">
                          {match.away_team?.fifa_code && <FlagImage fifaCode={match.away_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />}
                          <span className="text-sm font-bold text-white truncate max-w-[64px]">{match.away_team?.name ?? "Visitante"}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
          </div>
          {todayResults.length > 0 && (
            <div className="px-5 pb-4">
              <Button variant="glass" size="sm" asChild className="w-full text-xs">
                <Link href="/fixtures">Ver todos los partidos</Link>
              </Button>
            </div>
          )}
        </motion.div>

        {/* Next matches */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${liveFixtures.length > 0 ? "bg-cyan-400/15" : "bg-[hsl(var(--primary)/0.15)]"}`}>
                {liveFixtures.length > 0
                  ? <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  : <Calendar className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />}
              </div>
              {liveFixtures.length > 0 ? <span className="text-cyan-400">En Vivo · Próximos</span> : "Próximos partidos"}
            </h2>
          </div>
          <div className="p-3 space-y-1">
            {/* Live cards from API-Football — same source as En Vivo section */}
            {liveFixtures.map((f) => {
              const elapsed = f.fixture.status.elapsed;
              const homeGoals = f.goals.home ?? 0;
              const awayGoals = f.goals.away ?? 0;
              return (
                <Link key={f.fixture.id} href="/en-vivo">
                  <div className="rounded-xl border-2 border-cyan-400/70 bg-cyan-400/5 px-3 py-2.5 mb-1 group transition-colors hover:bg-cyan-400/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">EN VIVO</span>
                      </div>
                      {elapsed != null && (
                        <span className="text-[11px] font-bold text-cyan-400">{elapsed}&apos;</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 justify-end">
                        <span className="text-sm font-bold text-white truncate max-w-[64px]">{f.teams.home.name}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.teams.home.logo} alt={f.teams.home.name} width={20} height={20} className="h-5 w-5 object-contain shrink-0" />
                      </div>
                      <span className="text-xl font-black text-white tabular-nums px-2 shrink-0">
                        {homeGoals} – {awayGoals}
                      </span>
                      <div className="flex items-center gap-1.5 flex-1 justify-start">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.teams.away.logo} alt={f.teams.away.name} width={20} height={20} className="h-5 w-5 object-contain shrink-0" />
                        <span className="text-sm font-bold text-white truncate max-w-[64px]">{f.teams.away.name}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
            {matchesLoading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))
              : nextMatches.map((match) => {
                  const dateStr = formatDateShort(match.match_date);
                  const timeStr = formatTime(match.match_date);
                  const statusMap: Record<string, { label: string; cls: string }> = {
                    scheduled: { label: "Programado", cls: "bg-white/5 text-muted-foreground" },
                    live:      { label: "EN VIVO",    cls: "bg-emerald-500/15 text-emerald-400 font-bold" },
                    finished:  { label: "Finalizado", cls: "bg-white/5 text-muted-foreground" },
                    postponed: { label: "Aplazado",   cls: "bg-yellow-500/15 text-yellow-400" },
                    cancelled: { label: "Cancelado",  cls: "bg-red-500/15 text-red-400" },
                  };
                  const st = statusMap[match.status] ?? statusMap.scheduled;

                  const isLive = match.status === "live";

                  return (
                    <Link key={match.id} href={isLive ? "/en-vivo" : `/predictions?match=${match.id}`}>
                      {isLive ? (
                        /* ── LIVE card: cyan border matching En Vivo section ── */
                        <div className="rounded-xl border-2 border-cyan-400/70 bg-cyan-400/5 px-3 py-2.5 group transition-colors hover:bg-cyan-400/10">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                              <span className="text-[11px] font-black text-cyan-400 tracking-widest uppercase">EN VIVO</span>
                            </div>
                            <span className="text-[11px] font-bold text-cyan-400">
                              {(match as any).elapsed != null ? `${(match as any).elapsed}'` : ""}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-1 justify-end">
                              <span className="text-sm font-bold text-white truncate max-w-[56px]">
                                {match.home_team?.short_name ?? "TBD"}
                              </span>
                              {match.home_team?.fifa_code && (
                                <FlagImage fifaCode={match.home_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />
                              )}
                            </div>
                            <span className="text-xl font-black text-white tabular-nums px-2 shrink-0">
                              {match.home_score ?? 0} – {match.away_score ?? 0}
                            </span>
                            <div className="flex items-center gap-1.5 flex-1 justify-start">
                              {match.away_team?.fifa_code && (
                                <FlagImage fifaCode={match.away_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />
                              )}
                              <span className="text-sm font-bold text-white truncate max-w-[56px]">
                                {match.away_team?.short_name ?? "TBD"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* ── Scheduled / finished card ── */
                        <div className="px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 flex-1 justify-end">
                              <span className="text-xs font-semibold truncate max-w-[52px] text-white">
                                {match.home_team?.short_name ?? "TBD"}
                              </span>
                              {match.home_team?.fifa_code && (
                                <FlagImage fifaCode={match.home_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-col items-center shrink-0 w-14">
                              <span className="text-[10px] text-muted-foreground font-bold leading-none">VS</span>
                              <span className="text-[9px] text-muted-foreground/70 mt-0.5 leading-none">{dateStr}</span>
                              <span className="text-[9px] text-muted-foreground/50 leading-none">{timeStr}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-1 justify-start">
                              {match.away_team?.fifa_code && (
                                <FlagImage fifaCode={match.away_team.fifa_code} fallbackEmoji="🏳️" size="sm" className="rounded-sm shrink-0" />
                              )}
                              <span className="text-xs font-semibold text-white truncate max-w-[52px]">
                                {match.away_team?.short_name ?? "TBD"}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${st.cls}`}>
                                {st.label}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                          {(match.venue || match.city) && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <MapPin className="h-2.5 w-2.5 text-muted-foreground/50" />
                              <span className="text-[9px] text-muted-foreground/50 truncate">
                                {match.venue ?? match.city}
                                {match.venue && match.city ? `, ${match.city}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </Link>
                  );
                })}
            {!matchesLoading && nextMatches.length === 0 && (
              <div className="text-center py-8 px-4">
                <Calendar className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white/60">El Mundial comienza el 11 Jun</p>
                <p className="text-xs text-muted-foreground mt-1">Los partidos se cargarán automáticamente</p>
              </div>
            )}
          </div>
          {nextMatches.length > 0 && (
            <div className="px-5 pb-4">
              <Button variant="glass" size="sm" asChild className="w-full text-xs">
                <Link href="/fixtures">Ver todos los partidos</Link>
              </Button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Scoring guide — below */}
      <div className="mt-5">
        {/* Scoring guide */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[hsl(var(--brand-gold)/0.15)] flex items-center justify-center">
                <Zap className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))]" />
              </div>
              Sistema de puntos
            </h2>
          </div>
          <div className="p-5 space-y-3">
            {[
              {
                pts: SCORING.EXACT_WIN,
                label: "Victoria exacta",
                color: "text-[hsl(var(--primary))]",
                bar: "bg-[hsl(var(--primary))]",
                w: "w-full",
              },
              {
                pts: SCORING.EXACT_DRAW,
                label: "Empate exacto",
                color: "text-[hsl(var(--brand-gold))]",
                bar: "bg-[hsl(var(--brand-gold))]",
                w: "w-4/5",
              },
              {
                pts: SCORING.CORRECT_WINNER,
                label: "Ganador correcto",
                color: "text-[hsl(var(--brand-violet))]",
                bar: "bg-[hsl(var(--brand-violet))]",
                w: "w-3/5",
              },
              {
                pts: SCORING.CORRECT_DRAW,
                label: "Empate correcto",
                color: "text-[hsl(var(--accent))]",
                bar: "bg-[hsl(var(--accent))]",
                w: "w-1/5",
              },
              {
                pts: SCORING.WRONG,
                label: "Predicción errónea",
                color: "text-muted-foreground",
                bar: "bg-white/10",
                w: "w-0",
              },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className={`text-xl font-black tabular-nums w-5 shrink-0 ${s.color}`}>
                  {s.pts}
                </span>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar} ${s.w} transition-all`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Quick actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.36 }}
        className="mt-5 grid grid-cols-3 gap-3"
      >
        {[
          { href: "/predictions", icon: Target, label: "Predecir", color: "text-[hsl(var(--primary))]", bg: "bg-[hsl(var(--primary)/0.1)]", border: "border-[hsl(var(--primary)/0.2)]" },
          { href: "/rankings", icon: BarChart3, label: "Ranking", color: "text-[hsl(var(--brand-violet))]", bg: "bg-[hsl(var(--brand-violet)/0.1)]", border: "border-[hsl(var(--brand-violet)/0.2)]" },
          { href: "/fixtures", icon: Trophy, label: "Partidos", color: "text-[hsl(var(--brand-gold))]", bg: "bg-[hsl(var(--brand-gold)/0.1)]", border: "border-[hsl(var(--brand-gold)/0.2)]" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-2 rounded-2xl border ${action.border} ${action.bg} p-4 hover:brightness-110 transition-all active:scale-[0.97]`}
          >
            <action.icon className={`h-5 w-5 ${action.color}`} />
            <span className="text-xs font-semibold text-white">{action.label}</span>
          </Link>
        ))}
      </motion.div>
    </div>
  );
}
