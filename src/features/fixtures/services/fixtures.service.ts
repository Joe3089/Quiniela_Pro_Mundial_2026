import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow, TeamRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

// ── Status / phase mapping ───────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  // English pass-through (stored by sync route)
  scheduled: "scheduled", live: "live", finished: "finished",
  postponed: "postponed", cancelled: "cancelled",
  // Spanish legacy labels
  Programado: "scheduled", programado: "scheduled",
  "En Vivo": "live", "en vivo": "live", Live: "live",
  Finalizado: "finished",  finalizado: "finished",
  Aplazado:   "postponed", aplazado:   "postponed",
  Cancelado:  "cancelled", cancelado:  "cancelled",
};

const PHASE_MAP: Record<string, string> = {
  "Fase de Grupos": "group", "fase de grupos": "group", Grupos: "group",
  "Ronda de 32":       "round_of_32",
  "Octavos de Final":  "round_of_16",
  "Cuartos de Final":  "quarter_final",
  Semifinales:         "semi_final",
  "Tercer Lugar":      "third_place",
  Final:               "final",
};

// ── Query with race-timeout to avoid hanging if a table is slow ──────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function queryWithTimeout<T>(query: Promise<{ data: T | null; error: unknown }>, ms = 25000): Promise<T | null> {
  const timeout = new Promise<{ data: null }>((resolve) => setTimeout(() => resolve({ data: null }), ms));
  const result = await Promise.race([query, timeout]);
  return result.data ?? null;
}

// ── Fetch team rows by ID list (with timeout so it never blocks) ─────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchTeamsById(supabase: any, ids: string[]): Promise<Record<string, any>> {
  if (!ids.length) return {};
  const data = await queryWithTimeout(supabase.from("teams").select("*").in("id", ids));
  if (!data) return {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return Object.fromEntries((data as any[]).map((t: any) => [t.id, t]));
}

// ── Deduplicate matches that were inserted multiple times ───────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dedupeMatches(rows: any[]): any[] {
  const seen = new Map<string, any>();
  for (const row of rows) {
    const key = [row.phase, row.group_id, row.home_team_id, row.away_team_id, row.match_date, row.status].join("|");
    if (!seen.has(key)) {
      seen.set(key, row);
    }
  }
  return Array.from(seen.values());
}

// ── Map a matches row to Match type ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPartido(m: any, teamsById: Record<string, any>, groupsById: Record<string, any>): Match {
  const homeScore = m.home_score ?? m.goles_equipo_1 ?? m.goles_equipo1 ?? m.goles_local ?? null;
  const awayScore = m.away_score ?? m.goles_equipo_2 ?? m.goles_equipo2 ?? m.goles_visitante ?? null;
  const groupObj = groupsById[m.group_id] ?? null;

  return {
    id:                   String(m.id),
    tournament_id:        m.tournament_id         ?? "",
    phase:                (PHASE_MAP[m.phase]      ?? "group") as never,
    round_number:         m.round_number ?? m.jornada ?? m.ronda ?? null,
    group_id:             m.group_id              ?? groupObj?.id ?? null,
    home_team_id:         m.home_team_id          ?? m.equipo_1_id ?? null,
    away_team_id:         m.away_team_id          ?? m.equipo_2_id ?? null,
    home_score:           homeScore,
    away_score:           awayScore,
    home_score_penalties: m.home_score_penalties   ?? null,
    away_score_penalties: m.away_score_penalties   ?? null,
    api_football_fixture_id: m.api_football_fixture_id ?? null,
    api_football_home_team_id: m.api_football_home_team_id ?? null,
    api_football_away_team_id: m.api_football_away_team_id ?? null,
    api_football_status:  m.api_football_status ?? null,
    elapsed:              m.elapsed ?? null,
    match_date:           m.match_date ?? m.fecha_hora ?? m.fecha ?? new Date().toISOString(),
    venue:                m.venue                  ?? m.sede ?? null,
    city:                 m.city                   ?? m.ciudad ?? null,
    status:               (STATUS_MAP[m.status]    ?? "scheduled") as never,
    created_at:           m.created_at ?? new Date().toISOString(),
    updated_at:           m.updated_at ?? m.created_at ?? new Date().toISOString(),
    home_team: teamsById[m.home_team_id]            ?? teamsById[m.equipo_1_id] ?? null,
    away_team: teamsById[m.away_team_id]            ?? teamsById[m.equipo_2_id] ?? null,
    group:     groupObj,
  } as Match;
}

export const fixturesService = {
  // ── Teams ──────────────────────────────────────────────────────────────────
  async getTeams(tournamentId: string): Promise<TeamRow[]> {
    const supabase = db();

    // Try teams table with tournament_id (timeout so it never hangs the UI)
    const d1 = await queryWithTimeout(
      supabase.from("teams").select("*").eq("tournament_id", tournamentId).order("name")
    );
    if ((d1 as TeamRow[] | null)?.length) return d1 as TeamRow[];

    // Try all teams in table (ignore tournament_id)
    const d2 = await queryWithTimeout(supabase.from("teams").select("*").order("name"));
    if ((d2 as TeamRow[] | null)?.length) return d2 as TeamRow[];

    return [];
  },

  // ── Matches (primary: partidos) ────────────────────────────────────────────
  async getTournamentMatches(tournamentId: string, phase?: string): Promise<Match[]> {
    const supabase = db();

    const run = async (tid?: string): Promise<Match[] | null> => {
      try {
        let q = supabase.from("matches").select("*").order("match_date", { ascending: true });
        if (tid) q = q.eq("tournament_id", tid);

        const rows = (await queryWithTimeout(q)) as any[] | null;
        if (!rows?.length) return null;

        const uniqueRows = dedupeMatches(rows);

        // Collect unique IDs / group IDs
        const teamIds = [...new Set(uniqueRows.flatMap((m: any) => [m.home_team_id, m.away_team_id, m.equipo_1_id, m.equipo_2_id]).filter(Boolean))] as string[];
        const groupIds = [...new Set(uniqueRows.map((m: any) => m.group_id).filter(Boolean))] as string[];

        const [teamsById, groupsData] = await Promise.all([
          fetchTeamsById(supabase, teamIds),
          queryWithTimeout(supabase.from("groups").select("*").in("id", groupIds)),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupsById: Record<string, any> = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((groupsData as any[]) ?? []).map((g: any) => [g.id, g])
        );

        return uniqueRows.map((m: any) => mapPartido(m, teamsById, groupsById));
      } catch {
        return null;
      }
    };

    return (await run(tournamentId)) ?? (await run()) ?? [];
  },

  // ── Single match by ID ────────────────────────────────────────────────────
  async getMatchById(matchId: string): Promise<Match | null> {
    const supabase = db();
    try {
      const row = (await queryWithTimeout(
        supabase.from("matches").select("*").eq("id", matchId).single()
      )) as any | null;
      if (!row) return null;

      const teamIds = [row.home_team_id, row.away_team_id].filter(Boolean) as string[];
      const teamsById = await fetchTeamsById(supabase, teamIds);

      let groupsById: Record<string, any> = {};
      if (row.group_id) {
        const gData = (await queryWithTimeout(
          supabase.from("groups").select("*").eq("id", row.group_id)
        )) as any[] | null;
        groupsById = Object.fromEntries((gData ?? []).map((g: any) => [g.id, g]));
      }

      return mapPartido(row, teamsById, groupsById);
    } catch {
      return null;
    }
  },

  // ── Match Events (goalscorers, cards, etc.) ────────────────────────────────
  async getMatchEvents(matchId: string): Promise<{
    id: string; type: string; player_name: string; minute: number; minute_extra: number;
    assist_name: string | null; team_id: string | null;
  }[]> {
    const supabase = db();
    try {
      const data = await queryWithTimeout(
        supabase.from("match_events")
          .select("id, type, player_name, minute, minute_extra, assist_name, team_id")
          .eq("match_id", matchId)
          .order("minute", { ascending: true })
          .order("minute_extra", { ascending: true })
      );
      return (data as any[]) ?? [];
    } catch {
      return [];
    }
  },

  // ── Groups ─────────────────────────────────────────────────────────────────
  // Derives groups directly from partidos data — no dependency on groups table
  async getGroups(tournamentId: string): Promise<Group[]> {
    const supabase = db();

    // Get ALL partidos for this tournament (one query)
    const allMatches = (await queryWithTimeout(
      supabase.from("matches").select("*")
        .eq("tournament_id", tournamentId)
        .order("match_date", { ascending: true })
    )) as any[] | null;

    if (!allMatches?.length) return [];

    const uniqueMatches = dedupeMatches(allMatches);
    // Sort group UUIDs so groups always appear in order A→B→C...→L
    // UUIDs follow pattern aa000000-...-000000000001 (A) through ...000000000c (L)
    const groupIds = [...new Set(uniqueMatches.map((m: any) => m.group_id).filter(Boolean))]
      .sort() as string[];

    // Fetch all teams used in these matches (single query with timeout)
    const teamIds = [...new Set(
      uniqueMatches.flatMap((m: any) => [m.home_team_id, m.away_team_id, m.equipo_1_id, m.equipo_2_id]).filter(Boolean)
    )] as string[];
    const teamsById = await fetchTeamsById(supabase, teamIds);

    // Try to get groups table for IDs/names (best-effort, not required)
    const groupsFromDB = (await queryWithTimeout(
      supabase.from("groups").select("*").eq("tournament_id", tournamentId).in("id", groupIds)
    )) as GroupRow[] | null ?? [];
    const groupsById = Object.fromEntries((groupsFromDB).map((g: any) => [g.id, g]));

    return groupIds.map((groupId) => {
      const dbGroup = groupsById[groupId];
      const group: GroupRow = dbGroup ?? {
        id: groupId,
        name: `Grupo ${groupId}`,
        letter: "?",
        tournament_id: tournamentId,
      };

      const groupMatches = uniqueMatches
        .filter((m: any) => m.group_id === groupId)
        .map((m: any) => mapPartido(m, teamsById, groupsById));

      const groupTeamIds = [...new Set(
        uniqueMatches.filter((m: any) => m.group_id === groupId)
          .flatMap((m: any) => [m.home_team_id, m.away_team_id, m.equipo_1_id, m.equipo_2_id]).filter(Boolean)
      )] as string[];
      const groupTeams = groupTeamIds.map((id) => teamsById[id]).filter(Boolean) as TeamRow[];

      return { ...group, teams: groupTeams, matches: groupMatches, standings: [] } as Group;
    });
  },
};
