import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";

// API-Football event names sometimes vary between abbreviated ("K. Mbappe") and
// full ("Kylian Mbappé") forms across different fixtures — normalize known
// aliases so the same player isn't split across two leaderboard rows.
const NAME_ALIASES: Record<string, string> = {
  "K. Mbappe": "Kylian Mbappé",
  "K. Mbappé": "Kylian Mbappé",
  "L. Messi": "Lionel Messi",
  "H. Kane": "Harry Kane",
  "C. Ronaldo": "Cristiano Ronaldo",
};
const canonicalName = (name: string) => NAME_ALIASES[name] ?? name;

export async function GET() {
  const supabase = await createClient();

  // Per-player WC2026 goal count from match_events (synced by cron)
  // "penalty" counts as a goal for the scorer; missed penalties are never inserted.
  const { data } = await supabase
    .from("match_events")
    .select("player_name, assist_name, type, team_id, teams:teams!match_events_team_id_fkey(name, fifa_code, flag_url)")
    .eq("tournament_id", TOURNAMENT_ID)
    .in("type", ["goal", "penalty"]);

  const counts: Record<string, number> = {};
  const scorerTeam: Record<string, { name: string; fifa_code: string | null; flag_url: string | null }> = {};
  const assistCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    const scorer = canonicalName(row.player_name);
    counts[scorer] = (counts[scorer] ?? 0) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = (row as any).teams;
    if (team && !scorerTeam[scorer]) scorerTeam[scorer] = team;
    if (row.assist_name) {
      const assister = canonicalName(row.assist_name);
      assistCounts[assister] = (assistCounts[assister] ?? 0) + 1;
      if (team && !scorerTeam[assister]) scorerTeam[assister] = team;
    }
  }

  const topScorers = Object.entries(counts)
    .map(([name, goals]) => ({ name, goals, team: scorerTeam[name] ?? null }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 15);

  const topAssists = Object.entries(assistCounts)
    .map(([name, assists]) => ({ name, assists, team: scorerTeam[name] ?? null }))
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 15);

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
    { goals: counts, teamGamesPlayed, topScorers, topAssists },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}
