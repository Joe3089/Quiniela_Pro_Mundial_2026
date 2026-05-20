"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { rankingsService } from "../services/rankings.service";
import { useAuthStore } from "@/store/auth.store";
import { useTournamentStore } from "@/store/tournament.store";
import { QUERY_KEYS } from "@/constants";

export function useLeaderboard(limit = 50) {
  const { activeTournament } = useTournamentStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEYS.rankings, activeTournament?.id, limit],
    queryFn: () => rankingsService.getLeaderboard(activeTournament!.id, limit),
    enabled: !!activeTournament?.id,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (!activeTournament?.id) return;

    const channel = rankingsService.subscribeToLeaderboard(
      activeTournament.id,
      () => {
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEYS.rankings, activeTournament.id],
        });
      }
    );

    return () => {
      channel.unsubscribe();
    };
  }, [activeTournament?.id, queryClient]);

  return query;
}

export function useUserRank() {
  const { user } = useAuthStore();
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.rankings, "user", user?.id, activeTournament?.id],
    queryFn: () => rankingsService.getUserRank(user!.id, activeTournament!.id),
    enabled: !!user?.id && !!activeTournament?.id,
    staleTime: 1000 * 30,
  });
}
