import type { PredictionRow } from "./database";
import type { Match } from "./fixtures";

export interface Prediction extends PredictionRow {
  match: Match;
}

export interface PredictionFormData {
  home_score_prediction: number;
  away_score_prediction: number;
  outcome_prediction?: "90min" | "extra_time" | "penalties" | null;
  qualifier_team_id?: string | null;
  extra_time_home_prediction?: number | null;
  extra_time_away_prediction?: number | null;
  penalties_home_prediction?: number | null;
  penalties_away_prediction?: number | null;
}

export interface PredictionWithPoints extends Prediction {
  points_breakdown: PointsBreakdown;
}

export interface PointsBreakdown {
  points: number;
  reason: "exact_score" | "correct_winner" | "exact_draw" | "partial_draw" | "wrong";
  label: string;
}

export const POINTS_CONFIG = {
  exact_score: 5,
  correct_winner: 3,
  exact_draw: 2,
  partial_draw: 1,
  wrong: 0,
} as const;
