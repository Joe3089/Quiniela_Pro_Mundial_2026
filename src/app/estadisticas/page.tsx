"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { TrendingUp, Trophy, Clock, Star, AlertTriangle, Globe2, Users, Zap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  WC_EDITIONS,
  WC_CHAMPIONS,
  ALL_TIME_SCORERS,
  RECORDS_2026,
  CONTINENT_STATS,
  MOST_APPEARANCES,
} from "@/data/wc-history";
import { FlagImage } from "@/components/ui/flag-image";
import { ConfederationBadge } from "@/components/ui/confederation-badge";
import { cn, getPlayerPhotoUrl } from "@/lib/utils";

// Verified API-Football national team IDs → federation crest URLs
const FEDERATION_CRESTS: Record<string, string> = {
  MEX: "https://media.api-sports.io/football/teams/16.png",
  BRA: "https://media.api-sports.io/football/teams/6.png",
  ARG: "https://media.api-sports.io/football/teams/26.png",
  FRA: "https://media.api-sports.io/football/teams/2.png",
  ESP: "https://media.api-sports.io/football/teams/9.png",
  GER: "https://media.api-sports.io/football/teams/25.png",
  ENG: "https://media.api-sports.io/football/teams/10.png",
  CRO: "https://media.api-sports.io/football/teams/3.png",
  POR: "https://media.api-sports.io/football/teams/27.png",
  BEL: "https://media.api-sports.io/football/teams/1.png",
  NED: "https://media.api-sports.io/football/teams/1118.png",
  SUI: "https://media.api-sports.io/football/teams/15.png",
  URU: "https://media.api-sports.io/football/teams/40.png",
  COL: "https://media.api-sports.io/football/teams/39.png",
  JPN: "https://media.api-sports.io/football/teams/21.png",
  KOR: "https://media.api-sports.io/football/teams/149.png",
  TUR: "https://media.api-sports.io/football/teams/19.png",
  // NOR removed — ID 772 shows wrong team; falls back to flag

};

// Verified API-Football player IDs (tested against API)
const PLAYER_API_IDS: Record<string, number> = {
  // Current players — IDs verified ✓
  "Kylian Mbappé":      278,
  "Lionel Messi":       154,
  "Erling Haaland":     1100,
  "Harry Kane":         184,
  "Cristiano Ronaldo":  874,
  "Neymar Jr.":         276,
  "Neymar":             276,
  "Vinícius Jr.":       384384,
  "Julián Álvarez":     342666,
};

// Direct photo URLs for historical players not available in API-Football
const PLAYER_PHOTO_URLS: Record<string, string> = {
  "Miroslav Klose":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Miroslav_Klose_2014.jpg/220px-Miroslav_Klose_2014.jpg",
  "Ronaldo (R9)":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Ronaldo_Fenomeno.jpg/220px-Ronaldo_Fenomeno.jpg",
  "Gerd Müller":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Gerd_M%C3%BCller_-_1974_WM.jpg/220px-Gerd_M%C3%BCller_-_1974_WM.jpg",
  "Pelé":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Pel%C3%A9_col%C3%B3mbia_1970_%28cropped%29.jpg/220px-Pel%C3%A9_col%C3%B3mbia_1970_%28cropped%29.jpg",
  "Just Fontaine":
    "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/JustFontaine.jpg/220px-JustFontaine.jpg",
};

// Team kit primary colors (for avatar backgrounds)
const TEAM_COLORS: Record<string, string> = {
  GER: "1C1C1C", BRA: "009C3B", FRA: "002395", ARG: "74ACDF",
  ITA: "003DA5", ENG: "CF081F", ESP: "AA151B", POR: "006600",
  URU: "72A7D3", NED: "FF6600", HUN: "CE2939", CZE: "D7141A",
};

function PlayerPhoto({ name, fifaCode, size = 32 }: { name: string; fifaCode?: string; size?: number }) {
  const apiId = PLAYER_API_IDS[name];
  const directUrl = PLAYER_PHOTO_URLS[name];
  const kitColor = fifaCode ? (TEAM_COLORS[fifaCode] ?? "1D4ED8") : "1D4ED8";

  // Priority: 1) direct Wikipedia/official URL  2) API-Football  3) ui-avatars fallback
  const src = directUrl
    ? directUrl
    : getPlayerPhotoUrl({ name, apiFootballId: apiId }, kitColor);

  const avatarFallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${kitColor}&color=fff&size=${size * 2}&bold=true&format=png`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: "cover" }}
      className="rounded-full border border-white/15 shadow-md shrink-0 bg-white/5"
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        if (img.src !== avatarFallback) img.src = avatarFallback;
      }}
    />
  );
}

// Shield-style team badge using flag
function TeamBadge({ fifaCode, flag, size = "md" }: { fifaCode: string; flag?: string; size?: "sm" | "md" | "lg" }) {
  const sizeMap = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-14 w-14" };
  return (
    <div className={cn(
      "rounded-lg overflow-hidden border border-white/15 shadow-md shrink-0 flex items-center justify-center bg-black/20",
      sizeMap[size]
    )}>
      <FlagImage fifaCode={fifaCode} fallbackEmoji={flag} size={size === "lg" ? "md" : "sm"} />
    </div>
  );
}

function SectionTitle({ icon: Icon, title, color }: { icon: React.ElementType; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <h2 className="font-bold text-sm tracking-wide uppercase text-muted-foreground">{title}</h2>
    </div>
  );
}

/* ── CAMPEONES TAB ──────────────────────────────────────────── */
function CampeonesTab() {
  return (
    <div className="space-y-8">
      {/* Champions ranking */}
      <div>
        <SectionTitle icon={Trophy} title="Países campeones del mundo" color="#F5A500" />
        <div className="space-y-2">
          {WC_CHAMPIONS.sort((a, b) => b.titles - a.titles).map((c, i) => (
            <motion.div
              key={c.country}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3"
            >
              <span className="text-xl font-black text-muted-foreground w-5 shrink-0">{i + 1}</span>
              <TeamBadge fifaCode={c.fifaCode} flag={c.flag} size="md" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-sm font-bold text-white">{c.country}</p>
                  <ConfederationBadge confederation={c.confederation} size="sm" />
                </div>
                <p className="text-[11px] text-muted-foreground">{c.years.join(" · ")}</p>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-black text-[hsl(var(--brand-gold))]">{c.titles}</div>
                  <div className="text-[9px] text-muted-foreground">títulos</div>
                </div>
                <div className="text-center hidden sm:block">
                  <div className="text-base font-bold text-muted-foreground">{c.runnerUp}</div>
                  <div className="text-[9px] text-muted-foreground">subcampeonatos</div>
                </div>
                {/* Bar */}
                <div className="w-24 hidden md:block">
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(c.titles / 5) * 100}%`, background: "#F5A500" }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Continent stats */}
      <div>
        <SectionTitle icon={Globe2} title="Campeonatos por continente" color="#3b82f6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CONTINENT_STATS.map((c) => (
            <div key={c.continent} className="glass rounded-xl border border-white/5 p-3">
              <div className="text-2xl font-black mb-1" style={{ color: c.color }}>{c.titles}</div>
              <div className="text-xs font-bold text-white mb-0.5">{c.continent}</div>
              <div className="text-[10px] text-muted-foreground">{c.participations} participaciones · {c.hostTimes}x sede</div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(c.titles / 12) * 100}%`, background: c.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Most appearances */}
      <div>
        <SectionTitle icon={Users} title="Selecciones con más participaciones" color="#10b981" />
        <div className="space-y-2">
          {MOST_APPEARANCES.map((m, i) => (
            <div key={m.country} className="flex items-center gap-3 glass rounded-xl border border-white/5 p-2.5">
              <span className="text-xs text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
              <FlagImage fifaCode={m.fifaCode ?? ""} fallbackEmoji={m.flag} size="sm" className="shrink-0" />
              <span className="text-sm font-semibold text-white flex-1">{m.country}</span>
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden hidden md:block">
                  <div className="h-full rounded-full bg-emerald-400" style={{ width: `${(m.count / 22) * 100}%` }} />
                </div>
                <span className="text-sm font-black text-emerald-400 w-6 text-right">{m.count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── HISTORIAL TAB ──────────────────────────────────────────── */
function HistorialTab() {
  const { data: matchStats } = useQuery({
    queryKey: ["match-stats-summary"],
    queryFn: fetchMatchStats,
    staleTime: 60_000,
  });

  // Historical totals from all past editions (1930–2022)
  const histGoals   = WC_EDITIONS.reduce((s, e) => s + e.totalGoals, 0);
  const histMatches = WC_EDITIONS.reduce((s, e) => s + e.matches,    0);
  const histEditions = WC_EDITIONS.length;

  // Live WC 2026 additions
  const liveGoals   = matchStats?.goals   ?? 0;
  const livePlayed  = matchStats?.played  ?? 0;

  const totalGoals   = histGoals   + liveGoals;
  const totalMatches = histMatches + livePlayed;
  const totalEditions = histEditions + 1;

  return (
    <div className="space-y-6">
      {/* Cumulative stats banner */}
      <div className="glass-card rounded-2xl border border-[hsl(var(--brand-gold)/0.25)] bg-[hsl(var(--brand-gold)/0.05)] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-4 w-4 text-[hsl(var(--brand-gold))]" />
          <span className="text-xs font-bold text-[hsl(var(--brand-gold))] uppercase tracking-wider">
            Acumulado histórico · 1930–2026 (en curso)
          </span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Ediciones", value: totalEditions, note: `${histEditions} pasadas + WC 2026`, color: "#8b5cf6" },
            { label: "Partidos jugados", value: totalMatches.toLocaleString("es"), note: `${histMatches.toLocaleString("es")} histórico + ${livePlayed} WC 2026`, color: "#3b82f6" },
            { label: "Goles marcados", value: totalGoals.toLocaleString("es"), note: `${histGoals.toLocaleString("es")} histórico + ${liveGoals} WC 2026`, color: "#F5A500" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[10px] font-bold text-white mb-0.5">{s.label}</div>
              <div className="text-[9px] text-muted-foreground leading-tight">{s.note}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionTitle icon={Clock} title="Historial de ediciones (1930–2022)" color="#8b5cf6" />
      <div className="space-y-2">
        {[...WC_EDITIONS].reverse().map((ed, i) => (
          <motion.div
            key={ed.year}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="glass rounded-xl border border-white/5 p-3 hover:border-white/10 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 text-center w-12">
                <div className="text-base font-black text-white">{ed.year}</div>
                <div className="text-[9px] text-muted-foreground">{ed.host}</div>
              </div>
              <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Campeón</p>
                  <p className="text-xs font-bold text-[hsl(var(--brand-gold))]">{ed.champion}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Subcampeón</p>
                  <p className="text-xs font-semibold text-white">{ed.runnerUp}</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Goleador</p>
                  <p className="text-xs text-white truncate">{ed.topScorer.name} ({ed.topScorer.goals}⚽)</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">Partidos / Goles</p>
                  <p className="text-xs text-white">{ed.matches} / {ed.totalGoals}</p>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── GOLEADORES TAB ─────────────────────────────────────────── */
function GoladoresTab() {
  const { data: scorers2026 = [] } = useQuery({
    queryKey: ["top-scorers"],
    queryFn: () => fetchTopScorers("scorers"),
    staleTime: 3_600_000,
    refetchInterval: 300_000,
  });

  // API-Football player ID → WC 2026 goals
  const goals2026ByApiId = useMemo(() => {
    const m: Record<number, number> = {};
    for (const entry of scorers2026) {
      const g = entry.statistics[0]?.goals?.total ?? 0;
      if (g > 0) m[entry.player.id] = g;
    }
    return m;
  }, [scorers2026]);

  // Historical totals + WC 2026 additions merged and re-ranked
  const mergedScorers = useMemo(() => {
    return [...ALL_TIME_SCORERS]
      .map((s) => {
        const apiId = PLAYER_API_IDS[s.name];
        const extra2026 = apiId ? (goals2026ByApiId[apiId] ?? 0) : 0;
        return { ...s, goals: s.goals + extra2026, extra2026 };
      })
      .sort((a, b) => b.goals - a.goals || a.name.localeCompare(b.name))
      .map((s, i) => ({ ...s, rank: i + 1 }));
  }, [goals2026ByApiId]);

  const maxGoals = mergedScorers[0]?.goals ?? 16;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <SectionTitle icon={Star} title="Máximos goleadores históricos" color="#F5A500" />
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Actualizado con WC 2026
        </div>
      </div>
      <div className="space-y-2">
        {mergedScorers.map((s, i) => (
          <motion.div
            key={s.name + s.country}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3"
          >
            <span className={cn(
              "text-sm font-black w-5 shrink-0 text-center",
              i === 0 ? "text-[hsl(var(--brand-gold))]" : "text-muted-foreground"
            )}>{s.rank}</span>
            <div className="relative shrink-0">
              <PlayerPhoto name={s.name} fifaCode={s.fifaCode} size={36} />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
                {FEDERATION_CRESTS[s.fifaCode ?? ""] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={FEDERATION_CRESTS[s.fifaCode ?? ""]} alt={s.fifaCode ?? ""} className="w-full h-full object-contain" />
                ) : (
                  <FlagImage fifaCode={s.fifaCode ?? ""} fallbackEmoji={s.flag} size="sm" />
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-white">{s.name}</p>
                {s.extra2026 > 0 && (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/25 px-1.5 py-0.5 rounded-full">
                    +{s.extra2026} WC26
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {s.confederation && <ConfederationBadge confederation={s.confederation} size="sm" />}
                <p className="text-[11px] text-muted-foreground">
                  {s.extra2026 > 0 ? `${s.years} · 2026` : s.years}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-20 h-2 bg-white/5 rounded-full overflow-hidden hidden sm:block">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(s.goals / maxGoals) * 100}%`, background: "#F5A500" }}
                />
              </div>
              <span className="text-2xl font-black text-[hsl(var(--brand-gold))] w-8 text-right">
                {s.goals}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchMatchStats(): Promise<{ played: number; goals: number; yellows: number; reds: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;
  const { data } = await supabase
    .from("matches")
    .select("status, home_score, away_score")
    .neq("status", "scheduled");

  if (!data) return { played: 0, goals: 0, yellows: 0, reds: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finished = (data as any[]).filter((m: any) => m.status === "finished");
  const played = finished.length;
  const goals = finished.reduce((acc: number, m: any) =>
    acc + (m.home_score ?? 0) + (m.away_score ?? 0), 0);

  return { played, goals, yellows: 0, reds: 0 };
}

async function fetchTopScorers(type = "scorers"): Promise<import("@/services/api-football").AFTopScorer[]> {
  const res = await fetch(`/api/football/topscorers?type=${type}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

/* ── MUNDIAL 2026 TAB ───────────────────────────────────────── */
function Mundial2026Tab() {
  const { data: matchStats } = useQuery({
    queryKey: ["match-stats-summary"],
    queryFn: fetchMatchStats,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const { data: scorers = [], isLoading: scorersLoading } = useQuery({
    queryKey: ["top-scorers"],
    queryFn: () => fetchTopScorers("scorers"),
    staleTime: 3_600_000,
  });

  const { data: assists = [], isLoading: assistsLoading } = useQuery({
    queryKey: ["top-assists"],
    queryFn: () => fetchTopScorers("assists"),
    staleTime: 3_600_000,
  });

  const played = matchStats?.played ?? 0;
  const goals = matchStats?.goals ?? 0;

  const liveStats = [
    { label: "Partidos jugados",   value: String(played), max: 104, pct: Math.round((played / 104) * 100), color: "#3b82f6" },
    { label: "Goles marcados",     value: String(goals),  max: 300, pct: Math.round((goals / 300) * 100),  color: "#F5A500" },
    { label: "Promedio goles/ptdo",value: played > 0 ? (goals / played).toFixed(1) : "—", max: 0, pct: 0, color: "#10b981" },
    { label: "Equipos activos",    value: "48",           max: 48,  pct: 100,                              color: "#8b5cf6" },
  ];

  return (
    <div className="space-y-8">
      {/* Banner */}
      <div className="glass-card rounded-2xl border border-[hsl(var(--brand-blue)/0.3)] p-5 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--brand-blue)/0.08)] to-transparent pointer-events-none" />
        <div className="inline-flex items-center gap-2 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          EN CURSO · DESDE EL 11 DE JUNIO 2026
        </div>
        <p className="text-2xl font-black text-white mb-1">Mundial FIFA 2026</p>
        <p className="text-sm text-muted-foreground">EE.UU. · Canadá · México · 48 equipos · 104 partidos</p>
      </div>

      {/* Live stats grid */}
      <div>
        <SectionTitle icon={TrendingUp} title="Estadísticas del torneo" color="#3b82f6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {liveStats.map((s) => (
            <div key={s.label} className="glass rounded-xl border border-white/5 p-3 text-center">
              <div className="text-3xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-[11px] text-muted-foreground">{s.label}</div>
              {s.max > 0 && (
                <>
                  <div className="mt-2 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${s.pct}%`, background: s.color }} />
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-1">{s.pct}% de {s.max} posibles</div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top scorers from API-Football */}
      <div>
        <SectionTitle icon={Star} title="Tabla de goleadores · WC 2026" color="#F5A500" />
        {scorersLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando datos de API-Football…</span>
          </div>
        ) : scorers.length > 0 ? (
          <div className="space-y-2">
            {scorers.slice(0, 10).map((entry, i) => {
              const stat = entry.statistics[0];
              const goals = stat?.goals?.total ?? 0;
              const teamName = stat?.team?.name ?? "";
              return (
                <div key={entry.player.id} className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                  <img
                    src={entry.player.photo}
                    alt={entry.player.name}
                    width={40} height={40}
                    className="h-10 w-10 rounded-full object-cover border border-white/15 shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.player.name)}&background=1D4ED8&color=fff&size=80&format=svg`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{entry.player.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{teamName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-[hsl(var(--brand-gold))]">{goals}</span>
                    <p className="text-[9px] text-muted-foreground">goles</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">Sin datos disponibles todavía. Los goleadores se actualizan a partir de los primeros partidos.</p>
        )}
      </div>

      {/* Top assists from API-Football */}
      <div>
        <SectionTitle icon={Users} title="Tabla de asistencias · WC 2026" color="#8b5cf6" />
        {assistsLoading ? (
          <div className="flex items-center justify-center py-8 gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Cargando asistencias…</span>
          </div>
        ) : assists.length > 0 ? (
          <div className="space-y-2">
            {assists.slice(0, 10).map((entry, i) => {
              const stat = entry.statistics[0];
              const asst = stat?.goals?.assists ?? 0;
              const teamName = stat?.team?.name ?? "";
              return (
                <div key={entry.player.id} className="glass rounded-xl border border-white/5 p-3 flex items-center gap-3">
                  <span className="text-xs font-bold text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
                  <img
                    src={entry.player.photo}
                    alt={entry.player.name}
                    width={40} height={40}
                    className="h-10 w-10 rounded-full object-cover border border-white/15 shrink-0"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(entry.player.name)}&background=7C3AED&color=fff&size=80&format=svg`;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{entry.player.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{teamName}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-2xl font-black text-violet-400">{asst}</span>
                    <p className="text-[9px] text-muted-foreground">asistencias</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-6">Sin datos disponibles todavía.</p>
        )}
      </div>

      {/* Tournament info */}
      <div>
        <SectionTitle icon={Globe2} title="Datos del torneo" color="#10b981" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: "Equipos", value: "48", sub: "6 confederaciones" },
            { label: "Grupos", value: "12", sub: "A–L, 4 equipos c/u" },
            { label: "Partidos", value: "104", sub: "Fase de grupos + eliminatorias" },
            { label: "Sedes", value: "16", sub: "3 países anfitriones" },
            { label: "Inicio", value: "11 Jun", sub: "Ciudad de México" },
            { label: "Final", value: "19 Jul", sub: "MetLife Stadium, NJ" },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl border border-white/5 p-3">
              <div className="text-xl font-black text-emerald-400 mb-0.5">{s.value}</div>
              <div className="text-xs font-bold text-white">{s.label}</div>
              <div className="text-[10px] text-muted-foreground">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── RÉCORDS TAB ────────────────────────────────────────────── */
function RecordsTab() {
  return (
    <div className="space-y-6">
      <div>
        <SectionTitle icon={AlertTriangle} title="Récords vulnerables en 2026" color="#ef4444" />
        <p className="text-xs text-muted-foreground mb-4">Récords históricos que podrían romperse o igualarse en el Mundial 2026</p>
        <div className="space-y-3">
          {RECORDS_2026.filter(r => r.vulnerable).map((rec, i) => (
            <motion.div
              key={rec.record}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="glass rounded-xl border border-red-500/20 bg-red-500/5 p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider">{rec.category}</span>
                  <p className="text-sm font-bold text-white mt-0.5">{rec.record}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 shrink-0 whitespace-nowrap">
                  En riesgo
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Actual</p>
                  <p className="text-xs font-semibold text-white">{rec.holder}</p>
                  <p className="text-xs text-[hsl(var(--brand-gold))]">{rec.value}</p>
                </div>
                {rec.challengedBy && (
                  <div>
                    <p className="text-[10px] text-muted-foreground">Candidato a romperlo</p>
                    <p className="text-xs font-semibold text-red-400">{rec.challengedBy}</p>
                  </div>
                )}
              </div>
              {rec.context && (
                <p className="text-[11px] text-muted-foreground italic">{rec.context}</p>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <SectionTitle icon={Trophy} title="Récords históricos sólidos" color="#F5A500" />
        <div className="space-y-2">
          {RECORDS_2026.filter(r => !r.vulnerable).map((rec, i) => (
            <div key={rec.record} className="glass rounded-xl border border-white/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-[hsl(var(--brand-gold))] uppercase tracking-wider">{rec.category}</span>
                  <p className="text-xs font-bold text-white mt-0.5">{rec.record}</p>
                  <p className="text-xs text-muted-foreground">{rec.holder} — <span className="text-white">{rec.value}</span></p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground border border-white/10 shrink-0 whitespace-nowrap">
                  Sólido
                </span>
              </div>
              {rec.context && (
                <p className="text-[11px] text-muted-foreground italic mt-1.5">{rec.context}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── PAGE ───────────────────────────────────────────────────── */
export default function EstadisticasPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1 text-xs font-semibold border border-[hsl(var(--brand-gold)/0.3)] text-[hsl(var(--brand-gold))] mb-3">
          <TrendingUp className="h-3 w-3" />
          DATOS HISTÓRICOS FIFA
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-1">
          <span className="text-gradient-gold">Estadísticas</span>
        </h1>
        <p className="text-muted-foreground text-sm">Mundial FIFA desde 1930 hasta 2022 · 22 ediciones · {WC_EDITIONS.reduce((s, e) => s + e.totalGoals, 0).toLocaleString()} goles históricos</p>
      </motion.div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { label: "Ediciones",       value: "22",    color: "#3b82f6" },
          { label: "Países campeones", value: "8",    color: "#F5A500" },
          { label: "Goles totales",   value: "2,548", color: "#10b981" },
          { label: "Años de historia","value": "96",  color: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="glass rounded-xl border border-white/5 p-3 text-center">
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="mundial2026">
        <TabsList className="mb-6 glass border border-border/30 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="mundial2026" className="gap-1.5 text-xs">
            <Zap className="h-3.5 w-3.5" />
            Mundial 2026
          </TabsTrigger>
          <TabsTrigger value="campeones" className="gap-1.5 text-xs">
            <Trophy className="h-3.5 w-3.5" />
            Campeones
          </TabsTrigger>
          <TabsTrigger value="historial" className="gap-1.5 text-xs">
            <Clock className="h-3.5 w-3.5" />
            Historial
          </TabsTrigger>
          <TabsTrigger value="goleadores" className="gap-1.5 text-xs">
            <Star className="h-3.5 w-3.5" />
            Goleadores
          </TabsTrigger>
          <TabsTrigger value="records" className="gap-1.5 text-xs">
            <AlertTriangle className="h-3.5 w-3.5" />
            Récords 2026
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mundial2026"><Mundial2026Tab /></TabsContent>
        <TabsContent value="campeones"><CampeonesTab /></TabsContent>
        <TabsContent value="historial"><HistorialTab /></TabsContent>
        <TabsContent value="goleadores"><GoladoresTab /></TabsContent>
        <TabsContent value="records"><RecordsTab /></TabsContent>
      </Tabs>
    </div>
  );
}
