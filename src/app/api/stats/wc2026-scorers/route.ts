import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();

  // Per-player WC2026 goal count from match_events (synced by cron)
  const { data } = await supabase
    .from("match_events")
    .select("player_name")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("type", "goal");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.player_name] = (counts[row.player_name] ?? 0) + 1;
  }

  // Also fetch team games played for active historical scorers
  const { data: teamGames } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, teams_home:teams!matches_home_team_id_fkey(fifa_code), teams_away:teams!matches_away_team_id_fkey(fifa_code)")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("status", "finished");

  const teamGamesPlayed: Record<string, number> = {};
  for (const m of teamGames ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeCode = (m as any).teams_home?.fifa_code;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayCode = (m as any).teams_away?.fifa_code;
    if (homeCode) teamGamesPlayed[homeCode] = (teamGamesPlayed[homeCode] ?? 0) + 1;
    if (awayCode) teamGamesPlayed[awayCode] = (teamGamesPlayed[awayCode] ?? 0) + 1;
  }

  return NextResponse.json(
    { goals: counts, teamGamesPlayed },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}
