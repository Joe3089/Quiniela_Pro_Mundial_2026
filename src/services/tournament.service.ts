import { createClient } from "@/lib/supabase/client";
import type { TournamentRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

export const tournamentService = {
  async getActiveTournament(): Promise<TournamentRow | null> {
    const { data, error } = await db()
      .from("tournaments")
      .select("*")
      .eq("is_active", true)
      .eq("slug", "mundial-2026")
      .maybeSingle();
    if (error) console.error("[tournament] fetch error:", error);
    return (data as TournamentRow) ?? null;
  },
};
