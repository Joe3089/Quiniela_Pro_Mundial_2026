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
        <span className="font-bold text-sm">Grupo {group.letter}</span>
        <span className="text-xs text-muted-foreground">{group.teams.length} equipos</span>
      </div>

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
    </motion.div>
  );
}
