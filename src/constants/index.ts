export const APP_NAME = "Quiniela FIFA WORLD CUP 2026";
export const APP_SHORT_NAME = "Quiniela WC26";
export const APP_DESCRIPTION = "La quiniela oficial del Mundial FIFA World Cup 2026";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const TOURNAMENT_SLUG = "mundial-2026";
export const TOURNAMENT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export const SCORING = {
  EXACT_SCORE: 5,
  CORRECT_WINNER: 3,
  EXACT_DRAW: 2,
  PARTIAL_DRAW: 1,
  WRONG: 0,
} as const;

export const PHASES = {
  group: { label: "Fase de Grupos", order: 1 },
  round_of_32: { label: "Ronda de 32", order: 2 },
  round_of_16: { label: "Octavos de Final", order: 3 },
  quarter_final: { label: "Cuartos de Final", order: 4 },
  semi_final: { label: "Semifinales", order: 5 },
  third_place: { label: "Tercer Lugar", order: 6 },
  final: { label: "Final", order: 7 },
} as const;

export const MATCH_STATUS_LABELS = {
  scheduled: "Programado",
  live: "En Vivo",
  finished: "Finalizado",
  postponed: "Postpuesto",
  cancelled: "Cancelado",
} as const;

export const FIFA_GROUPS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"] as const;

export const QUERY_KEYS = {
  tournament: "tournament",
  matches: "matches",
  groups: "groups",
  teams: "teams",
  predictions: "predictions",
  rankings: "rankings",
  profile: "profile",
  standings: "standings",
} as const;
