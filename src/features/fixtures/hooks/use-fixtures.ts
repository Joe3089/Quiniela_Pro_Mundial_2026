"use client";

import { useQuery } from "@tanstack/react-query";
import { fixturesService } from "../services/fixtures.service";
import { QUERY_KEYS } from "@/constants";
import { useTournamentStore } from "@/store/tournament.store";
import type { MatchPhase } from "@/types/database";

export function useMatches(phase?: MatchPhase) {
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.matches, activeTournament?.id, phase],
    queryFn: () => fixturesService.getTournamentMatches(activeTournament!.id, phase),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 60 * 2,
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
