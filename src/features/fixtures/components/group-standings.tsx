"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useFormatDate } from "@/hooks/use-format-date";
import type { Group, Match } from "@/types/fixtures";
import type { TeamRow } from "@/types/database";

interface ComputedStanding {
  team: TeamRow;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  gc: number;
  diff: number;
  pts: number;
}

function computeStandings(teams: TeamRow[], matches: Match[]): ComputedStanding[] {
  const map = new Map<string, ComputedStanding>();

  for (const team of teams) {
    map.set(team.id, { team, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, gc: 0, diff: 0, pts: 0 });
  }

  for (const m of matches) {
    if (m.status !== "finished" || m.home_score === null || m.away_score === null) continue;
    const hId = m.home_team_id ?? m.home_team?.id;
    const aId = m.away_team_id ?? m.away_team?.id;
    const home = hId ? map.get(hId) : undefined;
    const away = aId ? map.get(aId) : undefined;
    if (!home || !away) continue;

    home.played++; away.played++;
    home.gf += m.home_score; home.gc += m.away_score;
    away.gf += m.away_score; away.gc += m.home_score;

    if (m.home_score > m.away_score) {
      home.won++; home.pts += 3; away.lost++;
    } else if (m.home_score < m.away_score) {
      away.won++; away.pts += 3; home.lost++;
    } else {
      home.drawn++; home.pts++; away.drawn++; away.pts++;
    }
  }

  for (const s of map.values()) s.diff = s.gf - s.gc;

  return [...map.values()].sort((a, b) =>
    b.pts - a.pts || b.diff - a.diff || b.gf - a.gf || a.gc - b.gc ||
    (a.team.name ?? "").localeCompare(b.team.name ?? "")
  );
}

function TeamFlag({ team }: { team: TeamRow }) {
  if (team.flag_url) {
    return (
      <Image src={team.flag_url} alt={team.name} width={20} height={13}
        className="rounded-sm object-cover shrink-0" unoptimized />
    );
  }
  return (
    <span className="text-xs font-bold text-muted-foreground shrink-0 w-5">
      {team.fifa_code?.slice(0, 3)}
    </span>
  );
}

const QUALIFY_LABEL: Record<number, string> = { 1: "🥇", 2: "🥈" };

export function GroupStandings({ group }: { group: Group }) {
  const { formatDateShort, formatTime } = useFormatDate();
  const standings = computeStandings(group.teams, group.matches);
  const letter = group.letter ?? group.name?.replace("Group ", "") ?? "?";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-border/50 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <span className="font-bold text-sm">Grupo {letter}</span>
        <span className="text-xs text-muted-foreground">{group.teams.length} equipos</span>
      </div>

      {/* Teams grid */}
      <div className="grid grid-cols-2 gap-2 p-3">
        {group.teams.map((team) => (
          <div key={team.id}
            className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/4 px-3 py-2">
            {team.flag_url ? (
              <Image src={team.flag_url} alt={team.name} width={24} height={16}
                className="rounded-sm object-cover shrink-0" unoptimized />
            ) : (
              <div className="h-4 w-6 rounded bg-white/10 flex items-center justify-center">
                <span className="text-[8px] font-bold text-muted-foreground">{team.fifa_code?.slice(0, 3)}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold truncate">{team.name}</p>
              <p className="text-[9px] text-muted-foreground">{team.confederation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Standings table */}
      <div className="border-t border-border/30">
        <div className="px-3 py-2 flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
            Tabla de Posiciones
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] min-w-[480px]">
            <thead>
              <tr className="border-y border-border/30 bg-white/3">
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-7">Pos</th>
                <th className="text-left px-2 py-1.5 text-muted-foreground font-medium">Selección</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">PJ</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">PG</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">PE</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">PP</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">GF</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-8">GC</th>
                <th className="text-center px-2 py-1.5 text-muted-foreground font-medium w-10">DIF</th>
                <th className="text-center px-2 py-1.5 text-[hsl(var(--brand-gold))] font-bold w-9">PTS</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, idx) => (
                <tr key={s.team.id}
                  className={cn(
                    "border-b border-border/15 transition-colors hover:bg-white/3",
                    idx === 0 && "border-l-2 border-l-[hsl(var(--brand-gold))]",
                    idx === 1 && "border-l-2 border-l-[hsl(var(--primary))]"
                  )}
                >
                  <td className="text-center px-2 py-2">
                    <span className={cn(
                      "font-bold",
                      idx === 0 ? "text-[hsl(var(--brand-gold))]" :
                      idx === 1 ? "text-[hsl(var(--primary))]" : "text-muted-foreground"
                    )}>
                      {QUALIFY_LABEL[idx + 1] ?? idx + 1}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-1.5">
                      <TeamFlag team={s.team} />
                      <span className="font-medium truncate max-w-[90px]">
                        {s.team.short_name ?? s.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2 text-muted-foreground">{s.played}</td>
                  <td className="text-center px-2 py-2 text-emerald-400">{s.won}</td>
                  <td className="text-center px-2 py-2 text-yellow-400">{s.drawn}</td>
                  <td className="text-center px-2 py-2 text-red-400">{s.lost}</td>
                  <td className="text-center px-2 py-2 text-muted-foreground">{s.gf}</td>
                  <td className="text-center px-2 py-2 text-muted-foreground">{s.gc}</td>
                  <td className={cn("text-center px-2 py-2 font-medium",
                    s.diff > 0 ? "text-emerald-400" : s.diff < 0 ? "text-red-400" : "text-muted-foreground"
                  )}>
                    {s.diff > 0 ? "+" : ""}{s.diff}
                  </td>
                  <td className="text-center px-2 py-2 font-bold text-white">{s.pts}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 border-t border-border/15">
          <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
            <span className="w-2 h-2 rounded-sm bg-[hsl(var(--brand-gold))] inline-block" /> Clasifican al siguiente round
          </span>
        </div>
      </div>

      {/* Matches */}
      {group.matches.length > 0 && (
        <div className="border-t border-border/30 p-3">
          <p className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground mb-2">
            Partidos del grupo
          </p>
          <div className="space-y-1.5">
            {group.matches.map((match) => (
              <div key={match.id}
                className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2 text-[11px]">
                <span className="font-semibold flex-1 truncate">
                  {match.home_team?.short_name ?? "TBD"} vs {match.away_team?.short_name ?? "TBD"}
                </span>
                {match.status === "finished" && match.home_score !== null ? (
                  <span className="font-bold text-[hsl(var(--brand-gold))] shrink-0">
                    {match.home_score} – {match.away_score}
                  </span>
                ) : (
                  <span className="text-muted-foreground shrink-0">
                    {formatDateShort(match.match_date)} {formatTime(match.match_date)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
