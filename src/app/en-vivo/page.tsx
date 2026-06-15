"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  Radio,
  RefreshCw,
  MapPin,
  Zap,
  ArrowRight,
  Trophy,
  AlertCircle,
} from "lucide-react";
import { useAuthStore } from "@/store/auth.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { TOURNAMENT_ID } from "@/constants";
import type { AFFixture, AFFixtureEvent, AFFixtureStats } from "@/services/api-football";

// ── Status helpers ─────────────────────────────────────────────────────────

const LIVE_STATUSES = new Set(["1H", "HT", "2H", "ET", "BT", "P", "INT", "LIVE"]);
const FINISHED_STATUSES = new Set(["FT", "AET", "PEN"]);

function statusLabel(fixture: AFFixture): string {
  const s = fixture.fixture.status;
  if (s.short === "HT") return "Descanso";
  if (s.short === "FT") return "Final";
  if (s.short === "AET") return "Final (P.E.)";
  if (s.short === "PEN") return "Final (Pen.)";
  if (s.short === "ET") return "Tiempo Extra";
  if (s.short === "BT") return "Descanso (P.E.)";
  if (s.short === "P") return "Penales";
  if (s.short === "INT") return "Interrupción";
  if (s.elapsed !== null) return `Min ${s.elapsed}${s.short === "1H" || s.short === "2H" ? "'" : ""}`;
  return s.short;
}

function isLive(fixture: AFFixture): boolean {
  return LIVE_STATUSES.has(fixture.fixture.status.short);
}

function isFinished(fixture: AFFixture): boolean {
  return FINISHED_STATUSES.has(fixture.fixture.status.short);
}

// ── Fetch helpers ──────────────────────────────────────────────────────────

async function fetchLive(): Promise<AFFixture[]> {
  const res = await fetch("/api/football/live", { cache: "no-store" });
  if (!res.ok) throw new Error("Error fetching live fixtures");
  const data = await res.json();
  if (data?.error) throw new Error(data.error);
  return Array.isArray(data) ? data : [];
}

async function fetchEvents(fixtureId: number): Promise<AFFixtureEvent[]> {
  const res = await fetch(`/api/football/events?id=${fixtureId}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchStats(fixtureId: number): Promise<AFFixtureStats[]> {
  const res = await fetch(`/api/football/stats?id=${fixtureId}`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

// ── Upcoming matches from Supabase ─────────────────────────────────────────

interface UpcomingMatch {
  id: string;
  match_date: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  home_team: { name: string; short_name: string; flag_url: string | null } | null;
  away_team: { name: string; short_name: string; flag_url: string | null } | null;
  venue: string | null;
  city: string | null;
}

async function fetchUpcoming(): Promise<UpcomingMatch[]> {
  const supabase = createClient() as any;
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("matches")
    .select("id, match_date, status, home_score, away_score, venue, city, home_team_id, away_team_id")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("status", "scheduled")
    .gte("match_date", now)
    .order("match_date", { ascending: true })
    .limit(8);

  if (!data?.length) return [];

  const teamIds = [...new Set(data.flatMap((m: any) => [m.home_team_id, m.away_team_id]).filter(Boolean))];
  const { data: teams } = await supabase
    .from("teams")
    .select("id, name, short_name, flag_url")
    .in("id", teamIds);

  const teamsById: Record<string, any> = Object.fromEntries((teams ?? []).map((t: any) => [t.id, t]));

  return data.map((m: any) => ({
    ...m,
    home_team: teamsById[m.home_team_id] ?? null,
    away_team: teamsById[m.away_team_id] ?? null,
  }));
}

// ── Event icon mapping ─────────────────────────────────────────────────────

function eventIcon(type: string, detail: string): string {
  if (type === "Goal") {
    if (detail.toLowerCase().includes("own")) return "⚽🔴";
    if (detail.toLowerCase().includes("penalty")) return "⚽⚪";
    return "⚽";
  }
  if (type === "Card") {
    if (detail.toLowerCase().includes("red")) return "🟥";
    if (detail.toLowerCase().includes("yellow-red")) return "🟧";
    return "🟨";
  }
  if (type === "subst") return "↔️";
  if (type === "Var") return "📺";
  return "•";
}

// ── Stat value formatter ───────────────────────────────────────────────────

function statValue(v: number | string | null): string {
  if (v === null || v === undefined) return "—";
  return String(v).replace("%", "") + (String(v).includes("%") ? "%" : "");
}

// ── Sub-components ─────────────────────────────────────────────────────────

function TeamDisplay({
  team,
  align,
}: {
  team: { name: string; logo: string };
  align: "left" | "right";
}) {
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 ${align === "right" ? "items-end" : "items-start"} md:items-center`}>
      <div className="relative h-14 w-14 md:h-16 md:w-16">
        {team.logo ? (
          <Image
            src={team.logo}
            alt={team.name}
            fill
            className="object-contain drop-shadow-lg"
            unoptimized
          />
        ) : (
          <div className="h-full w-full rounded-full bg-white/10 flex items-center justify-center">
            <Trophy className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
      </div>
      <span className="text-sm font-bold text-white text-center leading-tight max-w-[100px] md:max-w-none">
        {team.name}
      </span>
    </div>
  );
}

function LiveMatchCard({ fixture }: { fixture: AFFixture }) {
  const [expanded, setExpanded] = useState(false);
  const fixtureId = fixture.fixture.id;
  const live = isLive(fixture);
  const finished = isFinished(fixture);

  const { data: events = [] } = useQuery({
    queryKey: ["fixture-events", fixtureId],
    queryFn: () => fetchEvents(fixtureId),
    enabled: expanded && fixtureId > 0,
    refetchInterval: expanded && live ? 90_000 : false,
    staleTime: 60_000,
  });

  const { data: stats = [] } = useQuery({
    queryKey: ["fixture-stats", fixtureId],
    queryFn: () => fetchStats(fixtureId),
    enabled: expanded && fixtureId > 0 && (live || finished),
    refetchInterval: expanded && live ? 90_000 : false,
    staleTime: 60_000,
  });

  const homeStats = stats[0]?.statistics ?? [];
  const awayStats = stats[1]?.statistics ?? [];

  const getStatPair = (label: string) => {
    const h = homeStats.find((s) => s.type === label)?.value ?? null;
    const a = awayStats.find((s) => s.type === label)?.value ?? null;
    return { home: h, away: a };
  };

  const visibleStats = [
    { label: "Posesión del balón", key: "Ball Possession" },
    { label: "Tiros", key: "Total Shots" },
    { label: "Tiros al arco", key: "Shots on Goal" },
    { label: "Córners", key: "Corner Kicks" },
    { label: "Faltas", key: "Fouls" },
    { label: "Fueras de juego", key: "Offsides" },
  ];

  const goalEvents = events.filter((e) => e.type === "Goal");
  const cardEvents = events.filter((e) => e.type === "Card");
  const substEvents = events.filter((e) => e.type === "subst");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass rounded-2xl border overflow-hidden ${
        live
          ? "border-emerald-500/30 shadow-[0_0_24px_rgba(16,185,129,0.1)]"
          : "border-white/10"
      }`}
    >
      {/* Live badge strip */}
      {live && (
        <div className="h-0.5 bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-500 animate-pulse" />
      )}

      {/* Main match info */}
      <div
        className="p-4 md:p-6 cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {live && (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                EN VIVO
              </span>
            )}
            {finished && (
              <span className="text-xs font-semibold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                Final
              </span>
            )}
            <span className={`text-xs font-bold ${live ? "text-emerald-400" : "text-muted-foreground"}`}>
              {statusLabel(fixture)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{fixture.league.round}</span>
            <span className="text-[hsl(var(--brand-blue-light))]">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-2 md:gap-4">
          <TeamDisplay team={fixture.teams.home} align="right" />

          {/* Score */}
          <div className="flex flex-col items-center shrink-0 min-w-[80px] md:min-w-[100px]">
            <div className={`text-4xl md:text-5xl font-black tabular-nums ${live ? "text-emerald-400" : "text-white"}`}>
              {fixture.goals.home ?? 0} – {fixture.goals.away ?? 0}
            </div>
            {(fixture.score.penalty.home !== null && fixture.score.penalty.away !== null) && (
              <div className="text-xs text-muted-foreground mt-0.5">
                ({fixture.score.penalty.home} – {fixture.score.penalty.away} pen)
              </div>
            )}
            {fixture.fixture.venue.city && (
              <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {fixture.fixture.venue.city}
              </div>
            )}
          </div>

          <TeamDisplay team={fixture.teams.away} align="left" />
        </div>
      </div>

      {/* Expanded: events + stats */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/8 p-4 space-y-5">

              {/* Goals summary */}
              {goalEvents.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Goles</p>
                  <div className="space-y-1.5">
                    {goalEvents.map((e, i) => {
                      const isHome = e.team.id === fixture.teams.home.id;
                      return (
                        <div key={i} className={`flex items-center gap-2 text-sm ${isHome ? "justify-start" : "justify-end"}`}>
                          {isHome && <span className="text-base">{eventIcon(e.type, e.detail)}</span>}
                          <span className="font-semibold text-white">{e.player.name}</span>
                          {e.assist?.name && (
                            <span className="text-xs text-muted-foreground">({e.assist.name})</span>
                          )}
                          <span className="text-xs text-muted-foreground">{e.time.elapsed}&apos;</span>
                          {!isHome && <span className="text-base">{eventIcon(e.type, e.detail)}</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cards */}
              {cardEvents.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Tarjetas</p>
                  <div className="flex flex-wrap gap-2">
                    {cardEvents.map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 glass rounded-lg px-2 py-1 border border-white/8">
                        <span>{eventIcon(e.type, e.detail)}</span>
                        <span className="text-xs font-medium text-white">{e.player.name}</span>
                        <span className="text-[10px] text-muted-foreground">({e.team.name})</span>
                        <span className="text-[10px] text-muted-foreground">{e.time.elapsed}&apos;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Substitutions */}
              {substEvents.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Cambios</p>
                  <div className="flex flex-wrap gap-2">
                    {substEvents.map((e, i) => (
                      <div key={i} className="flex items-center gap-1.5 glass rounded-lg px-2 py-1 border border-white/8">
                        <span>↔️</span>
                        <span className="text-xs text-emerald-400">{e.player.name}</span>
                        {e.assist?.name && (
                          <>
                            <span className="text-muted-foreground">→</span>
                            <span className="text-xs text-red-400">{e.assist.name}</span>
                          </>
                        )}
                        <span className="text-[10px] text-muted-foreground">{e.time.elapsed}&apos;</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statistics */}
              {stats.length >= 2 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">Estadísticas</p>
                  <div className="space-y-2.5">
                    {visibleStats.map(({ label, key }) => {
                      const { home, away } = getStatPair(key);
                      if (home === null && away === null) return null;

                      const hStr = statValue(home);
                      const aStr = statValue(away);
                      const hNum = parseFloat(String(home ?? 0));
                      const aNum = parseFloat(String(away ?? 0));
                      const total = hNum + aNum || 1;
                      const hPct = Math.round((hNum / total) * 100);

                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="font-bold text-white">{hStr}</span>
                            <span className="text-muted-foreground">{label}</span>
                            <span className="font-bold text-white">{aStr}</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden flex">
                            <div
                              className="h-full bg-[hsl(var(--brand-blue))] rounded-full transition-all duration-500"
                              style={{ width: `${hPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No events loaded yet */}
              {events.length === 0 && stats.length === 0 && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Cargando eventos y estadísticas…
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Upcoming match row ─────────────────────────────────────────────────────

function UpcomingRow({ match }: { match: UpcomingMatch }) {
  const dt = new Date(match.match_date);
  const dateStr = dt.toLocaleDateString("es-MX", { weekday: "short", month: "short", day: "numeric" });
  const timeStr = dt.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors rounded-xl">
      <div className="flex-1 flex items-center justify-end gap-2">
        {match.home_team?.flag_url && (
          <Image src={match.home_team.flag_url} alt={match.home_team.name} width={24} height={16}
            className="rounded-sm object-cover shrink-0" unoptimized />
        )}
        <span className="text-sm font-semibold text-white truncate max-w-[80px]">
          {match.home_team?.short_name ?? "TBD"}
        </span>
      </div>

      <div className="shrink-0 flex flex-col items-center gap-0.5 min-w-[70px]">
        <span className="text-[10px] font-bold text-[hsl(var(--brand-blue-light))]">vs</span>
        <span className="text-[9px] text-muted-foreground">{dateStr}</span>
        <span className="text-[9px] text-muted-foreground">{timeStr}</span>
      </div>

      <div className="flex-1 flex items-center gap-2">
        {match.away_team?.flag_url && (
          <Image src={match.away_team.flag_url} alt={match.away_team.name} width={24} height={16}
            className="rounded-sm object-cover shrink-0" unoptimized />
        )}
        <span className="text-sm font-semibold text-white truncate max-w-[80px]">
          {match.away_team?.short_name ?? "TBD"}
        </span>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function EnVivoPage() {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const { user } = useAuthStore();
  const isAdmin = (user as { is_admin?: boolean } | null)?.is_admin;

  const {
    data: liveFixtures = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["live-fixtures"],
    queryFn: async () => {
      const data = await fetchLive();
      setLastUpdate(new Date());
      return data;
    },
    refetchInterval: 90_000, // 90 s — conservative for free API plan
    staleTime: 60_000,
    retry: 2,
  });

  const { data: upcomingMatches = [] } = useQuery({
    queryKey: ["upcoming-matches"],
    queryFn: fetchUpcoming,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  // Supabase Realtime — invalidate when DB is updated by the cron
  useEffect(() => {
    const supabase = createClient();
    const channel = (supabase as any)
      .channel("en-vivo-realtime")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `tournament_id=eq.${TOURNAMENT_ID}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["live-fixtures"] });
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    refetch();
    // Invalidate events/stats for all live fixtures
    liveFixtures.forEach((f) => {
      queryClient.invalidateQueries({ queryKey: ["fixture-events", f.fixture.id] });
      queryClient.invalidateQueries({ queryKey: ["fixture-stats", f.fixture.id] });
    });
  }, [refetch, queryClient, liveFixtures]);

  const livePlaying = liveFixtures.filter(isLive);
  const recentFinished = liveFixtures.filter(isFinished).slice(0, 3);

  const timeStr = lastUpdate.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {livePlaying.length > 0 ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  {livePlaying.length} PARTIDO{livePlaying.length > 1 ? "S" : ""} EN VIVO
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  <Radio className="h-3 w-3" />
                  En Vivo
                </span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">
              Partidos en <span className="text-gradient-vivid">Vivo</span>
            </h1>
            {isAdmin && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Actualización automática cada 90 seg · {timeStr}
              </p>
            )}
          </div>

          {isAdmin && (
            <button
              onClick={handleRefresh}
              disabled={isFetching}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
              Actualizar
            </button>
          )}
        </div>
      </motion.div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass rounded-2xl border border-white/10 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="h-5 w-24 bg-white/10 rounded-full" />
                <div className="h-4 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="flex items-center gap-4 justify-center">
                <div className="h-14 w-14 bg-white/10 rounded-full" />
                <div className="h-12 w-24 bg-white/10 rounded-xl" />
                <div className="h-14 w-14 bg-white/10 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="glass rounded-2xl border border-red-500/20 p-6 text-center">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-white mb-1">No se pudo conectar con la API</p>
          <p className="text-xs text-muted-foreground mb-4">
            Verifica que API_FOOTBALL_KEY esté configurada correctamente en las variables de entorno.
          </p>
          <button
            onClick={handleRefresh}
            className="text-xs text-[hsl(var(--brand-blue-light))] hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Live matches */}
      {!isLoading && livePlaying.length > 0 && (
        <div className="space-y-4 mb-8">
          {livePlaying.map((fixture) => (
            <LiveMatchCard key={fixture.fixture.id} fixture={fixture} />
          ))}
        </div>
      )}

      {/* Recently finished */}
      {!isLoading && recentFinished.length > 0 && (
        <div className="mb-8">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3 px-1">
            Recién finalizados
          </p>
          <div className="space-y-3">
            {recentFinished.map((fixture) => (
              <LiveMatchCard key={fixture.fixture.id} fixture={fixture} />
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no live matches */}
      {!isLoading && !isError && livePlaying.length === 0 && recentFinished.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl border border-[hsl(var(--brand-blue)/0.2)] p-8 text-center mb-8"
        >
          <div className="relative inline-flex items-center justify-center mb-5">
            <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand-blue)/0.08)] blur-2xl scale-150" />
            <div className="relative h-16 w-16 rounded-2xl bg-[hsl(var(--brand-blue)/0.12)] border border-[hsl(var(--brand-blue)/0.2)] flex items-center justify-center">
              <Radio className="h-7 w-7 text-[hsl(var(--brand-blue-light))]" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white mb-2">No hay partidos en vivo</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Actualmente no hay partidos en disputa. La página se actualiza automáticamente.
          </p>
        </motion.div>
      )}

      {/* Upcoming matches — future scheduled + live from Supabase when API has no live */}
      {!isLoading && upcomingMatches.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground px-1">
              Próximos partidos
            </p>
            <Link
              href="/fixtures"
              className="flex items-center gap-1 text-xs text-[hsl(var(--brand-blue-light))] hover:text-white transition-colors"
            >
              Ver todos
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="glass rounded-2xl border border-white/8 overflow-hidden divide-y divide-white/5">
            {upcomingMatches.map((m) => (
              <UpcomingRow key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      {/* API usage note — admin only */}
      {isAdmin && (
        <div className="mt-8 flex items-start gap-2 p-3 rounded-xl bg-white/3 border border-white/8">
          <Zap className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))] mt-0.5 shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Los datos se actualizan cada 90 segundos desde API-Football. Haz clic en un partido para ver
            goles, tarjetas, cambios y estadísticas en detalle.
          </p>
        </div>
      )}
    </div>
  );
}
