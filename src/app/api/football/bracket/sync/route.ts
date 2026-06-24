import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { TOURNAMENT_ID } from "@/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

// Group letter → group UUID
const GROUP_UUIDS: Record<string, string> = {
  A: "aa000000-0000-0000-0000-000000000001",
  B: "aa000000-0000-0000-0000-000000000002",
  C: "aa000000-0000-0000-0000-000000000003",
  D: "aa000000-0000-0000-0000-000000000004",
  E: "aa000000-0000-0000-0000-000000000005",
  F: "aa000000-0000-0000-0000-000000000006",
  G: "aa000000-0000-0000-0000-000000000007",
  H: "aa000000-0000-0000-0000-000000000008",
  I: "aa000000-0000-0000-0000-000000000009",
  J: "aa000000-0000-0000-0000-00000000000a",
  K: "aa000000-0000-0000-0000-00000000000b",
  L: "aa000000-0000-0000-0000-00000000000c",
};
const GROUPS = Object.keys(GROUP_UUIDS);

// R32 seeding: ordered by match date. Each entry maps to the nth R32 match (date-ordered).
// Format: { home: [group, position], away: [group, position] } where position 1=winner, 2=runner-up, 3=best3rd
const R32_SEEDING: Array<{ home: [string, number]; away: [string, number] }> = [
  { home: ["A", 1], away: ["B", 2] }, // slot 0 - Jun 29
  { home: ["C", 1], away: ["D", 2] }, // slot 1 - Jun 29
  { home: ["E", 1], away: ["F", 2] }, // slot 2 - Jun 30
  { home: ["G", 1], away: ["H", 2] }, // slot 3 - Jun 30
  { home: ["I", 1], away: ["J", 2] }, // slot 4 - Jul 1
  { home: ["K", 1], away: ["L", 2] }, // slot 5 - Jul 1
  { home: ["B", 1], away: ["A", 2] }, // slot 6 - Jul 2
  { home: ["D", 1], away: ["C", 2] }, // slot 7 - Jul 2
  { home: ["F", 1], away: ["E", 2] }, // slot 8 - Jul 3
  { home: ["H", 1], away: ["G", 2] }, // slot 9 - Jul 3
  { home: ["J", 1], away: ["I", 2] }, // slot 10 - Jul 4
  { home: ["L", 1], away: ["K", 2] }, // slot 11 - Jul 4
  // slots 12-15: 8 best 3rd-place teams (handled separately below)
];

// KO bracket pairing: consecutive R32 matches pair into R16, etc.
// [slot_a, slot_b] → next_slot, home = winner of slot_a, away = winner of slot_b
const KO_PAIRS: { phase: string; pairs: [number, number][] }[] = [
  {
    phase: "round_of_16",
    pairs: [[0, 1], [2, 3], [4, 5], [6, 7], [8, 9], [10, 11], [12, 13], [14, 15]],
  },
  {
    phase: "quarter_final",
    pairs: [[0, 1], [2, 3], [4, 5], [6, 7]],
  },
  {
    phase: "semi_final",
    pairs: [[0, 1], [2, 3]],
  },
  {
    phase: "final",
    pairs: [[0, 1]],
  },
];

type TeamStanding = {
  team_id: string;
  points: number;
  goal_difference: number;
  goals_for: number;
  played: number;
  group: string;
  position: number;
};

export async function GET() {
  try {
    const result = await runBracketSync();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST() {
  return GET();
}

export async function runBracketSync() {
  const supabase = await createAdminClient();

  // ── 1. Load all group standings ──────────────────────────────────────────────
  const { data: standingsRaw } = await supabase
    .from("standings")
    .select("team_id, group_id, points, goal_difference, goals_for, played")
    .eq("tournament_id", TOURNAMENT_ID);

  if (!standingsRaw || standingsRaw.length === 0) {
    return { status: "no_standings" };
  }

  // Build group → ranked teams map
  const groupTeams: Record<string, TeamStanding[]> = {};
  for (const s of standingsRaw) {
    const letter = GROUPS.find((g) => GROUP_UUIDS[g] === s.group_id);
    if (!letter) continue;
    if (!groupTeams[letter]) groupTeams[letter] = [];
    groupTeams[letter].push({ ...s, group: letter, position: 0 });
  }

  // Sort each group and assign positions
  for (const letter of GROUPS) {
    const teams = groupTeams[letter] ?? [];
    teams.sort((a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for
    );
    teams.forEach((t, i) => { t.position = i + 1; });
  }

  // Check how many groups have all 3 games played (6 games per group → each team played 3)
  const completedGroups = GROUPS.filter((g) => {
    const teams = groupTeams[g] ?? [];
    return teams.length === 4 && teams.every((t) => t.played >= 3);
  });

  // ── 2. Load R32 matches ordered by date ──────────────────────────────────────
  const { data: r32Matches } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, match_date, status")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("phase", "round_of_32")
    .order("match_date", { ascending: true });

  const r32 = r32Matches ?? [];
  const updates: Array<{ id: string; home_team_id?: string; away_team_id?: string }> = [];

  // ── 3. Populate R32 slots from group qualifiers ───────────────────────────────
  for (let slot = 0; slot < Math.min(R32_SEEDING.length, r32.length); slot++) {
    const match = r32[slot];
    if (!match) continue;
    // Skip if already populated
    if (match.home_team_id && match.away_team_id) continue;

    const seeding = R32_SEEDING[slot];
    const [homeGroup, homePos] = seeding.home;
    const [awayGroup, awayPos] = seeding.away;

    const homeTeams = groupTeams[homeGroup] ?? [];
    const awayTeams = groupTeams[awayGroup] ?? [];

    const homeTeam = homeTeams.find((t) => t.position === homePos);
    const awayTeam = awayTeams.find((t) => t.position === awayPos);

    // Only assign if the group is complete
    const homeReady = completedGroups.includes(homeGroup) && homeTeam;
    const awayReady = completedGroups.includes(awayGroup) && awayTeam;

    const update: { id: string; home_team_id?: string; away_team_id?: string } = { id: match.id };
    if (homeReady && !match.home_team_id) update.home_team_id = homeTeam!.team_id;
    if (awayReady && !match.away_team_id) update.away_team_id = awayTeam!.team_id;

    if (update.home_team_id || update.away_team_id) updates.push(update);
  }

  // ── 4. Best 8 third-place teams → slots 12-15 ────────────────────────────────
  if (completedGroups.length === 12) {
    const thirdPlaceTeams: TeamStanding[] = [];
    for (const letter of GROUPS) {
      const third = (groupTeams[letter] ?? []).find((t) => t.position === 3);
      if (third) thirdPlaceTeams.push(third);
    }
    thirdPlaceTeams.sort((a, b) =>
      b.points - a.points || b.goal_difference - a.goal_difference || b.goals_for - a.goals_for
    );
    const best8 = thirdPlaceTeams.slice(0, 8);

    // Assign best-8 third-place teams to R32 slots 12-15 (2 per match)
    for (let slot = 12; slot < 16 && slot < r32.length; slot++) {
      const match = r32[slot];
      if (!match || (match.home_team_id && match.away_team_id)) continue;
      const idx = (slot - 12) * 2;
      const homeTeam = best8[idx];
      const awayTeam = best8[idx + 1];
      const update: { id: string; home_team_id?: string; away_team_id?: string } = { id: match.id };
      if (homeTeam && !match.home_team_id) update.home_team_id = homeTeam.team_id;
      if (awayTeam && !match.away_team_id) update.away_team_id = awayTeam.team_id;
      if (update.home_team_id || update.away_team_id) updates.push(update);
    }
  }

  // ── 5. KO Advancement: advance winners through rounds ─────────────────────────
  const koAdvanceUpdates = await computeKOAdvancement(supabase);
  updates.push(...koAdvanceUpdates);

  // ── 6. Apply all updates ──────────────────────────────────────────────────────
  let updated = 0;
  for (const upd of updates) {
    const { id, ...fields } = upd;
    if (Object.keys(fields).length === 0) continue;
    await supabase.from("matches").update(fields).eq("id", id);
    updated++;
  }

  return {
    status: "ok",
    completedGroups: completedGroups.length,
    updatedMatches: updated,
  };
}

async function computeKOAdvancement(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const updates: Array<{ id: string; home_team_id?: string; away_team_id?: string }> = [];

  const phases = ["round_of_32", "round_of_16", "quarter_final", "semi_final"] as const;
  const nextPhase: Record<string, string> = {
    round_of_32: "round_of_16",
    round_of_16: "quarter_final",
    quarter_final: "semi_final",
    semi_final: "final",
  };
  const thirdPhase = "semi_final";
  const thirdPlacePhase = "third_place";

  for (const phase of phases) {
    const { data: phaseMtchs } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, home_score, away_score, home_score_penalties, away_score_penalties, status, match_date")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("phase", phase)
      .order("match_date", { ascending: true });

    if (!phaseMtchs) continue;

    const np = nextPhase[phase];
    const { data: nextPhaseMtchs } = await supabase
      .from("matches")
      .select("id, home_team_id, away_team_id, match_date")
      .eq("tournament_id", TOURNAMENT_ID)
      .eq("phase", np)
      .order("match_date", { ascending: true });

    if (!nextPhaseMtchs) continue;

    // Pair consecutive finished matches: [0,1]→nextSlot 0, [2,3]→nextSlot 1, etc.
    for (let i = 0; i < phaseMtchs.length; i += 2) {
      const matchA = phaseMtchs[i];
      const matchB = phaseMtchs[i + 1];
      const nextMatch = nextPhaseMtchs[Math.floor(i / 2)];
      if (!nextMatch) continue;
      if (nextMatch.home_team_id && nextMatch.away_team_id) continue;

      const winnerA = matchA?.status === "finished" ? getWinner(matchA) : null;
      const winnerB = matchB?.status === "finished" ? getWinner(matchB) : null;

      const upd: { id: string; home_team_id?: string; away_team_id?: string } = { id: nextMatch.id };
      if (winnerA && !nextMatch.home_team_id) upd.home_team_id = winnerA;
      if (winnerB && !nextMatch.away_team_id) upd.away_team_id = winnerB;
      if (upd.home_team_id || upd.away_team_id) updates.push(upd);
    }

    // For semis: also advance losers to 3rd place
    if (phase === thirdPhase) {
      const { data: thirdMatch } = await supabase
        .from("matches")
        .select("id, home_team_id, away_team_id")
        .eq("tournament_id", TOURNAMENT_ID)
        .eq("phase", thirdPlacePhase)
        .single();

      if (thirdMatch && !(thirdMatch.home_team_id && thirdMatch.away_team_id)) {
        const sfA = phaseMtchs[0];
        const sfB = phaseMtchs[1];
        const loserA = sfA?.status === "finished" ? getLoser(sfA) : null;
        const loserB = sfB?.status === "finished" ? getLoser(sfB) : null;
        const upd: { id: string; home_team_id?: string; away_team_id?: string } = { id: thirdMatch.id };
        if (loserA && !thirdMatch.home_team_id) upd.home_team_id = loserA;
        if (loserB && !thirdMatch.away_team_id) upd.away_team_id = loserB;
        if (upd.home_team_id || upd.away_team_id) updates.push(upd);
      }
    }
  }

  return updates;
}

function getWinner(match: {
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties?: number | null;
  away_score_penalties?: number | null;
}): string | null {
  if (!match.home_team_id || !match.away_team_id) return null;
  const hs = match.home_score ?? 0;
  const as = match.away_score ?? 0;
  if (hs > as) return match.home_team_id;
  if (as > hs) return match.away_team_id;
  // Extra time / penalties
  const hp = match.home_score_penalties ?? 0;
  const ap = match.away_score_penalties ?? 0;
  if (hp > ap) return match.home_team_id;
  if (ap > hp) return match.away_team_id;
  return match.home_team_id; // tie-break: home (shouldn't happen)
}

function getLoser(match: {
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  home_score_penalties?: number | null;
  away_score_penalties?: number | null;
}): string | null {
  const winner = getWinner(match);
  if (!winner) return null;
  return winner === match.home_team_id ? match.away_team_id : match.home_team_id;
}
