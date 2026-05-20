"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { predictionsService } from "../services/predictions.service";
import { useAuthStore } from "@/store/auth.store";
import { useTournamentStore } from "@/store/tournament.store";
import { QUERY_KEYS } from "@/constants";
import type { PredictionFormData } from "@/types/predictions";

export function useUserPredictions() {
  const { user } = useAuthStore();
  const { activeTournament } = useTournamentStore();

  return useQuery({
    queryKey: [QUERY_KEYS.predictions, user?.id, activeTournament?.id],
    queryFn: () =>
      predictionsService.getUserPredictions(user!.id, activeTournament!.id),
    enabled: !!user?.id && !!activeTournament?.id,
  });
}

export function useSavePrediction() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { activeTournament } = useTournamentStore();

  return useMutation({
    mutationFn: ({
      matchId,
      data,
    }: {
      matchId: string;
      data: PredictionFormData;
    }) =>
      predictionsService.savePrediction(
        user!.id,
        matchId,
        activeTournament!.id,
        data
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.predictions, user?.id],
      });
      toast.success("¡Predicción guardada!");
    },
    onError: (error: Error) => {
      toast.error(error.message ?? "Error al guardar predicción");
    },
  });
}
