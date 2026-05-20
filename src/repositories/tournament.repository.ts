import { createClient } from "@/lib/supabase/server";
import type { TournamentRow } from "@/types/database";

export async function getActiveTournament(): Promise<TournamentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .eq("is_active", true)
    .eq("slug", "mundial-2026")
    .single();

  return data ?? null;
}

export async function getTournamentBySlug(slug: string): Promise<TournamentRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tournaments")
    .select("*")
    .eq("slug", slug)
    .single();

  return data ?? null;
}
