import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

export const fixturesService = {
  async getTournamentMatches(tournamentId: string, phase?: string): Promise<Match[]> {
    const supabase = db();
    let query = supabase
      .from("matches")
      .select(
        `*, home_team:teams!matches_home_team_id_fkey(*), away_team:teams!matches_away_team_id_fkey(*), group:groups(*)`
      )
      .eq("tournament_id", tournamentId)
      .order("match_date", { ascending: true });

    if (phase) query = query.eq("phase", phase);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Match[]) ?? [];
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
