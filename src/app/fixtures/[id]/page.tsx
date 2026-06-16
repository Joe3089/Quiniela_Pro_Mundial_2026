"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, MapPin, Users, Loader2, Goal } from "lucide-react";
import Link from "next/link";
import { useMatch, useMatchEvents } from "@/features/fixtures/hooks/use-fixtures";
import { getTeamByCode } from "@/data/wc2026-teams";
import { FlagImage } from "@/components/ui/flag-image";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFormatDate } from "@/hooks/use-format-date";
import { MATCH_STATUS_LABELS } from "@/constants";
import type { TeamRow } from "@/types/database";
import type { WCPlayer } from "@/data/wc2026-teams";

const positionColors = {
  GK:  "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  DEF: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  MID: "bg-green-500/20 text-green-400 border-green-500/30",
  FWD: "bg-red-500/20 text-red-400 border-red-500/30",
};

function playerPhoto(p: WCPlayer): string {
  if (p.photo) return p.photo;
  if (p.apiFootballId) return `https://media.api-sports.io/football/players/${p.apiFootballId}.png`;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=1D4ED8&color=fff&size=64&bold=true&format=svg`;
}

function isStarter(p: WCPlayer, xi: string[]): boolean {
  const full = p.name.toLowerCase();
  return xi.some((n) => {
    const nl = n.toLowerCase();
    return full.includes(nl) || nl.includes(full.split(" ").pop() ?? "");
  });
}

type MatchEvent = {
  id: string; type: string; player_name: string; minute: number; minute_extra: number;
  assist_name: string | null; team_id: string | null;
};

function eventIcon(type: string) {
  if (type === "goal") return "⚽";
  if (type === "own_goal") return "🔴";
  if (type === "penalty") return "⚽";
  if (type === "yellow_card") return "🟨";
  if (type === "red_card") return "🟥";
  if (type === "substitution") return "🔄";
  return "•";
}

function minuteLabel(ev: MatchEvent) {
  return ev.minute_extra > 0 ? `${ev.minute}+${ev.minute_extra}'` : `${ev.minute}'`;
}

function GoalsSection({
  events,
  homeTeamId,
  awayTeamId,
}: {
  events: MatchEvent[];
  homeTeamId: string | null;
  awayTeamId: string | null;
}) {
  const scoringTypes = ["goal", "own_goal", "penalty"];
  const goals = events.filter((e) => scoringTypes.includes(e.type));
  if (!goals.length) return null;

  const homeGoals = goals.filter((e) => e.team_id === homeTeamId);
  const awayGoals = goals.filter((e) => e.team_id === awayTeamId);
  const unassigned = goals.filter((e) => !e.team_id || (e.team_id !== homeTeamId && e.team_id !== awayTeamId));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="glass-card rounded-2xl border border-white/8 overflow-hidden mb-5"
    >
      <div className="p-4 border-b border-white/5 flex items-center gap-2">
        <div className="h-7 w-7 rounded-lg bg-yellow-500/15 flex items-center justify-center">
          <Goal className="h-3.5 w-3.5 text-yellow-400" />
        </div>
        <h2 className="font-bold text-sm">Goles</h2>
      </div>
      <div className="p-4">
        <div className="flex gap-4">
          {/* Home goals */}
          <div className="flex-1 space-y-1">
            {homeGoals.map((ev) => (
              <div key={ev.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-base leading-none">{eventIcon(ev.type)}</span>
                <span className="text-white/90 font-medium truncate">{ev.player_name}</span>
                {ev.type === "penalty" && (
                  <span className="text-[9px] font-bold px-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">P</span>
                )}
                {ev.type === "own_goal" && (
                  <span className="text-[9px] font-bold px-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">OG</span>
                )}
                <span className="text-muted-foreground shrink-0 ml-auto">{minuteLabel(ev)}</span>
              </div>
            ))}
            {homeGoals.length === 0 && <p className="text-xs text-muted-foreground/50 italic">—</p>}
          </div>
          {/* Divider */}
          <div className="w-px bg-white/8 self-stretch shrink-0" />
          {/* Away goals */}
          <div className="flex-1 space-y-1">
            {awayGoals.map((ev) => (
              <div key={ev.id} className="flex items-center gap-1.5 text-xs flex-row-reverse">
                <span className="text-base leading-none">{eventIcon(ev.type)}</span>
                <span className="text-white/90 font-medium truncate text-right">{ev.player_name}</span>
                {ev.type === "penalty" && (
                  <span className="text-[9px] font-bold px-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">P</span>
                )}
                {ev.type === "own_goal" && (
                  <span className="text-[9px] font-bold px-1 rounded bg-red-500/20 text-red-300 border border-red-500/30 shrink-0">OG</span>
                )}
                <span className="text-muted-foreground shrink-0 mr-auto">{minuteLabel(ev)}</span>
              </div>
            ))}
            {awayGoals.length === 0 && <p className="text-xs text-muted-foreground/50 italic text-right">—</p>}
          </div>
        </div>
        {unassigned.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/5 space-y-1">
            {unassigned.map((ev) => (
              <div key={ev.id} className="flex items-center gap-1.5 text-xs">
                <span>{eventIcon(ev.type)}</span>
                <span className="text-white/90">{ev.player_name}</span>
                <span className="text-muted-foreground ml-auto">{minuteLabel(ev)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LineupColumn({
  teamRow,
  side,
}: {
  teamRow: TeamRow | null;
  side: "home" | "away";
}) {
  const wcTeam = teamRow?.fifa_code ? getTeamByCode(teamRow.fifa_code) : null;
  if (!wcTeam || wcTeam.rosterPublished === false) {
    return (
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-3 justify-center">
          <FlagImage fifaCode={teamRow?.fifa_code ?? ""} fallbackEmoji="🏳️" size="md" className="rounded-md" />
          <span className="font-bold text-sm text-white">{teamRow?.name ?? "TBD"}</span>
        </div>
        <p className="text-center text-xs text-muted-foreground">Alineación no disponible</p>
      </div>
    );
  }

  const starters = wcTeam.players.filter((p) => isStarter(p, wcTeam.xi));
  const subs = wcTeam.players.filter((p) => !isStarter(p, wcTeam.xi));
  const displayStarters = starters.length > 0 ? starters : wcTeam.xi.map((name) => ({ name } as WCPlayer));

  return (
    <div className={cn("flex-1 min-w-0", side === "away" && "text-right")}>
      {/* Team header */}
      <div className={cn("flex items-center gap-2 mb-3", side === "away" ? "justify-end flex-row-reverse" : "justify-start")}>
        <FlagImage fifaCode={wcTeam.code} fallbackEmoji={wcTeam.flag} size="md" className="rounded-md shrink-0" />
        <div className={side === "away" ? "text-right" : "text-left"}>
          <p className="font-bold text-sm text-white">{wcTeam.name}</p>
          <p className="text-[10px] text-muted-foreground">{wcTeam.formation}</p>
        </div>
      </div>

      {/* XI Titular */}
      <div className="mb-2">
        <p className={cn(
          "text-[10px] font-bold tracking-widest uppercase text-emerald-400 mb-1.5",
          side === "away" && "text-right"
        )}>XI Titular</p>
        <div className="space-y-1">
          {displayStarters.map((p, i) => (
            <PlayerMini key={i} player={"position" in p ? p as WCPlayer : null} name={p.name} side={side} isStarter />
          ))}
        </div>
      </div>

      {/* Suplentes */}
      {subs.length > 0 && (
        <div className="mt-3 pt-2 border-t border-white/5">
          <p className={cn(
            "text-[10px] font-bold tracking-widest uppercase text-violet-400 mb-1.5",
            side === "away" && "text-right"
          )}>Suplentes</p>
          <div className="space-y-1">
            {subs.map((p, i) => (
              <PlayerMini key={i} player={p} name={p.name} side={side} isStarter={false} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerMini({
  player,
  name,
  side,
  isStarter,
}: {
  player: WCPlayer | null;
  name: string;
  side: "home" | "away";
  isStarter: boolean;
}) {
  const posColors = player?.position ? positionColors[player.position] : "bg-white/5 text-white/40 border-white/10";

  const inner = (
    <>
      {player ? (
        <img
          src={playerPhoto(player)}
          alt={name}
          width={22}
          height={22}
          className="h-[22px] w-[22px] rounded-md object-cover border border-white/10 shrink-0"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1D4ED8&color=fff&size=64&bold=true&format=svg`;
          }}
        />
      ) : (
        <div className="h-[22px] w-[22px] rounded-md bg-white/5 border border-white/10 shrink-0" />
      )}
      <span className={cn(
        "text-[11px] font-medium text-white/90 truncate",
        side === "away" && "text-right"
      )}>{name}</span>
      {player?.position && (
        <span className={cn("text-[8px] font-bold px-1 rounded border shrink-0", posColors)}>
          {player.position}
        </span>
      )}
      {player?.isCaptain && (
        <span className="text-[8px] font-bold px-1 rounded bg-[hsl(var(--brand-gold)/0.2)] text-[hsl(var(--brand-gold))] border border-[hsl(var(--brand-gold)/0.3)] shrink-0">C</span>
      )}
    </>
  );

  return (
    <div className={cn(
      "flex items-center gap-1.5 py-0.5",
      side === "away" && "flex-row-reverse"
    )}>
      {inner}
    </div>
  );
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: match, isLoading } = useMatch(id);
  const { data: events = [] } = useMatchEvents(id);
  const { formatDateShort, formatTime } = useFormatDate();

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

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href="/fixtures"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Partidos
      </Link>

      {/* Hero: score card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl border border-white/8 p-6 mb-5"
      >
        {/* Phase + Group */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {match.group && (
              <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full border border-white/8">
                {match.group.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground capitalize">
              {match.phase.replace(/_/g, " ")}
            </span>
          </div>
          <Badge
            variant={isLive ? "live" : isFinished ? "secondary" : "outline"}
            className="text-[10px] h-5"
          >
            {isLive ? "● EN VIVO" : MATCH_STATUS_LABELS[match.status]}
          </Badge>
        </div>

        {/* Teams row */}
        <div className="flex items-center gap-4">
          {/* Home */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <FlagImage
              fifaCode={match.home_team?.fifa_code ?? ""}
              fallbackEmoji="🏳️"
              size="xl"
              className="rounded-xl shadow-lg"
            />
            <p className="font-bold text-sm text-white text-center leading-tight">
              {match.home_team?.name ?? "Por definir"}
            </p>
            <p className="text-[10px] text-muted-foreground">{match.home_team?.short_name}</p>
          </div>

          {/* Score / VS */}
          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {hasScore ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn("text-4xl font-black tabular-nums", isLive && "text-red-400")}>
                    {match.home_score}
                  </span>
                  <span className="text-2xl text-muted-foreground">-</span>
                  <span className={cn("text-4xl font-black tabular-nums", isLive && "text-red-400")}>
                    {match.away_score}
                  </span>
                </div>
                {match.home_score_penalties !== null && (
                  <p className="text-[10px] text-muted-foreground">
                    Pen: {match.home_score_penalties} – {match.away_score_penalties}
                  </p>
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
            <div className="text-[10px] text-muted-foreground text-center mt-1">
              {formatDateShort(match.match_date)}
            </div>
          </div>

          {/* Away */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <FlagImage
              fifaCode={match.away_team?.fifa_code ?? ""}
              fallbackEmoji="🏳️"
              size="xl"
              className="rounded-xl shadow-lg"
            />
            <p className="font-bold text-sm text-white text-center leading-tight">
              {match.away_team?.name ?? "Por definir"}
            </p>
            <p className="text-[10px] text-muted-foreground">{match.away_team?.short_name}</p>
          </div>
        </div>

        {/* Venue */}
        {match.venue && (
          <div className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-white/5 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{match.venue}{match.city ? `, ${match.city}` : ""}</span>
          </div>
        )}
      </motion.div>

      {/* Goals */}
      {(isFinished || isLive) && events.length > 0 && (
        <GoalsSection
          events={events}
          homeTeamId={match.home_team_id}
          awayTeamId={match.away_team_id}
        />
      )}

      {/* Lineups */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card rounded-2xl border border-white/8 overflow-hidden"
      >
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-emerald-500/15 flex items-center justify-center">
            <Users className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <h2 className="font-bold text-sm">Alineaciones</h2>
        </div>

        <div className="p-4 flex gap-4 items-start">
          <LineupColumn teamRow={match.home_team} side="home" />
          <div className="w-px bg-white/8 self-stretch shrink-0" />
          <LineupColumn teamRow={match.away_team} side="away" />
        </div>
      </motion.div>
    </div>
  );
}
