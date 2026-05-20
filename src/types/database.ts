export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserRow;
        Insert: Omit<UserRow, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<UserRow, "id" | "created_at">>;
      };
      tournaments: {
        Row: TournamentRow;
        Insert: Omit<TournamentRow, "id" | "created_at">;
        Update: Partial<Omit<TournamentRow, "id" | "created_at">>;
      };
      teams: {
        Row: TeamRow;
        Insert: Omit<TeamRow, "id">;
        Update: Partial<Omit<TeamRow, "id">>;
      };
      groups: {
        Row: GroupRow;
        Insert: Omit<GroupRow, "id">;
        Update: Partial<Omit<GroupRow, "id">>;
      };
      matches: {
        Row: MatchRow;
        Insert: Omit<MatchRow, "id" | "created_at">;
        Update: Partial<Omit<MatchRow, "id" | "created_at">>;
      };
      predictions: {
        Row: PredictionRow;
        Insert: Omit<PredictionRow, "id" | "created_at" | "updated_at" | "points_earned">;
        Update: Partial<Omit<PredictionRow, "id" | "created_at">>;
      };
      rankings: {
        Row: RankingRow;
        Insert: Omit<RankingRow, "id" | "updated_at">;
        Update: Partial<Omit<RankingRow, "id">>;
      };
      standings: {
        Row: StandingRow;
        Insert: Omit<StandingRow, "id">;
        Update: Partial<Omit<StandingRow, "id">>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      calculate_prediction_points: {
        Args: { prediction_id: string };
        Returns: number;
      };
      update_user_ranking: {
        Args: { p_user_id: string; p_tournament_id: string };
        Returns: void;
      };
    };
    Enums: {
      match_phase: MatchPhase;
      match_status: MatchStatus;
      prediction_status: PredictionStatus;
    };
  };
}

export interface UserRow {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TournamentRow {
  id: string;
  name: string;
  slug: string;
  season: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  logo_url: string | null;
  host_countries: string[];
  created_at: string;
}

export interface TeamRow {
  id: string;
  name: string;
  short_name: string;
  flag_url: string | null;
  fifa_code: string;
  continent: string;
  tournament_id: string;
}

export interface GroupRow {
  id: string;
  name: string;
  letter: string;
  tournament_id: string;
}

export interface MatchRow {
  id: string;
  tournament_id: string;
  phase: MatchPhase;
  round_number: number | null;
  group_id: string | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties: number | null;
  away_score_penalties: number | null;
  match_date: string;
  venue: string | null;
  city: string | null;
  status: MatchStatus;
  created_at: string;
}

export interface PredictionRow {
  id: string;
  user_id: string;
  match_id: string;
  tournament_id: string;
  home_score_prediction: number;
  away_score_prediction: number;
  points_earned: number | null;
  status: PredictionStatus;
  created_at: string;
  updated_at: string;
}

export interface RankingRow {
  id: string;
  user_id: string;
  tournament_id: string;
  total_points: number;
  exact_scores: number;
  correct_winners: number;
  exact_draws: number;
  partial_draws: number;
  wrong_predictions: number;
  predictions_count: number;
  rank_position: number | null;
  updated_at: string;
}

export interface StandingRow {
  id: string;
  group_id: string;
  team_id: string;
  tournament_id: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export type MatchPhase =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter_final"
  | "semi_final"
  | "third_place"
  | "final";

export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type PredictionStatus = "pending" | "correct" | "incorrect" | "partial";
