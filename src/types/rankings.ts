import type { RankingRow, UserRow } from "./database";

export interface RankingEntry extends RankingRow {
  user: Pick<UserRow, "id" | "username" | "display_name" | "avatar_url">;
}

export interface LeaderboardEntry extends RankingEntry {
  rank_position: number;
  change: number | null;
}
