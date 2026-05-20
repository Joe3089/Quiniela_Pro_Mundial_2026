"use client";

import { useEffect, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { tournamentService } from "@/services/tournament.service";
import { useTournamentStore } from "@/store/tournament.store";
import { QUERY_KEYS, TOURNAMENT_SLUG } from "@/constants";

export function TournamentProvider({ children }: { children: ReactNode }) {
  const { setActiveTournament } = useTournamentStore();

  const { data: tournament } = useQuery({
    queryKey: [QUERY_KEYS.tournament, TOURNAMENT_SLUG],
    queryFn: () => tournamentService.getActiveTournament(),
    staleTime: 1000 * 60 * 60,
  });

  useEffect(() => {
    if (tournament) setActiveTournament(tournament);
  }, [tournament, setActiveTournament]);

  return <>{children}</>;
}
