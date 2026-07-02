import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getFixtureLineups, getFixtureEvents } from "@/services/api-football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface MatchDetailResponse {
  referee: string | null;
  refereeCountry: string | null;
  lineups: {
    home: TeamLineup | null;
    away: TeamLineup | null;
  };
  events: MatchDetailEvent[];
}

export interface TeamLineup {
  teamId: string | null;
  teamName: string;
  teamLogo: string | null;
  formation: string | null;
  coach: string | null;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
}

export interface LineupPlayer {
  id: number;
  name: string;
  number: number;
  position: string;
  grid: string | null;
  captain?: boolean;
}

export interface MatchDetailEvent {
  minute: number;
  minuteExtra: number | null;
  teamName: string;
  teamLogo: string | null;
  playerName: string;
  assistName: string | null;
  type: string;
  detail: string;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  const supabase = await createAdminClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, api_football_fixture_id, home_team_id, away_team_id, referee, referee_country")
    .eq("id", matchId)
    .single();

  if (!match) return NextResponse.json({ error: "Match not found" }, { status: 404 });

  const fixtureId = match.api_football_fixture_id as number | null;

  // ── Referee: from Supabase first, then API fallback ────────────────────────
  let referee: string | null = (match as any).referee ?? null;
  let refereeCountry: string | null = (match as any).referee_country ?? null;

  if ((!referee || !refereeCountry) && fixtureId) {
    try {
      const apiKey = process.env.API_FOOTBALL_KEY;
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
        { headers: { "x-apisports-key": apiKey ?? "" }, next: { revalidate: 3600 } }
      );
      const json = await res.json() as { response?: Array<{ fixture: { referee?: string } }> };
      const refRaw = json.response?.[0]?.fixture?.referee ?? null;
      if (refRaw) {
        const parts = refRaw.split(",").map((s: string) => s.trim());
        if (!referee) referee = parts[0] ?? refRaw;
        if (!refereeCountry) refereeCountry = parts[1] ?? null;
        // Persist to Supabase for future calls
        if (referee || refereeCountry) {
          void supabase.from("matches").update({ referee, referee_country: refereeCountry }).eq("id", matchId);
        }
      }
    } catch { /* non-fatal */ }
  }

  // ── Events: goals, cards, subs ────────────────────────────────────────────
  const events: MatchDetailEvent[] = [];
  if (fixtureId) {
    try {
      const rawEvents = await getFixtureEvents(fixtureId) as Array<{
        time: { elapsed: number; extra: number | null };
        team: { name: string; logo: string };
        player: { name: string };
        assist?: { name: string | null };
        type: string;
        detail: string;
      }>;
      for (const e of rawEvents ?? []) {
        if (!["Goal", "subst", "Card"].includes(e.type)) continue;
        events.push({
          minute: e.time.elapsed,
          minuteExtra: e.time.extra,
          teamName: e.team.name,
          teamLogo: e.team.logo,
          playerName: e.player.name,
          assistName: e.assist?.name ?? null,
          type: e.type,
          detail: e.detail,
        });
      }
    } catch { /* non-fatal */ }
  }

  // ── Lineups ───────────────────────────────────────────────────────────────
  let homeLineup: TeamLineup | null = null;
  let awayLineup: TeamLineup | null = null;

  if (fixtureId) {
    try {
      const rawLineups = await getFixtureLineups(fixtureId) as Array<{
        team: { id: number; name: string; logo: string };
        coach: { name: string };
        formation: string;
        startXI: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
        substitutes: Array<{ player: { id: number; name: string; number: number; pos: string; grid: string | null } }>;
      }>;

      // Match DB team IDs to API teams
      const { data: homeTeam } = await supabase.from("teams").select("api_football_team_id").eq("id", match.home_team_id).single();
      const { data: awayTeam } = await supabase.from("teams").select("api_football_team_id").eq("id", match.away_team_id).single();

      for (const lu of rawLineups ?? []) {
        const isHome = homeTeam && lu.team.id === homeTeam.api_football_team_id;
        const isAway = awayTeam && lu.team.id === awayTeam.api_football_team_id;
        const lineup: TeamLineup = {
          teamId: isHome ? match.home_team_id : (isAway ? match.away_team_id : null),
          teamName: lu.team.name,
          teamLogo: lu.team.logo,
          formation: lu.formation,
          coach: lu.coach?.name ?? null,
          starters: (lu.startXI ?? []).map((p) => ({
            id: p.player.id,
            name: p.player.name,
            number: p.player.number,
            position: p.player.pos,
            grid: p.player.grid,
          })),
          substitutes: (lu.substitutes ?? []).map((p) => ({
            id: p.player.id,
            name: p.player.name,
            number: p.player.number,
            position: p.player.pos,
            grid: p.player.grid,
          })),
        };
        if (isHome) homeLineup = lineup;
        else if (isAway) awayLineup = lineup;
        else if (!homeLineup) homeLineup = lineup;
        else awayLineup = lineup;
      }
    } catch { /* non-fatal */ }
  }

  return NextResponse.json({
    referee,
    refereeCountry,
    lineups: { home: homeLineup, away: awayLineup },
    events,
  } satisfies MatchDetailResponse);
}
