"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Trophy, Target, BarChart3, Calendar, TrendingUp, Zap, ArrowRight, Star, MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/store/auth.store";
import { useUserRank } from "@/features/rankings/hooks/use-rankings";
import { useUserPredictions } from "@/features/predictions/hooks/use-predictions";
import { useMatches } from "@/features/fixtures/hooks/use-fixtures";
import { SCORING } from "@/constants";
import { useFormatDate } from "@/hooks/use-format-date";

export function DashboardView() {
  const { user, isLoading: authLoading } = useAuthStore();
  const { data: userRank, isLoading: rankLoading } = useUserRank();
  const { data: predictions, isLoading: predsLoading } = useUserPredictions();
  const { data: upcomingMatches, isLoading: matchesLoading } = useMatches();
  const { formatTime, formatDateShort } = useFormatDate();

  // Live matches shown first, then upcoming scheduled
  const now = Date.now();
  const nextMatches = upcomingMatches
    ?.filter((m) => {
      if (m.status === "finished") return false;
      if (m.status === "live") return true;
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
        className="mb-8"
      >
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
        {/* Next matches */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card rounded-2xl border border-white/8 overflow-hidden"
        >
          <div className="p-5 border-b border-white/5">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
                <Calendar className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
              </div>
              Próximos partidos
            </h2>
          </div>
          <div className="p-3 space-y-1">
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
                    <Link key={match.id} href={`/predictions?match=${match.id}`}>
                      <div className={`px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group ${isLive ? "bg-emerald-500/5 border border-emerald-500/20" : ""}`}>
                        {/* Live header */}
                        {isLive && (
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span className="text-[10px] font-black text-emerald-400 tracking-wide">EN VIVO</span>
                            </div>
                            {(match as any).elapsed != null && (
                              <span className="text-[10px] font-bold text-emerald-400/80">
                                {(match as any).elapsed}&apos;
                              </span>
                            )}
                          </div>
                        )}
                        {/* Teams row */}
                        <div className="flex items-center gap-2">
                          {/* Home */}
                          <div className="flex items-center gap-1.5 flex-1 justify-end">
                            <span className={`text-xs font-semibold truncate max-w-[52px] ${isLive ? "text-white" : "text-white"}`}>
                              {match.home_team?.short_name ?? "TBD"}
                            </span>
                            {(match.home_team as any)?.flag_url && (
                              <Image
                                src={(match.home_team as any).flag_url}
                                alt={match.home_team?.short_name ?? ""}
                                width={24} height={16}
                                className="rounded-sm object-cover shadow-sm shrink-0"
                              />
                            )}
                          </div>
                          {/* Score (live) or VS + date (scheduled) */}
                          <div className="flex flex-col items-center shrink-0 w-14">
                            {isLive ? (
                              <span className="text-base font-black text-white tabular-nums leading-none">
                                {match.home_score ?? 0} – {match.away_score ?? 0}
                              </span>
                            ) : (
                              <>
                                <span className="text-[10px] text-muted-foreground font-bold leading-none">VS</span>
                                <span className="text-[9px] text-muted-foreground/70 mt-0.5 leading-none">{dateStr}</span>
                                <span className="text-[9px] text-muted-foreground/50 leading-none">{timeStr}</span>
                              </>
                            )}
                          </div>
                          {/* Away */}
                          <div className="flex items-center gap-1.5 flex-1 justify-start">
                            {(match.away_team as any)?.flag_url && (
                              <Image
                                src={(match.away_team as any).flag_url}
                                alt={match.away_team?.short_name ?? ""}
                                width={24} height={16}
                                className="rounded-sm object-cover shadow-sm shrink-0"
                              />
                            )}
                            <span className="text-xs font-semibold text-white truncate max-w-[52px]">
                              {match.away_team?.short_name ?? "TBD"}
                            </span>
                          </div>
                          {/* Status + arrow */}
                          {!isLive && (
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${st.cls}`}>
                                {st.label}
                              </span>
                              <ArrowRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                          {isLive && (
                            <ArrowRight className="h-3 w-3 text-emerald-400/50 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          )}
                        </div>
                        {/* Venue row */}
                        {!isLive && (match.venue || match.city) && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <MapPin className="h-2.5 w-2.5 text-muted-foreground/50" />
                            <span className="text-[9px] text-muted-foreground/50 truncate">
                              {match.venue ?? match.city}
                              {match.venue && match.city ? `, ${match.city}` : ""}
                            </span>
                          </div>
                        )}
                      </div>
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
