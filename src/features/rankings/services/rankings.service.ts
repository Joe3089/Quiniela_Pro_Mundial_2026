import { createClient } from "@/lib/supabase/client";
import type { LeaderboardEntry } from "@/types/rankings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

export const rankingsService = {
  async getLeaderboard(tournamentId: string, limit = 50, offset = 0): Promise<LeaderboardEntry[]> {
    const { data, error } = await db()
      .from("rankings")
      .select(`*, user:users(id, username, display_name, avatar_url)`)
      .eq("tournament_id", tournamentId)
      .order("total_points", { ascending: false })
      .order("exact_scores", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return (data as LeaderboardEntry[]) ?? [];
  },

  async getUserRank(userId: string, tournamentId: string): Promise<LeaderboardEntry | null> {
    const { data, error } = await db()
      .from("rankings")
      .select(`*, user:users(id, username, display_name, avatar_url)`)
      .eq("user_id", userId)
      .eq("tournament_id", tournamentId)
      .single();

    if (error?.code === "PGRST116") return null;
    if (error) throw error;
    return data as LeaderboardEntry;
  },

  subscribeToLeaderboard(tournamentId: string, callback: (entry: LeaderboardEntry) => void) {
    return db()
      .channel(`rankings:${tournamentId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rankings", filter: `tournament_id=eq.${tournamentId}` },
        (payload: { new: LeaderboardEntry }) => {
          if (payload.new) callback(payload.new);
        }
      )
      .subscribe();
  },
};
