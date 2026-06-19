export const APP_NAME = "Quiniela FIFA WORLD CUP 2026";
export const APP_SHORT_NAME = "Quiniela WC26";
export const APP_DESCRIPTION = "La quiniela oficial del Mundial FIFA World Cup 2026";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const TOURNAMENT_SLUG = "mundial-2026";
export const TOURNAMENT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export const SCORING = {
  EXACT_WIN: 5,      // Exact scoreline — winner is correct (non-draw)
  EXACT_DRAW: 4,     // Exact scoreline — both teams draw with exact goals
  CORRECT_WINNER: 3, // Right winner but wrong score
  CORRECT_DRAW: 1,   // Predicted draw and result is draw (wrong exact score)
  WRONG: 0,
  // Legacy aliases used by existing components
  EXACT_SCORE: 5,
  PARTIAL_DRAW: 1,
} as const;

// Playoff scoring (knockout rounds)
// From PDF scoring table:
// 5 pts: Exact score + right winner/qualifier
// 5 pts: Exact draw score + right qualifier team
// 4 pts: Correct penalties route + right qualifier
// 4 pts: Exact draw + wrong qualifier
// 3 pts: Correct winner (90min) but wrong score
// 3 pts: Correct AET prediction + right outcome
// 2 pts: Drew (90min) + right qualifier but wrong score
// 1 pt:  Correct draw (90min) but wrong qualifier + wrong score
// 0 pts: Wrong everything
export const PLAYOFF_SCORING = {
  PERFECT: 5,             // exact score + correct classifier
  PENALTIES_CORRECT: 4,   // predicted penalties + right qualifier
  CORRECT_WINNER: 3,      // right winner in 90min, wrong score
  CORRECT_QUALIFIER: 2,   // correct qualifier after draw, wrong score/outcome
  CORRECT_DRAW: 1,        // predicted draw and it drew, wrong qualifier
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
