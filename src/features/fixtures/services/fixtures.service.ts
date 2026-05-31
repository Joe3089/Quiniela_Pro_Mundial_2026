import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow, TeamRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

// Try a table with tournament_id filter first, then without, then try an alternate table name
async function queryTeams(
  supabase: ReturnType<typeof db>,
  primaryTable: string,
  fallbackTable: string,
  tournamentId: string
): Promise<TeamRow[]> {
  // 1. Primary table, with tournament_id
  const { data: d1 } = await supabase
    .from(primaryTable)
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name", { ascending: true });
  if (d1?.length) return d1 as TeamRow[];

  // 2. Primary table, all rows
  const { data: d2 } = await supabase
    .from(primaryTable)
    .select("*")
    .order("name", { ascending: true });
  if (d2?.length) return d2 as TeamRow[];

  // 3. Fallback table, with tournament_id
  const { data: d3 } = await supabase
    .from(fallbackTable)
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("name", { ascending: true });
  if (d3?.length) return d3 as TeamRow[];

  // 4. Fallback table, all rows
  const { data: d4 } = await supabase
    .from(fallbackTable)
    .select("*")
    .order("name", { ascending: true });
  return (d4 as TeamRow[]) ?? [];
}

export const fixturesService = {
  async getTeams(tournamentId: string): Promise<TeamRow[]> {
    const supabase = db();
    return queryTeams(supabase, "teams", "selecciones", tournamentId);
  },

  async getTournamentMatches(tournamentId: string, phase?: string): Promise<Match[]> {
    const supabase = db();

    // Helper: build match query for a given table + team table
    const tryMatches = async (
      matchTable: string,
      teamTable: string,
      groupTable: string,
      tid?: string
    ): Promise<Match[] | null> => {
      try {
        let q = supabase
          .from(matchTable)
          .select(`*, home_team:${teamTable}(*), away_team:${teamTable}(*), group:${groupTable}(*)`)
          .order("match_date", { ascending: true });
        if (tid) q = q.eq("tournament_id", tid);
        if (phase) q = q.eq("phase", phase);
        const { data, error } = await q;
        if (!error && data?.length) return data as Match[];
        return null;
      } catch {
        return null;
      }
    };

    // 1. English tables with tournament_id
    const r1 = await tryMatches("matches", "teams", "groups", tournamentId);
    if (r1) return r1;

    // 2. Spanish tables with tournament_id
    const r2 = await tryMatches("partidos", "selecciones", "grupos", tournamentId);
    if (r2) return r2;

    // 3. English tables, all matches (no tournament filter)
    const r3 = await tryMatches("matches", "teams", "groups");
    if (r3) return r3;

    // 4. Spanish tables, all matches
    const r4 = await tryMatches("partidos", "selecciones", "grupos");
    return r4 ?? [];
  },

  async getGroups(tournamentId: string): Promise<Group[]> {
    const supabase = db();

    // Try English "groups" first, then Spanish "grupos"
    const fetchGroups = async (table: string) => {
      const { data } = await supabase
        .from(table)
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("letter");
      return data as GroupRow[] | null;
    };

    const groups = (await fetchGroups("groups")) ?? (await fetchGroups("grupos")) ?? [];

    const groupsWithData = await Promise.all(
      groups.map(async (group: GroupRow) => {
        const teamsTable = "teams";
        const matchTable = "matches";

        const [teamsResult, matchesResult, standingsResult] = await Promise.all([
          supabase.from(teamsTable).select("*").eq("tournament_id", tournamentId),
          supabase
            .from(matchTable)
            .select(`*, home_team:${teamsTable}(*), away_team:${teamsTable}(*), group:groups(*)`)
            .eq("group_id", group.id)
            .order("match_date"),
          supabase
            .from("standings")
            .select(`*, team:${teamsTable}(*)`)
            .eq("group_id", group.id)
            .order("points", { ascending: false }),
        ]);

        return {
          ...group,
          teams: teamsResult.data ?? [],
          matches: (matchesResult.data as Match[]) ?? [],
          standings: (standingsResult.data as Standing[]) ?? [],
        } as Group;
      })
    );

    return groupsWithData;
  },
};
