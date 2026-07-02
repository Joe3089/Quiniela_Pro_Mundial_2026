import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import {
  getTeamPlayers,
  getWCFixtures,
  getWCTeams,
  getFixtureEvents,
  type AFFixture,
  type AFTeam,
} from "@/services/api-football";
import { notifyMatchFinished, sendInternalNotification, notifyRecordBroken } from "@/services/notifications";
import { runBracketSync } from "@/app/api/football/bracket/sync/route";
import { syncVideosForMatch } from "@/app/api/youtube/sync/route";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = err as Record<string, unknown>;
    // PostgrestError has message + code + details + hint
    if (e.message) return `${e.message}${e.details ? ` — ${e.details}` : ""}${e.hint ? ` (hint: ${e.hint})` : ""}`;
    return JSON.stringify(e);
  }
  return String(err);
}

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type SyncAction = "teams" | "fixtures" | "players" | "scores" | "all";

type SyncAuth =
  | { error: string; supabase: null; status: number }
  | { error: null; supabase: SupabaseClient; status: 200 };

async function requireSyncAccess(request: NextRequest): Promise<SyncAuth> {
  const secret = process.env.FOOTBALL_SYNC_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const isVercelCron = request.headers.get("user-agent") === "vercel-cron/1.0";

  if ((secret && bearer === secret) || isVercelCron) {
    return { error: null, supabase: await createAdminClient(), status: 200 };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized", supabase: null, status: 401 };

  const { data: profile } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "Forbidden", supabase: null, status: 403 };

  return { error: null, supabase, status: 200 };
}

export async function GET(request: NextRequest) {
  const isVercelCron = request.headers.get("user-agent") === "vercel-cron/1.0";
  const actionParam = request.nextUrl.searchParams.get("action");

  if (isVercelCron || actionParam) {
    const { error, supabase, status } = await requireSyncAccess(request);
    if (error || !supabase) return NextResponse.json({ error }, { status });

    const action = normalizeAction(actionParam);
    const results: Record<string, unknown> = {};

    try {
      if (action === "teams" || action === "all") {
        results.teams = await syncTeams(supabase);
      }

      if (action === "fixtures" || action === "all") {
        results.fixtures = await syncFixtures(supabase, { onlyPlayedOrLive: false });
      }

      if (action === "scores" || action === "all") {
        const scoresResult = await syncFixtures(supabase, { onlyPlayedOrLive: true });
        results.scores = scoresResult;
        results.events = await syncEvents(supabase);
        results.records = await checkAndNotifyBrokenRecords(supabase);
        results.scoring = await scoreFinishedMatches(supabase);
        results.bracket = await runBracketSync().catch(() => ({ status: "error" }));

        // Trigger video sync for matches that just became finished
        if (scoresResult.justFinished?.length) {
          const videoResults = await Promise.all(
            scoresResult.justFinished.map((m) =>
              syncVideosForMatch(
                supabase, m.id,
                m.homeTeamName, m.awayTeamName,
                m.homeTeamCode, m.awayTeamCode,
                m.hasPenalties
              ).catch(() => ({ added: 0 }))
            )
          );
          results.videos = {
            matches: scoresResult.justFinished.length,
            videosAdded: videoResults.reduce((s, r) => s + r.added, 0),
          };
        }
      }

      return NextResponse.json({ ok: true, action, source: isVercelCron ? "vercel-cron" : "manual-get", results });
    } catch (err) {
      console.error("[api-football sync:get]", err);
      return NextResponse.json({ error: serializeError(err) }, { status: 500 });
    }
  }

  const { error, status } = await requireSyncAccess(request);
  if (error) return NextResponse.json({ error }, { status });

  return NextResponse.json({
    ok: true,
    endpoints: ["teams", "fixtures", "players", "scores", "all"],
    auth: process.env.FOOTBALL_SYNC_SECRET ? "admin-session-or-bearer" : "admin-session",
  });
}

export async function POST(request: NextRequest) {
  const { error, supabase, status } = await requireSyncAccess(request);
  if (error || !supabase) return NextResponse.json({ error }, { status });

  const body = await request.json().catch(() => ({}));
  const action = normalizeAction(body.action);
  const results: Record<string, unknown> = {};

  try {
    if (action === "teams" || action === "all") {
      results.teams = await syncTeams(supabase);
    }

    if (action === "fixtures" || action === "all") {
      results.fixtures = await syncFixtures(supabase, { onlyPlayedOrLive: false });
    }

    if (action === "scores" || action === "all") {
      const scoresResult = await syncFixtures(supabase, { onlyPlayedOrLive: true });
      results.scores = scoresResult;
      results.events = await syncEvents(supabase);
      results.records = await checkAndNotifyBrokenRecords(supabase);
      results.scoring = await scoreFinishedMatches(supabase);
      results.bracket = await runBracketSync().catch(() => ({ status: "error" }));

      // Trigger video sync for matches that just became finished
      if (scoresResult.justFinished?.length) {
        const videoResults = await Promise.all(
          scoresResult.justFinished.map((m) =>
            syncVideosForMatch(
              supabase, m.id,
              m.homeTeamName, m.awayTeamName,
              m.homeTeamCode, m.awayTeamCode,
              m.hasPenalties
            ).catch(() => ({ added: 0 }))
          )
        );
        results.videos = {
          matches: scoresResult.justFinished.length,
          videosAdded: videoResults.reduce((s, r) => s + r.added, 0),
        };
      }
    }

    if (action === "players") {
      results.players = await fetchPlayerPhotoSample();
    }

    return NextResponse.json({ ok: true, action, results });
  } catch (err) {
    console.error("[api-football sync]", err);
    return NextResponse.json({ error: serializeError(err) }, { status: 500 });
  }
}

function normalizeAction(action: unknown): SyncAction {
  if (["teams", "fixtures", "players", "scores", "all"].includes(String(action))) {
    return action as SyncAction;
  }
  return "scores";
}

async function syncTeams(supabase: SupabaseClient) {
  const afTeams = await getWCTeams();
  let updated = 0;
  let skipped = 0;

  for (const team of afTeams) {
    const { data: existing } = await findTeam(supabase, team.team);
    if (!existing?.id) {
      skipped++;
      continue;
    }

    const { error } = await supabase
      .from("teams")
      .update({
        api_football_team_id: team.team.id,
        flag_url: team.team.logo,
      })
      .eq("id", existing.id);

    if (error) throw new Error(serializeError(error));
    updated++;
  }

  return { total: afTeams.length, updated, skipped };
}

type JustFinishedMatch = {
  id: string;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  hasPenalties: boolean;
};

async function syncFixtures(
  supabase: SupabaseClient,
  { onlyPlayedOrLive }: { onlyPlayedOrLive: boolean }
) {
  const fixtures = await getWCFixtures({ revalidate: onlyPlayedOrLive ? 0 : 3600 });
  const selectedFixtures = onlyPlayedOrLive ? fixtures.filter(isPlayedOrLive) : fixtures;
  let updated = 0;
  let inserted = 0;
  let skipped = 0;
  const justFinished: JustFinishedMatch[] = [];

  // Pre-load group-phase teams → group_id mapping
  // KO protection is in the groupId assignment below (phase === "group" conditional)
  const { data: allMatches } = await supabase
    .from("matches")
    .select("home_team_id, away_team_id, group_id")
    .not("group_id", "is", null);
  const teamGroupMap = new Map<string, string>();
  for (const m of (allMatches ?? []) as { home_team_id: string; away_team_id: string; group_id: string }[]) {
    if (m.home_team_id) teamGroupMap.set(m.home_team_id, m.group_id);
    if (m.away_team_id) teamGroupMap.set(m.away_team_id, m.group_id);
  }

  // Pre-load current statuses to detect finish transitions
  const { data: currentMatches } = await supabase
    .from("matches")
    .select("id, status, home_team_id, away_team_id, api_football_fixture_id");
  const currentStatusMap = new Map<number, { id: string; status: string; homeTeamId: string; awayTeamId: string }>();
  for (const m of (currentMatches ?? []) as { id: string; status: string; home_team_id: string; away_team_id: string; api_football_fixture_id: number | null }[]) {
    if (m.api_football_fixture_id) {
      currentStatusMap.set(m.api_football_fixture_id, { id: m.id, status: m.status, homeTeamId: m.home_team_id, awayTeamId: m.away_team_id });
    }
  }

  // Pre-load team names + codes for just-finished detection
  const { data: teamRows } = await supabase.from("teams").select("id, name, fifa_code");
  const teamById = new Map<string, { name: string; fifa_code: string | null }>();
  for (const t of (teamRows ?? []) as { id: string; name: string; fifa_code: string | null }[]) {
    teamById.set(t.id, { name: t.name, fifa_code: t.fifa_code });
  }

  for (const fixture of selectedFixtures) {
    const home = await findTeam(supabase, fixture.teams.home);
    const away = await findTeam(supabase, fixture.teams.away);

    if (!home.data?.id || !away.data?.id) {
      skipped++;
      continue;
    }

    const existing = await findExistingMatch(supabase, fixture, home.data.id, away.data.id);
    const phase = mapPhase(fixture.league.round);
    // Only group-stage matches get a group_id; KO matches always get null
    const groupId = phase === "group" ? (teamGroupMap.get(home.data.id) ?? teamGroupMap.get(away.data.id) ?? null) : null;
    const matchData = toMatchRow(fixture, home.data.id, away.data.id, groupId);
    const newStatus = matchData.status;

    if (existing?.id) {
      // Check if this match just transitioned to "finished"
      const prev = currentStatusMap.get(fixture.fixture.id);
      const wasFinished = prev?.status === "finished";
      const isNowFinished = newStatus === "finished";

      const { error } = await supabase.from("matches").update(matchData).eq("id", existing.id);
      if (error) throw new Error(serializeError(error));
      updated++;

      // Track newly finished matches for video sync
      if (!wasFinished && isNowFinished) {
        const homeTeam = teamById.get(home.data.id);
        const awayTeam = teamById.get(away.data.id);
        justFinished.push({
          id: existing.id,
          homeTeamName: homeTeam?.name ?? null,
          awayTeamName: awayTeam?.name ?? null,
          homeTeamCode: homeTeam?.fifa_code ?? null,
          awayTeamCode: awayTeam?.fifa_code ?? null,
          hasPenalties: fixture.score.penalty.home != null && fixture.score.penalty.away != null,
        });
      }
    } else {
      const { error } = await supabase.from("matches").insert(matchData);
      if (error) throw new Error(serializeError(error));
      inserted++;
    }
  }

  return { total: fixtures.length, checked: selectedFixtures.length, updated, inserted, skipped, justFinished };
}

async function findTeam(supabase: SupabaseClient, team: AFTeam["team"] | AFFixture["teams"]["home"]) {
  if (team.id) {
    const byApiId = await supabase
      .from("teams")
      .select("id")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("api_football_team_id", team.id)
      .maybeSingle();

    if (byApiId.data || byApiId.error) return byApiId;
  }

  const code = "code" in team ? team.code : null;
  if (code) {
    const byCode = await supabase
      .from("teams")
      .select("id")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("fifa_code", code)
      .maybeSingle();

    if (byCode.data || byCode.error) return byCode;
  }

  return supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", TOURNAMENT_ID)
    .ilike("name", `%${team.name.split(" ")[0]}%`)
    .maybeSingle();
}

async function findExistingMatch(
  supabase: SupabaseClient,
  fixture: AFFixture,
  homeTeamId: string,
  awayTeamId: string
) {
  // 1. Exact match by API fixture ID (fastest)
  const byApiId = await supabase
    .from("matches")
    .select("id")
    .eq("api_football_fixture_id", fixture.fixture.id)
    .maybeSingle();

  if (byApiId.data?.id) return byApiId.data;
  if (byApiId.error) throw byApiId.error;

  // 2. Match by team pair + exact date
  const { data: byDate, error: e2 } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("home_team_id", homeTeamId)
    .eq("away_team_id", awayTeamId)
    .eq("match_date", fixture.fixture.date)
    .maybeSingle();

  if (e2) throw e2;
  if (byDate?.id) return byDate;

  // 3. Lenient: same team pair within 4-hour window (handles timezone offsets)
  const fixtureTime = new Date(fixture.fixture.date).getTime();
  const windowMs = 4 * 60 * 60 * 1000;
  const from = new Date(fixtureTime - windowMs).toISOString();
  const to   = new Date(fixtureTime + windowMs).toISOString();

  const { data: byWindow, error: e3 } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("home_team_id", homeTeamId)
    .eq("away_team_id", awayTeamId)
    .gte("match_date", from)
    .lte("match_date", to)
    .maybeSingle();

  if (e3) throw e3;
  if (byWindow?.id) return byWindow;

  // 4. Last resort for group stage: same team pair, any date (each pair plays once)
  const { data: byTeams, error: e4 } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("home_team_id", homeTeamId)
    .eq("away_team_id", awayTeamId)
    .not("group_id", "is", null)
    .maybeSingle();

  if (e4) throw e4;
  return byTeams;
}

function toMatchRow(fixture: AFFixture, homeTeamId: string, awayTeamId: string, groupId: string | null = null) {
  const refRaw = fixture.fixture.referee ?? null;
  const refParts = refRaw ? refRaw.split(",").map((s) => s.trim()) : [];
  return {
    tournament_id: TOURNAMENT_ID,
    group_id: groupId,
    api_football_fixture_id: fixture.fixture.id,
    api_football_status: fixture.fixture.status.short,
    api_football_home_team_id: fixture.teams.home.id,
    api_football_away_team_id: fixture.teams.away.id,
    elapsed: fixture.fixture.status.elapsed,
    phase: mapPhase(fixture.league.round),
    home_team_id: homeTeamId,
    away_team_id: awayTeamId,
    home_score: fixture.goals.home,
    away_score: fixture.goals.away,
    home_score_penalties: fixture.score.penalty.home,
    away_score_penalties: fixture.score.penalty.away,
    match_date: fixture.fixture.date,
    venue: fixture.fixture.venue.name,
    city: fixture.fixture.venue.city,
    status: mapStatus(fixture.fixture.status.short),
    referee: refParts[0] ?? null,
    referee_country: refParts[1] ?? null,
  };
}

async function syncEvents(supabase: SupabaseClient) {
  // Get finished matches with an API fixture ID
  const { data: finished } = await supabase
    .from("matches")
    .select("id, api_football_fixture_id, home_team_id, away_team_id, api_football_home_team_id, api_football_away_team_id")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("status", "finished")
    .not("api_football_fixture_id", "is", null);

  if (!finished?.length) return { synced: 0, skipped: 0 };

  // Find match_ids that already have events (skip them)
  const { data: existing } = await supabase
    .from("match_events")
    .select("match_id")
    .in("match_id", finished.map((m) => m.id));

  const alreadySynced = new Set((existing ?? []).map((e) => e.match_id));
  const toSync = finished.filter((m) => !alreadySynced.has(m.id));

  let synced = 0;
  for (const match of toSync) {
    try {
      const events = await getFixtureEvents(match.api_football_fixture_id as number);
      const goalEvents = events.filter(
        (e) => e.type === "Goal" && e.detail !== "Missed Penalty"
      );
      if (!goalEvents.length) continue;

      const rows = goalEvents.map((e) => ({
        match_id: match.id,
        tournament_id: TOURNAMENT_ID,
        team_id: e.team.id === match.api_football_home_team_id ? match.home_team_id : match.away_team_id,
        type: "goal",
        player_name: e.player.name,
        minute: e.time.elapsed,
        minute_extra: e.time.extra ?? null,
        assist_name: e.assist.name ?? null,
      }));

      await supabase.from("match_events").insert(rows);
      synced++;
    } catch { /* skip individual match failures */ }
  }

  return { synced, skipped: alreadySynced.size };
}

// ── Record-broken auto-notifications ─────────────────────────────────────────
// Runs after each syncEvents. Sends in-app + email/WhatsApp the FIRST time a
// record threshold is crossed. De-duplicates via notifications table check.
async function checkAndNotifyBrokenRecords(supabase: SupabaseClient) {
  // Current WC2026 goals per player from match_events
  const { data: events } = await supabase
    .from("match_events")
    .select("player_name")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("type", "goal");

  const wc2026: Record<string, number> = {};
  for (const e of events ?? []) {
    wc2026[e.player_name] = (wc2026[e.player_name] ?? 0) + 1;
  }

  // base = pre-2026 historical goals (must mirror wc-history.ts)
  const SCORERS = [
    { event: "L. Messi",   name: "Lionel Messi",     base: 13 },
    { event: "K. Mbappe",  name: "Kylian Mbappé",    base: 12 },
    { event: "H. Kane",    name: "Harry Kane",        base: 8  },
    { event: "C. Ronaldo", name: "Cristiano Ronaldo", base: 8  },
  ];

  // Records to monitor: id (unique key), threshold, description of prior record
  const RECORD_THRESHOLDS = [
    { id: "all_time_goals_16", threshold: 16, prevHolder: "Miroslav Klose", prevValue: 16 },
    { id: "single_edition_13", threshold: 13, prevHolder: "Just Fontaine",  prevValue: 13 },
  ];

  const { data: allUsers } = await supabase.from("users").select("id");
  const userIds = (allUsers ?? []).map((u: { id: string }) => u.id);

  let notified = 0;
  for (const scorer of SCORERS) {
    const total = scorer.base + (wc2026[scorer.event] ?? 0);
    const wc2026Goals = wc2026[scorer.event] ?? 0;

    for (const rec of RECORD_THRESHOLDS) {
      if (total <= rec.threshold) continue;
      if (rec.id === "single_edition_13" && wc2026Goals <= rec.threshold) continue;

      // De-dup: check if already notified for this scorer+record combo
      const notifKey = `${rec.id}:${scorer.name}`;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("type", "record_broken")
        .like("body", `%${notifKey}%`);

      if ((count ?? 0) > 0) continue;

      // In-app notification
      if (userIds.length) {
        await sendInternalNotification(supabase, {
          tournamentId: TOURNAMENT_ID,
          type: "record_broken",
          title: `🏆 ¡Récord histórico roto!`,
          body: `[${notifKey}] ${scorer.name} supera a ${rec.prevHolder} con ${total} goles en la historia de los Mundiales.`,
          userIds,
        });
      }

      // Email + WhatsApp
      await notifyRecordBroken({
        playerName: scorer.name,
        totalGoals: total,
        previousHolder: rec.prevHolder,
        previousRecord: rec.prevValue,
      }).catch(() => { /* non-fatal */ });

      notified++;
    }
  }

  return { notified };
}

function isPlayedOrLive(fixture: AFFixture) {
  return ["FT", "AET", "PEN", "1H", "2H", "HT", "ET", "BT", "P", "INT", "LIVE"].includes(
    fixture.fixture.status.short
  );
}

async function fetchPlayerPhotoSample() {
  const teamIds: Record<string, number> = {
    MEX: 16,
    USA: 2,
    CAN: 95,
    ARG: 26,
    BRA: 6,
    FRA: 2,
    ESP: 9,
    GER: 25,
    POR: 29,
    ENG: 47,
    NED: 1118,
    JPN: 21,
    KOR: 149,
    URU: 31,
    COL: 39,
    CRO: 2288,
    BEL: 1,
    MAR: 32,
    SEN: 1066,
    EGY: 1568,
    AUS: 25,
    SUI: 3,
    TUR: 19,
    POL: 24,
    DEN: 1553,
    NOR: 772,
    SWE: 753,
    GHA: 1089,
  };

  const allPhotos: { lastName: string; photo: string; apiId: number }[] = [];

  for (const teamId of Object.values(teamIds)) {
    try {
      const players = await getTeamPlayers(teamId);
      for (const player of players) {
        allPhotos.push({
          lastName: player.player.lastname,
          photo: player.player.photo,
          apiId: player.player.id,
        });
      }
    } catch {
      // API-Football can miss national-team player lists this early.
    }
  }

  return {
    fetched: allPhotos.length,
    note: "Use these apiFootballId values in wc2026-teams.ts player entries to enable real photos",
    sample: allPhotos.slice(0, 10),
  };
}

function mapStatus(short: string): string {
  const map: Record<string, string> = {
    TBD: "scheduled",
    NS: "scheduled",
    "1H": "live",
    HT: "live",
    "2H": "live",
    ET: "live",
    BT: "live",
    P: "live",
    INT: "live",
    LIVE: "live",
    FT: "finished",
    AET: "finished",
    PEN: "finished",
    PST: "postponed",
    CANC: "cancelled",
    ABD: "cancelled",
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

// ── Auto-scoring: runs after each score sync ──────────────────────────────────
// Uses score_predictions_for_match + refresh_rank_positions RPCs (pre-existing DB functions)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function scoreFinishedMatches(supabase: any) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  // Get recently finished matches — filter status in JS to avoid enum cast issue
  const { data: recentMatches, error: mErr } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, match_date, venue, status")
    .eq("tournament_id", TOURNAMENT_ID)
    .not("home_score", "is", null)
    .gte("match_date", since);

  const matches = (recentMatches ?? []).filter((m: { status: string }) => m.status === "finished");
  if (mErr || !matches.length) return { scored: 0, notified: 0 };

  let scored = 0;
  let notified = 0;

  for (const match of matches) {
    // Check if there are unscored predictions for this match
    const { count } = await supabase
      .from("predictions")
      .select("id", { count: "exact", head: true })
      .eq("match_id", match.id)
      .is("points_earned", null);

    if (!count) continue;

    try {
      // Use the existing DB function to score all predictions for this match at once
      await supabase.rpc("score_predictions_for_match", { p_match_id: match.id });
      scored += count as number;

      // Refresh all user rankings for this tournament
      await supabase.rpc("refresh_rank_positions", { p_tournament_id: TOURNAMENT_ID });
    } catch { /* non-fatal */ }

    // Send notification
    try {
      const [{ data: homeTeam }, { data: awayTeam }, { data: ranking }] = await Promise.all([
        supabase.from("teams").select("name").eq("id", match.home_team_id).single(),
        supabase.from("teams").select("name").eq("id", match.away_team_id).single(),
        supabase.from("rankings")
          .select("total_points, rank_position, users(display_name, username)")
          .eq("tournament_id", TOURNAMENT_ID)
          .order("total_points", { ascending: false })
          .limit(5),
      ]);

      const matchTitle = `${homeTeam?.name ?? "Home"} ${match.home_score ?? 0}–${match.away_score ?? 0} ${awayTeam?.name ?? "Away"}`;

      await notifyMatchFinished({
        homeTeam: homeTeam?.name ?? "Home",
        awayTeam: awayTeam?.name ?? "Away",
        homeScore: match.home_score ?? 0,
        awayScore: match.away_score ?? 0,
        matchDate: match.match_date,
        venue: match.venue,
        rankingUpdated: true,
        topRanking: ranking?.map((r: { rank_position: number | null; total_points: number; users: { display_name: string | null; username: string } }, i: number) => ({
          position: r.rank_position ?? i + 1,
          displayName: r.users?.display_name ?? r.users?.username ?? "?",
          points: r.total_points,
        })),
      });

      // Internal notifications — broadcast to ALL tournament users
      const { data: allUsers } = await supabase
        .from("users")
        .select("id");
      const allUserIds = (allUsers ?? []).map((u: { id: string }) => u.id);

      if (allUserIds.length) {
        await sendInternalNotification(supabase, {
          tournamentId: TOURNAMENT_ID,
          type: "match_finished",
          title: `⚽ Partido finalizado`,
          body: matchTitle,
          userIds: allUserIds,
        });
        await sendInternalNotification(supabase, {
          tournamentId: TOURNAMENT_ID,
          type: "ranking_update",
          title: `📊 Ranking actualizado`,
          body: `Clasificación actualizada tras ${matchTitle}`,
          userIds: allUserIds,
        });
      }
      notified++;
    } catch { /* notification failure is non-fatal */ }
  }

  return { scored, notified };
}
