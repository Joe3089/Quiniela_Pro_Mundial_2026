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

// Seed slot types
type PosSeed = [string, 1 | 2];                    // [group_letter, position]
type ThirdSeed = { pos: 3; groups: string[] };     // best 3rd-place from group pool
type SeedSlot = PosSeed | ThirdSeed;

function isThird(s: SeedSlot): s is ThirdSeed {
  return !Array.isArray(s);
}

// Official FIFA WC 2026 R32 bracket seedings (M73–M88, ordered by match date)
const R32_SEEDING: { home: SeedSlot; away: SeedSlot }[] = [
  { home: ["A", 2], away: ["B", 2] },                                        // M73
  { home: ["E", 1], away: { pos: 3, groups: ["A","B","C","D","F"] } },       // M74
  { home: ["F", 1], away: ["C", 2] },                                        // M75
  { home: ["C", 1], away: ["F", 2] },                                        // M76
  { home: ["I", 1], away: { pos: 3, groups: ["C","D","F","G","H"] } },       // M77
  { home: ["E", 2], away: ["I", 2] },                                        // M78
  { home: ["A", 1], away: { pos: 3, groups: ["C","E","F","H","I"] } },       // M79
  { home: ["L", 1], away: { pos: 3, groups: ["E","H","I","J","K"] } },       // M80
  { home: ["D", 1], away: { pos: 3, groups: ["B","E","F","I","J"] } },       // M81
  { home: ["G", 1], away: { pos: 3, groups: ["A","H","I","J"] } },           // M82
  { home: ["K", 2], away: ["L", 2] },                                        // M83
  { home: ["H", 1], away: ["J", 2] },                                        // M84
  { home: ["B", 1], away: { pos: 3, groups: ["E","F","G","I","J"] } },       // M85
  { home: ["J", 1], away: ["H", 2] },                                        // M86
  { home: ["K", 1], away: { pos: 3, groups: ["D","E","I","J","L"] } },       // M87
  { home: ["D", 2], away: ["G", 2] },                                        // M88
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

  // Check how many groups have all 3 games played (each team played 3)
  const completedGroups = GROUPS.filter((g) => {
    const teams = groupTeams[g] ?? [];
    return teams.length === 4 && teams.every((t) => t.played >= 3);
  });

  // ── 2. Build ranked 3rd-place pool (all 12 groups complete required) ──────────
  let thirdPlaceRanked: TeamStanding[] = [];
  const assignedThirdIds = new Set<string>();

  if (completedGroups.length === 12) {
    for (const letter of GROUPS) {
      const third = (groupTeams[letter] ?? []).find((t) => t.position === 3);
      if (third) thirdPlaceRanked.push(third);
    }
    thirdPlaceRanked.sort((a, b) =>
      b.points - a.points ||
      b.goal_difference - a.goal_difference ||
      b.goals_for - a.goals_for
    );
    // Keep only best 8
    thirdPlaceRanked = thirdPlaceRanked.slice(0, 8);
  }

  function getBestThird(groups: string[]): string | null {
    for (const t of thirdPlaceRanked) {
      if (!groups.includes(t.group)) continue;
      if (assignedThirdIds.has(t.team_id)) continue;
      assignedThirdIds.add(t.team_id);
      return t.team_id;
    }
    return null;
  }

  // ── 3. Load R32 matches ordered by date ──────────────────────────────────────
  const { data: r32Matches } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, match_date, status")
    .eq("tournament_id", TOURNAMENT_ID)
    .eq("phase", "round_of_32")
    .order("match_date", { ascending: true });

  const r32 = r32Matches ?? [];
  const updates: Array<{ id: string; home_team_id: string | null; away_team_id: string | null }> = [];

  // ── 4. Populate R32 slots from official seedings (always overwrite) ───────────
  for (let slot = 0; slot < Math.min(R32_SEEDING.length, r32.length); slot++) {
    const match = r32[slot];
    if (!match) continue;
    // Skip finished matches to avoid overwriting played results
    if (match.status === "finished" || match.status === "live") continue;

    const seeding = R32_SEEDING[slot];

    const resolveSlot = (seed: SeedSlot): string | null => {
      if (isThird(seed)) {
        if (completedGroups.length < 12) return null;
        return getBestThird(seed.groups);
      }
      const [grp, pos] = seed;
      if (!completedGroups.includes(grp)) return null;
      return (groupTeams[grp] ?? []).find((t) => t.position === pos)?.team_id ?? null;
    };

    const homeId = resolveSlot(seeding.home);
    const awayId = resolveSlot(seeding.away);

    // Always push update (even nulls) to overwrite wrong assignments
    updates.push({ id: match.id, home_team_id: homeId, away_team_id: awayId });
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
    thirdPlaceResolved: thirdPlaceRanked.length,
    updatedMatches: updated,
  };
}

async function computeKOAdvancement(supabase: Awaited<ReturnType<typeof createAdminClient>>) {
  const updates: Array<{ id: string; home_team_id: string | null; away_team_id: string | null }> = [];

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
      if (upd.home_team_id || upd.away_team_id) updates.push({ ...upd, home_team_id: upd.home_team_id ?? null, away_team_id: upd.away_team_id ?? null });
    }

    // For semis: advance losers to 3rd place match
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
        if (upd.home_team_id || upd.away_team_id) updates.push({ ...upd, home_team_id: upd.home_team_id ?? null, away_team_id: upd.away_team_id ?? null });
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
  const hp = match.home_score_penalties ?? 0;
  const ap = match.away_score_penalties ?? 0;
  if (hp > ap) return match.home_team_id;
  if (ap > hp) return match.away_team_id;
  return match.home_team_id;
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
