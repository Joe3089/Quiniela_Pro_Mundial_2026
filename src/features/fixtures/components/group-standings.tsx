"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Group } from "@/types/fixtures";

interface GroupStandingsProps {
  group: Group;
}

export function GroupStandings({ group }: GroupStandingsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-xl border border-border/50 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-border/50 flex items-center justify-between">
        <div>
          <span className="font-bold text-sm">Grupo {group.letter}</span>
          <p className="text-[11px] text-muted-foreground">{group.teams.length} equipos</p>
        </div>
        <span className="text-xs text-muted-foreground">{group.matches.length} partidos</span>
      </div>

      {group.standings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border/30">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium w-8">#</th>
                <th className="text-left px-2 py-2 text-muted-foreground font-medium">Equipo</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium w-8">J</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium w-8">G</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium w-8">E</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium w-8">P</th>
                <th className="text-center px-2 py-2 text-muted-foreground font-medium w-10">GD</th>
                <th className="text-center px-4 py-2 text-primary font-bold w-8">Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.standings.map((standing, idx) => (
                <tr
                  key={standing.id}
                  className={cn(
                    "border-b border-border/20 transition-colors hover:bg-muted/10",
                    idx < 2 && "border-l-2 border-l-primary"
                  )}
                >
                  <td className="px-4 py-2.5 text-muted-foreground font-medium">{idx + 1}</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      {standing.team?.flag_url && (
                        <Image
                          src={standing.team.flag_url}
                          alt={standing.team.name}
                          width={20}
                          height={14}
                          className="rounded-sm object-cover shrink-0"
                        />
                      )}
                      <span className="font-medium truncate max-w-[100px]">
                        {standing.team?.short_name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-center px-2 py-2.5 text-muted-foreground">{standing.played}</td>
                  <td className="text-center px-2 py-2.5 text-green-400">{standing.won}</td>
                  <td className="text-center px-2 py-2.5 text-yellow-400">{standing.drawn}</td>
                  <td className="text-center px-2 py-2.5 text-red-400">{standing.lost}</td>
                  <td className={cn("text-center px-2 py-2.5", standing.goal_difference > 0 ? "text-green-400" : standing.goal_difference < 0 ? "text-red-400" : "text-muted-foreground")}>
                    {standing.goal_difference > 0 ? "+" : ""}
                    {standing.goal_difference}
                  </td>
                  <td className="text-center px-4 py-2.5 font-bold text-foreground">{standing.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {group.teams.map((team) => (
              <div key={team.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
                {team.flag_url ? (
                  <Image
                    src={team.flag_url}
                    alt={team.name}
                    width={28}
                    height={18}
                    className="rounded-sm object-cover shrink-0"
                  />
                ) : (
                  <div className="h-9 w-12 rounded-lg bg-white/10 flex items-center justify-center text-[10px] font-semibold uppercase text-muted-foreground">
                    {team.fifa_code ?? team.short_name ?? "--"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">{team.name}</p>
                  <p className="text-[10px] uppercase text-muted-foreground">{team.fifa_code}</p>
                </div>
              </div>
            ))}
          </div>
          {group.matches.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Próximos partidos</p>
              <div className="space-y-2">
                {group.matches.map((match) => (
                  <div key={match.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                    <span className="font-semibold truncate">{match.home_team?.short_name ?? "TBD"} vs {match.away_team?.short_name ?? "TBD"}</span>
                    <span className="text-muted-foreground">{new Date(match.match_date).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
