import { createClient } from "@/lib/supabase/client";
import type { Prediction } from "@/types/predictions";
import type { PredictionFormData } from "@/types/predictions";

export const predictionsService = {
  async getUserPredictions(userId: string, tournamentId: string): Promise<Prediction[]> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("predictions")
      .select(`*, match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*))`)
      .eq("user_id", userId)
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as Prediction[]) ?? [];
  },

  async savePrediction(
    userId: string,
    matchId: string,
    tournamentId: string,
    data: PredictionFormData
  ): Promise<void> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("predictions").upsert(
      {
        user_id: userId,
        match_id: matchId,
        tournament_id: tournamentId,
        home_score_prediction: data.home_score_prediction,
        away_score_prediction: data.away_score_prediction,
      },
      { onConflict: "user_id,match_id" }
    );
    if (error) throw error;
  },

  async getPredictionForMatch(
    userId: string,
    matchId: string
  ): Promise<Prediction | null> {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from("predictions")
      .select(`*, match:matches(*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*))`)
      .eq("user_id", userId)
      .eq("match_id", matchId)
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    return data as Prediction;
  },
};
