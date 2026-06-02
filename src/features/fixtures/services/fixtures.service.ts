import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow, TeamRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

// ── Status / phase mapping ───────────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
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
async function queryWithTimeout<T>(query: Promise<{ data: T | null; error: unknown }>, ms = 7000): Promise<T | null> {
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

// ── Map a partidos row to Match type ─────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPartido(m: any, teamsById: Record<string, any>, groupsByLetter: Record<string, any>): Match {
  const homeScore = m.goles_equipo_1 ?? m.goles_equipo1 ?? m.goles_local    ?? null;
  const awayScore = m.goles_equipo_2 ?? m.goles_equipo2 ?? m.goles_visitante ?? null;
  const groupObj  = groupsByLetter[m.grupo_id] ?? null;

  return {
    id:                   String(m.id),
    tournament_id:        m.tournament_id         ?? "",
    phase:                (PHASE_MAP[m.fase]       ?? "group") as never,
    round_number:         m.jornada ?? m.ronda     ?? null,
    group_id:             groupObj?.id             ?? null,
    home_team_id:         m.equipo_1_id            ?? null,
    away_team_id:         m.equipo_2_id            ?? null,
    home_score:           homeScore,
    away_score:           awayScore,
    home_score_penalties: null,
    away_score_penalties: null,
    match_date:           m.fecha_hora ?? m.fecha  ?? new Date().toISOString(),
    venue:                m.sede                   ?? null,
    city:                 m.ciudad                 ?? null,
    status:               (STATUS_MAP[m.estado]    ?? "scheduled") as never,
    created_at:           new Date().toISOString(),
    home_team: teamsById[m.equipo_1_id]            ?? null,
    away_team: teamsById[m.equipo_2_id]            ?? null,
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
        let q = supabase.from("partidos").select("*").order("fecha_hora", { ascending: true });
        if (tid) q = q.eq("tournament_id", tid);

        const rows = (await queryWithTimeout(q)) as any[] | null;
        if (!rows?.length) return null;

        // Collect unique IDs / letters
        const teamIds = [...new Set(rows.flatMap((m: any) => [m.equipo_1_id, m.equipo_2_id]).filter(Boolean))] as string[];
        const letters = [...new Set(rows.map((m: any) => m.grupo_id).filter(Boolean))] as string[];

        // Parallel lookups — both wrapped in timeout
        const [teamsById, groupsData] = await Promise.all([
          fetchTeamsById(supabase, teamIds),
          queryWithTimeout(supabase.from("groups").select("*").in("letter", letters)),
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupsByLetter: Record<string, any> = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((groupsData as any[]) ?? []).map((g: any) => [g.letter, g])
        );

        return rows.map((m: any) => mapPartido(m, teamsById, groupsByLetter));
      } catch {
        return null;
      }
    };

    return (await run(tournamentId)) ?? (await run()) ?? [];
  },

  // ── Groups ─────────────────────────────────────────────────────────────────
  async getGroups(tournamentId: string): Promise<Group[]> {
    const supabase = db();

    // Fetch group definitions (with timeout)
    const groupsRaw = await queryWithTimeout<GroupRow[]>(
      supabase.from("groups").select("*").eq("tournament_id", tournamentId).order("letter")
    );
    const groups = groupsRaw ?? [];

    if (!groups.length) return [];

    const enriched = await Promise.all(
      groups.map(async (group: GroupRow) => {
        // Matches from partidos for this group
        const partidosRaw = (await queryWithTimeout(
          supabase.from("partidos").select("*").eq("grupo_id", group.letter).order("fecha_hora")
        )) as any[] | null ?? [];

        // Team IDs from those matches
        const teamIds = [...new Set(
          partidosRaw.flatMap((m: any) => [m.equipo_1_id, m.equipo_2_id]).filter(Boolean)
        )] as string[];

        const teamsById = await fetchTeamsById(supabase, teamIds);

        const matches = partidosRaw.map((m: any) =>
          mapPartido(m, teamsById, { [group.letter]: group })
        );

        const standingsRaw = (await queryWithTimeout(
          supabase.from("standings").select("*").eq("group_id", group.id).order("points", { ascending: false })
        )) as Standing[] | null ?? [];

        return {
          ...group,
          teams:     Object.values(teamsById) as TeamRow[],
          matches,
          standings: standingsRaw,
        } as Group;
      })
    );

    return enriched;
  },
};
