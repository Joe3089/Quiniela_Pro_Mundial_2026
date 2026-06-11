import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getWCTeams, getWCFixtures, getTeamPlayers,
  type AFFixture, type AFTeam,
} from "@/services/api-football";

// Admin-only sync endpoint
async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", supabase: null };
  const { data: profile } = await supabase.from("users").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { error: "Forbidden", supabase: null };
  return { error: null, supabase };
}

// ── STATUS ──────────────────────────────────────────────────────────────────
export async function GET() {
  const { error } = await requireAdmin();
  if (error) return NextResponse.json({ error }, { status: error === "Unauthorized" ? 401 : 403 });
  return NextResponse.json({ ok: true, endpoints: ["teams", "fixtures", "players", "scores"] });
}

// ── SYNC ────────────────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const { error, supabase } = await requireAdmin();
  if (error || !supabase) return NextResponse.json({ error }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const action: string = body.action ?? "fixtures";
  const results: Record<string, unknown> = {};

  try {
    // ── SYNC FIXTURES ──────────────────────────────────────────────────────
    if (action === "fixtures" || action === "all") {
      const fixtures = await getWCFixtures();
      let updated = 0, inserted = 0;

      for (const f of fixtures) {
        const status = mapStatus(f.fixture.status.short);
        const phase = mapPhase(f.league.round);

        // Find matching home/away teams by name in our DB
        const homeName = f.teams.home.name;
        const awayName = f.teams.away.name;

        const { data: homeTeam } = await supabase
          .from("teams").select("id").ilike("name", `%${homeName.split(" ")[0]}%`).single();
        const { data: awayTeam } = await supabase
          .from("teams").select("id").ilike("name", `%${awayName.split(" ")[0]}%`).single();

        if (!homeTeam || !awayTeam) continue;

        // Check if match exists
        const { data: existing } = await supabase
          .from("matches")
          .select("id")
          .eq("home_team_id", homeTeam.id)
          .eq("away_team_id", awayTeam.id)
          .eq("phase", phase)
          .maybeSingle();

        const matchData = {
          tournament_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          phase,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          home_score: f.goals.home,
          away_score: f.goals.away,
          home_score_penalties: f.score.penalty.home,
          away_score_penalties: f.score.penalty.away,
          match_date: f.fixture.date,
          venue: f.fixture.venue.name,
          city: f.fixture.venue.city,
          status,
        };

        if (existing) {
          await supabase.from("matches").update(matchData).eq("id", existing.id);
          updated++;
        } else {
          await supabase.from("matches").insert(matchData);
          inserted++;
        }
      }

      results.fixtures = { total: fixtures.length, updated, inserted };
    }

    // ── SYNC TEAMS (flag_url from API) ─────────────────────────────────────
    if (action === "teams" || action === "all") {
      const afTeams = await getWCTeams();
      let updated = 0;

      for (const aft of afTeams) {
        const { error: e } = await supabase
          .from("teams")
          .update({ flag_url: aft.team.logo })
          .ilike("name", `%${aft.team.name.split(" ")[0]}%`);
        if (!e) updated++;
      }

      results.teams = { total: afTeams.length, updated };
    }

    // ── SYNC PLAYERS PHOTOS ────────────────────────────────────────────────
    // Fetches player data from API-Football using the team IDs below.
    // WC 2026 league data isn't populated yet so we fall back to 2024 season.
    if (action === "players") {
      // API-Football team IDs for WC 2026 teams (from 2024 club data)
      const TEAM_IDS: Record<string, number> = {
        MEX: 16, USA: 2, CAN: 95, ARG: 26, BRA: 6,
        FRA: 2, ESP: 9, GER: 25, POR: 29, ENG: 47,
        NED: 1118, JPN: 21, KOR: 149, URU: 31, COL: 39,
        CRO: 2288, BEL: 1, MAR: 32, SEN: 1066, EGY: 1568,
        AUS: 25, SUI: 3, TUR: 19, POL: 24, DEN: 1553,
        NOR: 772, SWE: 753, GHA: 1089,
      };

      const allPhotos: { lastName: string; photo: string; apiId: number }[] = [];

      for (const [code, teamId] of Object.entries(TEAM_IDS)) {
        try {
          const players = await getTeamPlayers(teamId);
          for (const p of players) {
            allPhotos.push({
              lastName: p.player.lastname,
              photo: p.player.photo,
              apiId: p.player.id,
            });
          }
        } catch {
          // skip if team not found
        }
      }

      results.players = {
        fetched: allPhotos.length,
        note: "Use these apiFootballId values in wc2026-teams.ts player entries to enable real photos",
        sample: allPhotos.slice(0, 10),
      };
    }

    // ── SYNC SCORES (update live/finished match scores) ────────────────────
    if (action === "scores" || action === "all") {
      const fixtures = await getWCFixtures();
      let updated = 0;

      const played = fixtures.filter(f =>
        ["FT", "AET", "PEN", "1H", "2H", "HT", "LIVE"].includes(f.fixture.status.short)
      );

      for (const f of played) {
        const homeName = f.teams.home.name;
        const awayName = f.teams.away.name;

        const { data: homeTeam } = await supabase
          .from("teams").select("id").ilike("name", `%${homeName.split(" ")[0]}%`).single();
        const { data: awayTeam } = await supabase
          .from("teams").select("id").ilike("name", `%${awayName.split(" ")[0]}%`).single();

        if (!homeTeam || !awayTeam) continue;

        const { error: e } = await supabase
          .from("matches")
          .update({
            home_score: f.goals.home,
            away_score: f.goals.away,
            home_score_penalties: f.score.penalty.home,
            away_score_penalties: f.score.penalty.away,
            status: mapStatus(f.fixture.status.short),
          })
          .eq("home_team_id", homeTeam.id)
          .eq("away_team_id", awayTeam.id);

        if (!e) updated++;
      }

      results.scores = { checked: played.length, updated };
    }

    return NextResponse.json({ ok: true, action, results });
  } catch (err) {
    console.error("[api-football sync]", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

// ── Mappers ────────────────────────────────────────────────────────────────

function mapStatus(short: string): string {
  const map: Record<string, string> = {
    "TBD": "scheduled", "NS": "scheduled",
    "1H": "live", "HT": "live", "2H": "live", "ET": "live",
    "BT": "live", "P": "live", "INT": "live", "LIVE": "live",
    "FT": "finished", "AET": "finished", "PEN": "finished",
    "PST": "postponed", "CANC": "cancelled", "ABD": "cancelled",
  };
  return map[short] ?? "scheduled";
}

function mapPhase(round: string): string {
  const r = round.toLowerCase();
  if (r.includes("group")) return "group";
  if (r.includes("round of 32") || r.includes("1/16")) return "round_of_32";
  if (r.includes("round of 16") || r.includes("1/8")) return "round_of_16";
  if (r.includes("quarter")) return "quarter_final";
  if (r.includes("semi")) return "semi_final";
  if (r.includes("3rd") || r.includes("third") || r.includes("place")) return "third_place";
  if (r.includes("final")) return "final";
  return "group";
}
