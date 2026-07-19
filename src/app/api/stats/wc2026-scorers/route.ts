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

// Player-photo media URL is deterministic from the API-Football id, so once we
// know the id the photo always resolves — no need to trust the search payload's
// (sometimes stale) photo field.
const photoFromId = (id: number) => `https://media.api-sports.io/football/players/${id}.png`;

// Diacritics that NFD does not decompose (Ø, Æ, ß, …) — needed so ascii event
// names ("M. Odegaard") match the API's accented squad names ("M. Ødegaard").
const EXTRA_CHARS: Record<string, string> = {
  ø: "o", æ: "ae", ß: "ss", ł: "l", đ: "d", ð: "d", þ: "th", œ: "oe", ı: "i",
};
const normName = (s: string) =>
  (s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split("")
    .map((c) => EXTRA_CHARS[c] ?? c)
    .join("")
    .replace(/[^a-z\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
const nameTokens = (s: string) => normName(s).split(" ").filter((t) => t.length > 1);
const surnameOf = (s: string) => {
  const t = nameTokens(s);
  return t[t.length - 1] ?? normName(s);
};
const initialOf = (name: string) => {
  const m = name.match(/^\s*(\p{L})\.?\s/u);
  return m ? normName(m[1]) : null;
};

// Pick the API candidate that best matches the (often abbreviated) event name,
// scoring on surname equality and first-initial agreement so same-surname
// team-mates don't get swapped.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pickBest(candidates: any[], eventName: string) {
  const sur = surnameOf(eventName);
  const init = initialOf(eventName);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let best: { player: { id: number; photo?: string; name?: string; firstname?: string }; score: number } | null = null;
  for (const c of candidates) {
    const p = c?.player;
    if (!p?.id) continue;
    const toks = nameTokens(p.name ?? "");
    const last = toks[toks.length - 1];
    let score = 0;
    if (last === sur) score += 10;
    else if (toks.includes(sur)) score += 6;
    else continue; // surname must appear at all
    const firstInit = normName(p.firstname ?? p.name ?? "")[0];
    if (init) score += firstInit === init ? 5 : -3;
    if (normName(p.name ?? "") === normName(eventName)) score += 8;
    if (!best || score > best.score) best = { player: p, score };
  }
  return best?.player ?? null;
}

// Resolve + cache real player photos (api-sports.io) so we don't hit the
// API-Football rate limit on every request — only unseen names are looked up.
// Passing each player's team api id lets the search disambiguate same-surname
// players across squads.
async function resolvePhotos(
  entries: { name: string; teamApiId: number | null }[]
): Promise<Record<string, string>> {
  if (entries.length === 0) return {};
  const admin = await createAdminClient();
  const names = [...new Set(entries.map((e) => e.name))];
  const { data: cached } = await admin
    .from("player_photos")
    .select("name, api_football_id, photo_url")
    .in("name", names);

  const photos: Record<string, string> = {};
  const resolved = new Set<string>();
  for (const row of cached ?? []) {
    // A row counts as resolved only if we actually have an id/photo; rows left
    // over from a failed lookup are retried instead of masking the player.
    if (row.api_football_id || row.photo_url) {
      resolved.add(row.name);
      photos[row.name] = row.photo_url ?? photoFromId(row.api_football_id);
    }
  }

  const missing = entries.filter((e) => !resolved.has(e.name));
  await Promise.allSettled(
    missing.map(async ({ name, teamApiId }) => {
      try {
        const results = await searchPlayer(name, teamApiId);
        const match = pickBest(results, name) ?? results[0]?.player;
        if (!match?.id) return; // leave uncached so it retries next request
        const photoUrl = match.photo || photoFromId(match.id);
        await admin.from("player_photos").upsert(
          { name, api_football_id: match.id, photo_url: photoUrl, updated_at: new Date().toISOString() },
          { onConflict: "name" }
        );
        photos[name] = photoUrl;
      } catch {
        // API unavailable — leave uncached, frontend falls back to initials avatar
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
    .select("player_name, assist_name, type, team_id, teams:teams!match_events_team_id_fkey(name, fifa_code, flag_url, api_football_team_id)")
    .eq("tournament_id", TOURNAMENT_ID)
    .in("type", ["goal", "penalty"]);

  const counts: Record<string, number> = {};
  const scorerTeam: Record<string, { name: string; fifa_code: string | null; flag_url: string | null }> = {};
  const playerTeamApiId: Record<string, number | null> = {};
  const assistCounts: Record<string, number> = {};
  for (const row of data ?? []) {
    const scorer = canonicalName(row.player_name);
    counts[scorer] = (counts[scorer] ?? 0) + 1;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const team = (row as any).teams;
    if (team && !scorerTeam[scorer]) scorerTeam[scorer] = team;
    if (team && playerTeamApiId[scorer] == null) playerTeamApiId[scorer] = team.api_football_team_id ?? null;
    if (row.assist_name) {
      const assister = canonicalName(row.assist_name);
      assistCounts[assister] = (assistCounts[assister] ?? 0) + 1;
      if (team && !scorerTeam[assister]) scorerTeam[assister] = team;
      if (team && playerTeamApiId[assister] == null) playerTeamApiId[assister] = team.api_football_team_id ?? null;
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
  const photos = await resolvePhotos(
    photoNames.map((name) => ({ name, teamApiId: playerTeamApiId[name] ?? null }))
  );
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
