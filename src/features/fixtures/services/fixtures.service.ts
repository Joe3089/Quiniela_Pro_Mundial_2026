import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow, TeamRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

export const fixturesService = {
  async getTeams(tournamentId: string): Promise<TeamRow[]> {
    const supabase = db();

    // Try with tournament_id first
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("name", { ascending: true });

    if (!error && data && (data as TeamRow[]).length > 0) {
      return data as TeamRow[];
    }

    // Fallback: all teams in the DB regardless of tournament
    const { data: all } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    return (all as TeamRow[]) ?? [];
  },

  async getTournamentMatches(tournamentId: string, phase?: string): Promise<Match[]> {
    const supabase = db();

    const buildQuery = (tid: string) => {
      let q = supabase
        .from("matches")
        .select(
          `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*)`
        )
        .eq("tournament_id", tid)
        .order("match_date", { ascending: true });
      if (phase) q = q.eq("phase", phase);
      return q;
    };

    const { data, error } = await buildQuery(tournamentId);

    if (!error && data && (data as Match[]).length > 0) {
      return data as Match[];
    }

    // Fallback: all matches regardless of tournament_id
    let fallback = supabase
      .from("matches")
      .select(
        `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*)`
      )
      .order("match_date", { ascending: true });
    if (phase) fallback = fallback.eq("phase", phase);

    const { data: all } = await fallback;
    return (all as Match[]) ?? [];
  },

  async getGroups(tournamentId: string): Promise<Group[]> {
    const supabase = db();
    const { data: groups, error } = await supabase
      .from("groups")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("letter");

    if (error) throw error;

    const groupsWithData = await Promise.all(
      ((groups as GroupRow[]) ?? []).map(async (group: GroupRow) => {
        const [teamsResult, matchesResult, standingsResult] = await Promise.all([
          supabase.from("teams").select("*").eq("tournament_id", tournamentId),
          supabase
            .from("matches")
            .select(`*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*)`)
            .eq("group_id", group.id)
            .order("match_date"),
          supabase
            .from("standings")
            .select(`*, team:teams(*)`)
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
