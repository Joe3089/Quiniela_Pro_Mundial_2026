"use client";

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy, Users, GitBranch, Database, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchCard } from "@/features/fixtures/components/match-card";
import { GroupStandings, computeStandings } from "@/features/fixtures/components/group-standings";
import { TournamentBracket } from "@/features/fixtures/components/tournament-bracket";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches, useGroups } from "@/features/fixtures/hooks/use-fixtures";
import type { MatchPhase } from "@/types/database";
import type { BracketRound, BracketMatch, Match } from "@/types/fixtures";

function EmptyDbState() {
  return (
    <div className="glass-card rounded-2xl border border-[hsl(var(--brand-blue)/0.25)] p-10 text-center">
      <div className="relative inline-flex items-center justify-center mb-5">
        <div className="absolute inset-0 rounded-full bg-[hsl(var(--brand-blue)/0.1)] blur-2xl scale-150" />
        <div className="relative h-16 w-16 rounded-2xl bg-[hsl(var(--brand-blue)/0.15)] border border-[hsl(var(--brand-blue)/0.25)] flex items-center justify-center">
          <Database className="h-8 w-8 text-[hsl(var(--brand-blue-light))]" />
        </div>
      </div>
      <h3 className="text-lg font-bold text-white mb-2">Carga los partidos del Mundial</h3>
      <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
        La base de datos está vacía. Ejecuta el seed SQL en el editor de Supabase para cargar los 104 partidos del Mundial 2026.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <a
          href="https://supabase.com/dashboard/project/wkhyihdjojyvxwfrobyw/sql/new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-[hsl(var(--brand-blue))] text-white hover:bg-[hsl(var(--brand-blue-vivid))] transition-colors shadow-[0_0_24px_rgba(29,78,216,0.4)]"
        >
          <Database className="h-4 w-4" />
          Abrir SQL Editor
        </a>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Archivo:</span>
          <code className="bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 font-mono">supabase/seed.sql</code>
        </div>
      </div>
    </div>
  );
}

function buildBracketRounds(matches: ReturnType<typeof useMatches>["data"]): BracketRound[] {
  if (!matches) return [];
  const knockoutPhases: MatchPhase[] = [
    "round_of_32", "round_of_16", "quarter_final", "semi_final", "third_place", "final",
  ];
  const phaseLabels: Record<MatchPhase, string> = {
    group: "Grupos",
    round_of_32: "Ronda de 32",
    round_of_16: "Octavos de Final",
    quarter_final: "Cuartos de Final",
    semi_final: "Semifinales",
    third_place: "3er Lugar",
    final: "Final",
  };

  return knockoutPhases
    .map((phase) => {
      const phaseMatches = matches.filter((m) => m.phase === phase);
      return {
        phase,
        label: phaseLabels[phase],
        matches: phaseMatches.map((m, i): BracketMatch => ({
          id: m.id,
          phase: m.phase,
          position: i,
          match: m,
          home_team: m.home_team,
          away_team: m.away_team,
          home_score: m.home_score,
          away_score: m.away_score,
          status: m.status,
          match_date: m.match_date,
        })),
      };
    })
    .filter((r) => r.matches.length > 0);
}

function getChampion(matches: ReturnType<typeof useMatches>["data"]) {
  const final = matches?.find((m) => m.phase === "final");
  if (!final || final.status !== "finished" || final.home_score == null || final.away_score == null) {
    return null;
  }
  let homeWon = final.home_score > final.away_score;
  if (final.home_score === final.away_score) {
    homeWon = (final.home_score_penalties ?? 0) > (final.away_score_penalties ?? 0);
  }
  return homeWon ? final.home_team : final.away_team;
}

export function FixturesView() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "grupos";
  const [activeTab, setActiveTab] = useState(initialTab);
  const router = useRouter();
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: groups, isLoading: groupsLoading } = useGroups();

  const groupMatches = matches?.filter((m) => m.phase === "group") ?? [];
  const bracketRounds = buildBracketRounds(matches);
  const champion = getChampion(matches);

  const PHASE_LABELS: Record<string, string> = {
    group: "Fase de Grupos",
    round_of_32: "Ronda de 32",
    round_of_16: "Octavos de Final",
    quarter_final: "Cuartos de Final",
    semi_final: "Semifinales",
    third_place: "3er Lugar",
    final: "Final",
  };

  // Build calendar: group all matches by local date (ET)
  const calendarDays = useMemo(() => {
    if (!matches?.length) return [];
    const TZ = "America/New_York";
    const grouped = new Map<string, Match[]>();
    for (const m of matches) {
      const d = new Date(m.match_date);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(m);
    }
    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, dayMatches]) => {
        const d = new Date(dateKey + "T12:00:00Z");
        const label = new Intl.DateTimeFormat("es-MX", {
          weekday: "long", day: "numeric", month: "long", timeZone: "UTC",
        }).format(d);
        const firstMatch = dayMatches[0];
        let sublabel = "";
        if (firstMatch.phase === "group") {
          const rn = firstMatch.round_number;
          sublabel = rn ? `Jornada ${rn}` : "Fase de Grupos";
        } else {
          sublabel = PHASE_LABELS[firstMatch.phase] ?? firstMatch.phase;
        }
        return { dateKey, label: label.charAt(0).toUpperCase() + label.slice(1), sublabel, dayMatches };
      });
  }, [matches]);

  // Compute best-thirds qualification map: groupId → boolean
  const thirdQualifiesMap = useMemo<Record<string, boolean>>(() => {
    if (!groups?.length) return {};
    // Get 3rd-place team stats for each group
    const thirds = groups.map((g) => {
      const standings = computeStandings(g.teams, g.matches);
      const third = standings[2];
      return { groupId: g.id, ...(third ?? { pts: -1, diff: -99, gf: -99, gc: 99 }) };
    });
    // Sort thirds by FIFA tiebreakers (pts → diff → gf → gc asc)
    const sorted = [...thirds].sort((a, b) =>
      (b.pts ?? 0) - (a.pts ?? 0) ||
      (b.diff ?? 0) - (a.diff ?? 0) ||
      (b.gf ?? 0) - (a.gf ?? 0) ||
      (a.gc ?? 0) - (b.gc ?? 0)
    );
    // Top 8 qualify
    const qualifying = new Set(sorted.slice(0, 8).map((t) => t.groupId));
    return Object.fromEntries(thirds.map((t) => [t.groupId, qualifying.has(t.groupId)]));
  }, [groups]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-[hsl(var(--primary)/0.15)] flex items-center justify-center">
            <Trophy className="h-4 w-4 text-[hsl(var(--primary))]" />
          </div>
          Partidos · <span className="text-gradient-vivid">Mundial 2026</span>
        </h1>
      </motion.div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 glass border border-white/8">
          <TabsTrigger value="grupos" className="gap-2">
            <Users className="h-4 w-4" />
            Grupos
          </TabsTrigger>
          <TabsTrigger value="eliminacion" className="gap-2">
            <GitBranch className="h-4 w-4" />
            Eliminación
          </TabsTrigger>
          <TabsTrigger value="calendario" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        {/* Groups tab */}
        <TabsContent value="grupos">
          {groupsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : groups && groups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {groups.map((group) => (
                <GroupStandings
                  key={group.id}
                  group={group}
                  thirdQualifies={group.teams.length >= 3 ? thirdQualifiesMap[group.id] : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyDbState />
          )}
        </TabsContent>

        {/* Bracket tab */}
        <TabsContent value="eliminacion">
          {matchesLoading ? (
            <Skeleton className="h-96 w-full rounded-xl" />
          ) : bracketRounds.length > 0 ? (
            <div className="glass rounded-2xl border border-border/30 p-4">
              <TournamentBracket rounds={bracketRounds} champion={champion} />
            </div>
          ) : (
            <EmptyDbState />
          )}
        </TabsContent>

        {/* Calendar tab */}
        <TabsContent value="calendario">
          {matchesLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-xl" />
              ))}
            </div>
          ) : calendarDays.length > 0 ? (
            <div className="space-y-6">
              {calendarDays.map(({ dateKey, label, sublabel, dayMatches }) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-2 px-1">
                    <CalendarDays className="h-3.5 w-3.5 text-[hsl(var(--brand-gold))] shrink-0" />
                    <span className="text-sm font-black text-white">{label}</span>
                    {sublabel && (
                      <span className="text-[10px] font-semibold text-muted-foreground bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">
                        {sublabel}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {dayMatches.map((match) => (
                      <MatchCard key={match.id} match={match} onClick={() => router.push(`/fixtures/${match.id}`)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyDbState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
