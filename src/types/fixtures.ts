import type { MatchRow, TeamRow, GroupRow, MatchPhase, MatchStatus, StandingRow } from "./database";

export interface Match extends MatchRow {
  home_team: TeamRow | null;
  away_team: TeamRow | null;
  group: GroupRow | null;
}

export interface Group extends GroupRow {
  teams: TeamRow[];
  matches: Match[];
  standings: Standing[];
}

export interface Standing extends StandingRow {
  team: TeamRow;
}

export interface BracketMatch {
  id: string;
  phase: MatchPhase;
  position: number;
  match: Match | null;
  home_team: TeamRow | null;
  away_team: TeamRow | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  match_date: string | null;
  winner?: TeamRow | null;
}

export interface BracketRound {
  phase: MatchPhase;
  label: string;
  matches: BracketMatch[];
}

export interface TournamentBracket {
  rounds: BracketRound[];
  champion: TeamRow | null;
}
