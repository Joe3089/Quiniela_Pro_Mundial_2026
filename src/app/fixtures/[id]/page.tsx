"use client";

import { use, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Users, Loader2, Gavel, Play, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useMatch } from "@/features/fixtures/hooks/use-fixtures";
import { FlagImage } from "@/components/ui/flag-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFormatDate } from "@/hooks/use-format-date";
import { MATCH_STATUS_LABELS } from "@/constants";

// ── Types ──────────────────────────────────────────────────────────────────────
type DetailEvent = {
  minute: number; minuteExtra: number | null; teamName: string;
  teamLogo: string | null; playerName: string; assistName: string | null;
  type: string; detail: string;
};
type DetailPlayer = {
  id: number; name: string; number: number; position: string;
  grid: string | null; captain?: boolean;
};
type DetailLineup = {
  teamId: string | null; teamName: string; teamLogo: string | null;
  formation: string | null; coach: string | null;
  starters: DetailPlayer[]; substitutes: DetailPlayer[];
};
type MatchDetail = {
  referee: string | null; refereeCountry: string | null;
  lineups: { home: DetailLineup | null; away: DetailLineup | null };
  events: DetailEvent[];
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const POS_COLORS: Record<string, string> = {
  G:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  GK:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  D:   "bg-blue-500/20 text-blue-400 border-blue-500/30",
  DEF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  M:   "bg-green-500/20 text-green-400 border-green-500/30",
  MID: "bg-green-500/20 text-green-400 border-green-500/30",
  F:   "bg-red-500/20 text-red-400 border-red-500/30",
  FWD: "bg-red-500/20 text-red-400 border-red-500/30",
};
const posColor = (pos: string) => POS_COLORS[pos] ?? "bg-white/5 text-white/40 border-white/10";

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function eventIcon(type: string, detail: string) {
  if (type === "Goal") {
    if (detail === "Own Goal") return "🔴";
    return "⚽";
  }
  if (type === "Card") {
    if (detail === "Red Card" || detail === "Second Yellow card") return "🟥";
    return "🟨";
  }
  if (type === "subst") return "🔄";
  return "•";
}

function minuteStr(ev: DetailEvent) {
  if (ev.minuteExtra) return `${ev.minute}+${ev.minuteExtra}`;
  return `${ev.minute}`;
}

// ── Events Timeline (inline in score card) ─────────────────────────────────────
function EventsTimeline({
  events,
  homeTeamName,
  awayTeamName,
}: {
  events: DetailEvent[];
  homeTeamName: string;
  awayTeamName: string;
}) {
  if (!events.length) return null;

  // Build rows: one per event entry (subs have OUT+IN on same "group")
  type Row = {
    minute: number; minuteStr: string;
    home: { lines: string[]; icon: string } | null;
    away: { lines: string[]; icon: string } | null;
  };

  const rows: Row[] = [];
  for (const ev of events) {
    const isHome = ev.teamName === homeTeamName ||
      homeTeamName.toLowerCase().includes(ev.teamName.toLowerCase()) ||
      ev.teamName.toLowerCase().includes(homeTeamName.toLowerCase());

    let lines: string[] = [];
    const icon = eventIcon(ev.type, ev.detail);

    if (ev.type === "subst") {
      lines = [`OUT: ${ev.assistName ?? "?"}`, `IN: ${ev.playerName}`];
    } else if (ev.type === "Goal") {
      const penLabel = ev.detail === "Penalty" ? " (Pen.)" : ev.detail === "Own Goal" ? " (PP)" : "";
      lines = [`${ev.playerName}${penLabel}`];
      if (ev.assistName) lines.push(`Asist: ${ev.assistName}`);
    } else {
      lines = [ev.playerName];
    }

    rows.push({
      minute: ev.minute + (ev.minuteExtra ?? 0) / 100,
      minuteStr: minuteStr(ev),
      home: isHome ? { lines, icon } : null,
      away: !isHome ? { lines, icon } : null,
    });
  }

  rows.sort((a, b) => a.minute - b.minute);

  return (
    <div className="mt-4 pt-4 border-t border-white/8">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-2">
        Eventos
      </p>
      <div className="space-y-1">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-start min-h-[18px]">
            {/* Home side (right-aligned) */}
            <div className="text-right">
              {row.home && (
                <div>
                  <span className="text-xs text-white/90 leading-snug">
                    {row.home.lines[0]}
                  </span>
                  {row.home.lines.slice(1).map((l, j) => (
                    <div key={j} className="text-[10px] text-muted-foreground">{l}</div>
                  ))}
                </div>
              )}
            </div>
            {/* Minute + icon (center) */}
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">{row.minuteStr}&apos;</span>
              <span className="text-xs leading-none">
                {row.home?.icon ?? row.away?.icon}
              </span>
            </div>
            {/* Away side (left-aligned) */}
            <div>
              {row.away && (
                <div>
                  <span className="text-xs text-white/90 leading-snug">
                    {row.away.lines[0]}
                  </span>
                  {row.away.lines.slice(1).map((l, j) => (
                    <div key={j} className="text-[10px] text-muted-foreground">{l}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player Row ─────────────────────────────────────────────────────────────────
function PlayerRow({
  player,
  side,
}: {
  player: DetailPlayer;
  side: "home" | "away";
}) {
  const ini = initials(player.name);
  const pos = player.position?.toUpperCase() ?? "";

  return (
    <div className={cn("flex items-center gap-1.5 py-0.5 text-xs", side === "away" && "flex-row-reverse")}>
      {/* Avatar */}
      <div className={cn(
        "h-[22px] w-[22px] rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border",
        posColor(pos)
      )}>
        {ini}
      </div>
      <span className={cn("text-white/90 font-medium truncate flex-1", side === "away" && "text-right")}>
        {player.name}
      </span>
      {pos && (
        <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded border shrink-0", posColor(pos))}>
          {pos}
        </span>
      )}
      {player.captain && (
        <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">
          C
        </span>
      )}
    </div>
  );
}

// ── Sub Row ────────────────────────────────────────────────────────────────────
function SubRow({
  subOut,
  subIn,
  minute,
  side,
}: {
  subOut: string; subIn: string; minute: string; side: "home" | "away";
}) {
  const ini = initials(subIn);
  return (
    <div className={cn("flex items-center gap-1.5 py-0.5 text-[10px] text-muted-foreground", side === "away" && "flex-row-reverse")}>
      <div className="h-[18px] w-[18px] rounded-full bg-white/8 flex items-center justify-center text-[8px] font-bold shrink-0 border border-white/10">
        {ini}
      </div>
      <div className={cn("flex-1 min-w-0", side === "away" && "text-right")}>
        <span className="text-emerald-400 font-medium">{subIn}</span>
        <span className="mx-1 opacity-40">↑</span>
        <span className="line-through opacity-50">{subOut}</span>
      </div>
      <span className="shrink-0 font-bold text-[9px]">{minute}&apos;</span>
    </div>
  );
}

// ── Lineup Column ─────────────────────────────────────────────────────────────
function LineupCol({
  lineup,
  subsUsed,
  side,
}: {
  lineup: DetailLineup;
  subsUsed: { subOut: string; subIn: string; minute: string }[];
  side: "home" | "away";
}) {
  return (
    <div className={cn("flex-1 min-w-0", side === "away" && "text-right")}>
      {/* Team header */}
      <div className={cn("flex items-center gap-2 mb-3", side === "away" ? "justify-end flex-row-reverse" : "justify-start")}>
        {lineup.teamLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={lineup.teamLogo} alt="" width={24} height={24} className="h-6 w-6 object-contain shrink-0" />
        ) : null}
        <div className={side === "away" ? "text-right" : "text-left"}>
          <p className="font-bold text-sm text-white leading-tight">{lineup.teamName}</p>
          {lineup.formation && (
            <p className="text-[10px] text-muted-foreground">{lineup.formation}</p>
          )}
        </div>
      </div>

      {/* XI Titular */}
      <p className={cn(
        "text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-1.5",
        side === "away" && "text-right"
      )}>XI Titular</p>
      <div className="space-y-0.5 mb-3">
        {lineup.starters.map((p) => (
          <PlayerRow key={p.id} player={p} side={side} />
        ))}
      </div>

      {/* Cambios utilizados */}
      {subsUsed.length > 0 && (
        <>
          <p className={cn(
            "text-[10px] font-black tracking-widest uppercase text-violet-400 mb-1.5",
            side === "away" && "text-right"
          )}>Cambios Utilizados</p>
          <div className="space-y-0.5">
            {subsUsed.map((s, i) => (
              <SubRow key={i} {...s} side={side} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Country flag by name ───────────────────────────────────────────────────────
function CountryFlag({ country }: { country: string | null }) {
  if (!country) return <div className="h-4 w-6 rounded bg-white/10 border border-white/10" />;

  const CODE_MAP: Record<string, string> = {
    England: "ENG", Germany: "GER", France: "FRA", Spain: "ESP", Italy: "ITA",
    Argentina: "ARG", Brazil: "BRA", Netherlands: "NED", Portugal: "POR",
    "United States": "USA", Mexico: "MEX", Australia: "AUS", Japan: "JPN",
    Morocco: "MAR", Sweden: "SWE", Uruguay: "URU", Colombia: "COL",
    Senegal: "SEN", Norway: "NOR", "South Africa": "RSA", Canada: "CAN",
    Switzerland: "SUI", Belgium: "BEL", Turkey: "TUR", Austria: "AUT",
    Croatia: "CRO", Ghana: "GHA", Panama: "PAN", Ecuador: "ECU",
    "Saudi Arabia": "KSA", Iran: "IRN", Czechia: "CZE", Poland: "POL",
    "South Korea": "KOR", Serbia: "SRB", Ukraine: "UKR", "New Zealand": "NZL",
  };
  const code = CODE_MAP[country] ?? null;

  return code ? (
    <FlagImage fifaCode={code} fallbackEmoji="🏳️" size="sm" className="rounded" />
  ) : (
    <span className="text-[10px] text-muted-foreground">{country.substring(0, 3).toUpperCase()}</span>
  );
}

// ── Terna Arbitral ─────────────────────────────────────────────────────────────
function TernaArbitral({
  referee,
  refereeCountry,
}: {
  referee: string | null;
  refereeCountry: string | null;
}) {
  const officials = [
    { label: "Árbitro Principal", name: referee, country: refereeCountry },
    { label: "Asistente 1", name: null, country: null },
    { label: "Asistente 2", name: null, country: null },
    { label: "Cuarto Árbitro", name: null, country: null },
    { label: "VAR", name: null, country: null },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="glass-card rounded-2xl border border-white/8 overflow-hidden"
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
          <Gavel className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <h2 className="font-bold text-sm">Terna Arbitral</h2>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {officials.map((off, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 text-center">
              <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60">{off.label}</p>
              <CountryFlag country={off.country} />
              <p className="text-xs font-semibold text-white/90 leading-tight">
                {off.name ?? "N/D"}
              </p>
              {off.country && (
                <p className="text-[9px] text-muted-foreground">{off.country}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: match, isLoading } = useMatch(id);
  const { formatDateShort, formatTime } = useFormatDate();
  const [detail, setDetail] = useState<MatchDetail | null>(null);

  useEffect(() => {
    if (!match) return;
    if (match.status !== "finished" && match.status !== "live") return;
    fetch(`/api/matches/${id}/detail`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => d && setDetail(d))
      .catch(() => null);
  }, [id, match]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">Partido no encontrado</p>
        <Link href="/fixtures" className="mt-4 inline-flex items-center gap-1.5 text-sm text-[hsl(var(--brand-blue-light))]">
          <ArrowLeft className="h-4 w-4" /> Volver a Partidos
        </Link>
      </div>
    );
  }

  const isLive = match.status === "live";
  const isFinished = match.status === "finished";
  const hasScore = match.home_score !== null && match.away_score !== null;

  const homeTeamName = detail?.lineups.home?.teamName ?? match.home_team?.name ?? "";
  const awayTeamName = detail?.lineups.away?.teamName ?? match.away_team?.name ?? "";

  // Build substitution maps from events
  function getSubsUsed(teamName: string) {
    if (!detail?.events) return [];
    return detail.events
      .filter((e) => e.type === "subst" && (
        e.teamName === teamName ||
        teamName.toLowerCase().includes(e.teamName.toLowerCase()) ||
        e.teamName.toLowerCase().includes(teamName.toLowerCase())
      ))
      .map((e) => ({
        subOut: e.assistName ?? "?",
        subIn: e.playerName,
        minute: minuteStr(e),
      }));
  }

  const homeSubsUsed = getSubsUsed(homeTeamName);
  const awaySubsUsed = getSubsUsed(awayTeamName);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/fixtures"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Partidos
      </Link>

      {/* ── Score Hero ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/8 p-6 mb-5"
      >
        {/* Phase + Group + Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.group && (
              <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                {match.group.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {match.phase?.replace(/_/g, " ")}
            </span>
          </div>
          <Badge variant={isLive ? "live" : isFinished ? "secondary" : "outline"} className="text-[10px] h-5">
            {isLive ? "● EN VIVO" : MATCH_STATUS_LABELS[match.status]}
          </Badge>
        </div>

        {/* Teams + Score */}
        <div className="flex items-center gap-4">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <FlagImage fifaCode={match.home_team?.fifa_code ?? ""} fallbackEmoji="🏳️" size="xl" className="rounded-xl shadow-lg" />
            <p className="font-bold text-sm text-white text-center leading-tight">{match.home_team?.name ?? "Por definir"}</p>
            <p className="text-[10px] text-muted-foreground">{match.home_team?.fifa_code}</p>
          </div>

          {/* Score */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {hasScore ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn("text-4xl font-black tabular-nums", isLive && "text-red-400")}>{match.home_score}</span>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <span className={cn("text-4xl font-black tabular-nums", isLive && "text-red-400")}>{match.away_score}</span>
                </div>
                {match.home_score_penalties !== null && (
                  <p className="text-[10px] text-muted-foreground">Pen: {match.home_score_penalties} – {match.away_score_penalties}</p>
                )}
                {isLive && match.elapsed && (
                  <span className="text-xs font-bold text-red-400 animate-pulse">{match.elapsed}&apos;</span>
                )}
              </>
            ) : (
              <>
                <span className="text-2xl font-bold text-muted-foreground">vs</span>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(match.match_date)}</span>
                </div>
              </>
            )}
            <div className="text-[10px] text-muted-foreground text-center mt-1">{formatDateShort(match.match_date)}</div>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <FlagImage fifaCode={match.away_team?.fifa_code ?? ""} fallbackEmoji="🏳️" size="xl" className="rounded-xl shadow-lg" />
            <p className="font-bold text-sm text-white text-center leading-tight">{match.away_team?.name ?? "Por definir"}</p>
            <p className="text-[10px] text-muted-foreground">{match.away_team?.fifa_code}</p>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{match.venue}{match.city ? `, ${match.city}` : ""}</span>
          </div>
        )}

        {/* Events timeline inline */}
        {(isFinished || isLive) && detail?.events && detail.events.length > 0 && (
          <EventsTimeline
            events={detail.events}
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
          />
        )}
      </motion.div>

      {/* ── Alineaciones ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden mb-5"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h2 className="font-bold text-sm">Alineaciones</h2>
        </div>

        <div className="p-4">
          {detail?.lineups.home || detail?.lineups.away ? (
            <div className="flex gap-4 items-start">
              {detail.lineups.home ? (
                <LineupCol lineup={detail.lineups.home} subsUsed={homeSubsUsed} side="home" />
              ) : (
                <div className="flex-1 text-center text-xs text-muted-foreground py-4">
                  {match.home_team?.name ?? "Local"}: alineación no disponible
                </div>
              )}
              <div className="w-px bg-white/8 self-stretch shrink-0" />
              {detail.lineups.away ? (
                <LineupCol lineup={detail.lineups.away} subsUsed={awaySubsUsed} side="away" />
              ) : (
                <div className="flex-1 text-center text-xs text-muted-foreground py-4">
                  {match.away_team?.name ?? "Visitante"}: alineación no disponible
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              <FallbackLineupCol teamRow={match.home_team} side="home" />
              <div className="w-px bg-white/8 self-stretch shrink-0" />
              <FallbackLineupCol teamRow={match.away_team} side="away" />
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Terna Arbitral ─────────────────────────────────────────────────── */}
      {(isFinished || isLive) && (
        <TernaArbitral
          referee={detail?.referee ?? null}
          refereeCountry={detail?.refereeCountry ?? null}
        />
      )}

      {/* ── Videos del Partido ─────────────────────────────────────────────── */}
      <FifaVideosCard matchId={match.id} />
    </div>
  );
}

// ── Videos del Partido Card ───────────────────────────────────────────────────
type MatchVideo = {
  id: string; match_id: string; youtube_video_id: string;
  title: string; type: "highlights" | "preview";
  thumbnail_url: string | null; published_at: string | null;
  channel_source: string | null; duration_seconds: number | null;
};

function VideoPlayer({ video }: { video: MatchVideo }) {
  const [mode, setMode] = useState<"thumb" | "embed" | "external">("thumb");

  const thumbUrl = video.thumbnail_url ?? `https://i.ytimg.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${video.youtube_video_id}?autoplay=1&rel=0`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.youtube_video_id}`;
  const label = video.type === "highlights" ? "Ver Match Highlights" : "Ver Match Preview";

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-2.5">
      {/* Type badge + channel source */}
      <div className="flex items-center gap-2">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded",
          video.type === "highlights"
            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
            : "bg-blue-500/15 text-blue-400 border border-blue-500/20"
        )}>
          {video.type === "highlights" ? "Match Highlights" : "Match Preview"}
        </span>
        {video.channel_source && (
          <span className="text-[9px] text-muted-foreground/50 font-medium">{video.channel_source}</span>
        )}
      </div>

      {/* Embed or thumbnail */}
      {mode === "embed" ? (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingBottom: "56.25%" }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={embedUrl}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            onError={() => setMode("external")}
          />
        </div>
      ) : (
        <button
          onClick={() => setMode("embed")}
          className="relative w-full rounded-xl overflow-hidden group focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label={label}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={thumbUrl}
            alt={video.title}
            className="w-full object-cover aspect-video"
            loading="lazy"
          />
          {/* Duration badge */}
          {video.duration_seconds != null && (
            <span className="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {formatDuration(video.duration_seconds)}
            </span>
          )}
          <div className="absolute inset-0 bg-black/35 flex flex-col items-center justify-center gap-2 group-hover:bg-black/20 transition-colors">
            <div className="h-14 w-14 rounded-full bg-red-600 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <Play className="h-6 w-6 text-white fill-white ml-0.5" />
            </div>
            <span className="text-white text-xs font-bold bg-black/50 px-3 py-1 rounded-full">
              {label}
            </span>
          </div>
        </button>
      )}

      {/* Meta + external link */}
      <div className="space-y-1">
        <p className="text-xs font-semibold text-white/90 leading-snug line-clamp-2">{video.title}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {video.published_at && (
              <span className="text-[10px] text-muted-foreground">
                {new Date(video.published_at).toLocaleDateString("es", {
                  day: "numeric", month: "short", year: "numeric",
                })}
              </span>
            )}
            {video.duration_seconds != null && (
              <span className="text-[10px] text-muted-foreground">
                {formatDuration(video.duration_seconds)}
              </span>
            )}
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-red-400 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Ver en YouTube
          </a>
        </div>
      </div>
    </div>
  );
}

function FifaVideosCard({ matchId }: { matchId: string }) {
  const [videos, setVideos] = useState<MatchVideo[]>([]);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/videos`)
      .then((r) => r.ok ? r.json() : [])
      .then((d) => Array.isArray(d) ? setVideos(d) : null)
      .catch(() => null);
  }, [matchId]);

  if (!videos.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
      className="glass-card rounded-2xl border border-white/8 overflow-hidden mb-5"
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
          <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        </div>
        <h2 className="font-bold text-sm">Videos del Partido</h2>
        <span className="ml-auto text-[9px] text-muted-foreground/50 font-medium uppercase tracking-wide">Canales Oficiales</span>
      </div>

      <div className="p-4 space-y-5 divide-y divide-white/5">
        {videos.map((video, i) => (
          <div key={video.id} className={i > 0 ? "pt-5" : ""}>
            <VideoPlayer video={video} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ── Fallback Lineup (from local wc2026-teams data) ──────────────────────────
import { getTeamByCode } from "@/data/wc2026-teams";
import type { TeamRow } from "@/types/database";
import type { WCPlayer } from "@/data/wc2026-teams";

const positionColors: Record<string, string> = {
  GK:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DEF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MID: "bg-green-500/20 text-green-400 border-green-500/30",
  FWD: "bg-red-500/20 text-red-400 border-red-500/30",
};

function isStarter(p: WCPlayer, xi: string[]): boolean {
  const full = p.name.toLowerCase();
  return xi.some((n) => {
    const nl = n.toLowerCase();
    return full.includes(nl) || nl.includes(full.split(" ").pop() ?? "");
  });
}

function FallbackLineupCol({ teamRow, side }: { teamRow: TeamRow | null; side: "home" | "away" }) {
  const wcTeam = teamRow?.fifa_code ? getTeamByCode(teamRow.fifa_code) : null;
  if (!wcTeam || wcTeam.rosterPublished === false) {
    return (
      <div className="flex-1 min-w-0 text-center">
        <FlagImage fifaCode={teamRow?.fifa_code ?? ""} fallbackEmoji="🏳️" size="md" className="rounded-md mx-auto mb-2" />
        <p className="font-bold text-sm text-white mb-1">{teamRow?.name ?? "Por definir"}</p>
        <p className="text-xs text-muted-foreground">Alineación no disponible</p>
      </div>
    );
  }

  const starters = wcTeam.players.filter((p) => isStarter(p, wcTeam.xi));
  const displayStarters = starters.length > 0 ? starters : wcTeam.xi.map((name) => ({ name } as WCPlayer));

  return (
    <div className={cn("flex-1 min-w-0", side === "away" && "text-right")}>
      <div className={cn("flex items-center gap-2 mb-3", side === "away" ? "justify-end flex-row-reverse" : "justify-start")}>
        <FlagImage fifaCode={wcTeam.code} fallbackEmoji={wcTeam.flag} size="md" className="rounded-md shrink-0" />
        <div className={side === "away" ? "text-right" : "text-left"}>
          <p className="font-bold text-sm text-white">{wcTeam.name}</p>
          <p className="text-[10px] text-muted-foreground">{wcTeam.formation}</p>
        </div>
      </div>
      <p className={cn("text-[10px] font-black tracking-widest uppercase text-emerald-400 mb-1.5", side === "away" && "text-right")}>
        XI Titular
      </p>
      <div className="space-y-0.5">
        {displayStarters.map((p, i) => {
          const pos = "position" in p ? (p as WCPlayer).position : undefined;
          const ini = initials(p.name);
          const col = pos ? positionColors[pos] : "bg-white/5 text-white/40 border-white/10";
          return (
            <div key={i} className={cn("flex items-center gap-1.5 py-0.5 text-xs", side === "away" && "flex-row-reverse")}>
              <div className={cn("h-[22px] w-[22px] rounded-md flex items-center justify-center text-[9px] font-black shrink-0 border", col)}>
                {ini}
              </div>
              <span className={cn("text-white/90 font-medium truncate flex-1", side === "away" && "text-right")}>{p.name}</span>
              {pos && (
                <span className={cn("text-[8px] font-bold px-1 py-0.5 rounded border shrink-0", col)}>{pos}</span>
              )}
              {"isCaptain" in p && p.isCaptain && (
                <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
