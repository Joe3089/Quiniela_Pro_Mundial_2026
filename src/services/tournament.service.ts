import { createClient } from "@/lib/supabase/client";
import type { TournamentRow } from "@/types/database";
import { TOURNAMENT_SLUG, TOURNAMENT_ID } from "@/constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

export const tournamentService = {
  async getActiveTournament(): Promise<TournamentRow | null> {
    const supabase = db();

    // 1st try: active tournament with matching slug
    const { data: active } = await supabase
      .from("tournaments")
      .select("*")
      .eq("is_active", true)
      .eq("slug", TOURNAMENT_SLUG)
      .maybeSingle();
    if (active) return active as TournamentRow;

    // 2nd try: any tournament with matching slug (is_active may be false)
    const { data: bySlug } = await supabase
      .from("tournaments")
      .select("*")
      .eq("slug", TOURNAMENT_SLUG)
      .maybeSingle();
    if (bySlug) return bySlug as TournamentRow;

    // 3rd try: by the known constant ID
    const { data: byId } = await supabase
      .from("tournaments")
      .select("*")
      .eq("id", TOURNAMENT_ID)
      .maybeSingle();
    if (byId) return byId as TournamentRow;

    // 4th try: just grab the first tournament in the DB (any)
    const { data: any } = await supabase
      .from("tournaments")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (any as TournamentRow) ?? null;
  },
};
