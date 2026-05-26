"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Users, GitBranch, Database } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MatchCard } from "@/features/fixtures/components/match-card";
import { GroupStandings } from "@/features/fixtures/components/group-standings";
import { TournamentBracket } from "@/features/fixtures/components/tournament-bracket";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatches, useGroups } from "@/features/fixtures/hooks/use-fixtures";
import type { MatchPhase } from "@/types/database";
import type { BracketRound, BracketMatch } from "@/types/fixtures";

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

export function FixturesView() {
  const [activeTab, setActiveTab] = useState("grupos");
  const { data: matches, isLoading: matchesLoading } = useMatches();
  const { data: groups, isLoading: groupsLoading } = useGroups();

  const groupMatches = matches?.filter((m) => m.phase === "group") ?? [];
  const bracketRounds = buildBracketRounds(matches);

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
            <Trophy className="h-4 w-4" />
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
                <GroupStandings key={group.id} group={group} />
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
              <TournamentBracket rounds={bracketRounds} />
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
          ) : groupMatches.length > 0 ? (
            <div className="space-y-2">
              {groupMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
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
