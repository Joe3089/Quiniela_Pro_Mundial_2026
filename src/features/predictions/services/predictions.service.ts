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
    const base = {
      user_id: userId,
      match_id: matchId,
      tournament_id: tournamentId,
      home_score_prediction: data.home_score_prediction,
      away_score_prediction: data.away_score_prediction,
    };
    const playoffExtra = {
      ...(data.outcome_prediction != null && { outcome_prediction: data.outcome_prediction }),
      ...(data.qualifier_team_id != null && { qualifier_team_id: data.qualifier_team_id }),
      extra_time_home_prediction: data.extra_time_home_prediction ?? null,
      extra_time_away_prediction: data.extra_time_away_prediction ?? null,
      penalties_home_prediction: data.penalties_home_prediction ?? null,
      penalties_away_prediction: data.penalties_away_prediction ?? null,
    };
    const hasPlayoff = Object.keys(playoffExtra).length > 0;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = supabase as any;

    // Try with playoff fields first; fall back to base if columns don't exist yet
    if (hasPlayoff) {
      const { error } = await sb.from("predictions").upsert(
        { ...base, ...playoffExtra },
        { onConflict: "user_id,match_id" }
      );
      if (!error) return;
      // Column doesn't exist yet — fall through to base upsert
      if (!String(error.message).includes("does not exist")) throw error;
    }

    const { error: baseError } = await sb.from("predictions").upsert(base, {
      onConflict: "user_id,match_id",
    });
    if (baseError) throw baseError;
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
