import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";
import { searchPlayer } from "@/services/api-football";

export const dynamic = "force-dynamic";
export const maxDuration = 45;

// API-Football event names sometimes vary between abbreviated ("K. Mbappe") and
// full ("Kylian Mbappé") forms across different fixtures — normalize known
// aliases so the same player isn't split across two leaderboard rows.
const NAME_ALIASES: Record<string, string> = {
  "K. Mbappe": "Kylian Mbappé",
  "K. Mbappé": "Kylian Mbappé",
  "L. Messi": "Lionel Messi",
  "H. Kane": "Harry Kane",
  "C. Ronaldo": "Cristiano Ronaldo",
  "M. Olise": "Michael Olise",
};
const canonicalName = (name: string) => NAME_ALIASES[name] ?? name;

// Resolve + cache real player photos (api-sports.io) so we don't hit the
// API-Football rate limit on every request — only unseen names are looked up.
async function resolvePhotos(names: string[]): Promise<Record<string, string>> {
  if (names.length === 0) return {};
  const admin = await createAdminClient();
  const { data: cached } = await admin
    .from("player_photos")
    .select("name, photo_url")
    .in("name", names);

  const photos: Record<string, string> = {};
  const cachedNames = new Set<string>();
  for (const row of cached ?? []) {
    cachedNames.add(row.name);
    if (row.photo_url) photos[row.name] = row.photo_url;
  }

  const missing = names.filter((n) => !cachedNames.has(n));
  await Promise.allSettled(
    missing.map(async (name) => {
      try {
        const results = await searchPlayer(name);
        const match = results[0]?.player;
        const photoUrl = match?.photo ?? null;
        await admin.from("player_photos").upsert(
          { name, api_football_id: match?.id ?? null, photo_url: photoUrl, updated_at: new Date().toISOString() },
          { onConflict: "name" }
        );
        if (photoUrl) photos[name] = photoUrl;
      } catch {
        // API unavailable / player not found — leave uncached photo, frontend falls back to initials avatar
      }
    })
  );

  return photos;
}

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

  const topScorersRaw = Object.entries(counts)
    .map(([name, goals]) => ({ name, goals, team: scorerTeam[name] ?? null }))
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 15);

  const topAssistsRaw = Object.entries(assistCounts)
    .map(([name, assists]) => ({ name, assists, team: scorerTeam[name] ?? null }))
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 15);

  const photoNames = [...new Set([...topScorersRaw.map((s) => s.name), ...topAssistsRaw.map((a) => a.name)])];
  const photos = await resolvePhotos(photoNames);
  const topScorers = topScorersRaw.map((s) => ({ ...s, photoUrl: photos[s.name] ?? null }));
  const topAssists = topAssistsRaw.map((a) => ({ ...a, photoUrl: photos[a.name] ?? null }));

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
