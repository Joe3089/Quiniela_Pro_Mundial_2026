"use client";

import { useQuery } from "@tanstack/react-query";
import { fixturesService } from "../services/fixtures.service";
import { QUERY_KEYS } from "@/constants";
import { useTournamentStore } from "@/store/tournament.store";
import type { MatchPhase } from "@/types/database";

export function useTeams() {
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.teams, activeTournament?.id],
    queryFn: () => fixturesService.getTeams(activeTournament!.id),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60 * 30,
  });
}

export function useMatches(phase?: MatchPhase) {
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.matches, activeTournament?.id, phase],
    queryFn: () => fixturesService.getTournamentMatches(activeTournament!.id, phase),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60 * 2,
    // Refresh every minute while there are live matches (tournament underway)
    refetchInterval: (query) => {
      const data = query.state.data as import("@/types/fixtures").Match[] | undefined;
      const hasLive = data?.some((m) => m.status === "live");
      return hasLive ? 60_000 : false;
    },
  });
}

export function useGroups() {
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.groups, activeTournament?.id],
    queryFn: () => fixturesService.getGroups(activeTournament!.id),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60 * 5,
  });
}
