import { createClient } from "@/lib/supabase/client";
import type { Match, Group, Standing } from "@/types/fixtures";
import type { GroupRow, TeamRow } from "@/types/database";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = () => createClient() as any;

// ── Spanish → English mappings ──────────────────────────────────────────────
const STATUS_MAP: Record<string, string> = {
  Programado: "scheduled", programado: "scheduled",
  "En Vivo": "live",       "en vivo": "live",        Live: "live",
  Finalizado: "finished",  finalizado: "finished",
  Aplazado: "postponed",   aplazado: "postponed",
  Cancelado: "cancelled",  cancelado: "cancelled",
};

const PHASE_MAP: Record<string, string> = {
  "Fase de Grupos": "group", "fase de grupos": "group", Grupos: "group",
  "Ronda de 32": "round_of_32",
  "Octavos de Final": "round_of_16",
  "Cuartos de Final": "quarter_final",
  Semifinales: "semi_final",
  "Tercer Lugar": "third_place",
  Final: "final",
};

// ── Convert a `partidos` row + teams/groups maps into a Match object ─────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPartidoToMatch(m: any, teamsById: Record<string, any>, groupsByLetter: Record<string, any>): Match {
  // Goals — handle multiple possible column names
  const homeScore = m.goles_equipo_1 ?? m.goles_equipo1 ?? m.goles_local    ?? null;
  const awayScore = m.goles_equipo_2 ?? m.goles_equipo2 ?? m.goles_visitante ?? null;
  const groupObj  = groupsByLetter[m.grupo_id] ?? null;

  return {
    id:                       String(m.id),
    tournament_id:            m.tournament_id            ?? "",
    phase:                    (PHASE_MAP[m.fase] ?? "group") as never,
    round_number:             m.jornada ?? m.ronda        ?? null,
    group_id:                 groupObj?.id                ?? null,
    home_team_id:             m.equipo_1_id               ?? null,
    away_team_id:             m.equipo_2_id               ?? null,
    home_score:               homeScore,
    away_score:               awayScore,
    home_score_penalties:     null,
    away_score_penalties:     null,
    match_date:               m.fecha_hora ?? m.fecha     ?? new Date().toISOString(),
    venue:                    m.sede       ?? null,
    city:                     m.ciudad     ?? null,
    status:                   (STATUS_MAP[m.estado] ?? "scheduled") as never,
    created_at:               new Date().toISOString(),
    // Joined relations
    home_team: teamsById[m.equipo_1_id] ?? null,
    away_team: teamsById[m.equipo_2_id] ?? null,
    group:     groupObj,
  } as Match;
}

export const fixturesService = {
  // ── Teams ──────────────────────────────────────────────────────────────────
  async getTeams(tournamentId: string): Promise<TeamRow[]> {
    const supabase = db();

    // 1. teams WITH tournament_id
    const { data: d1 } = await supabase
      .from("teams").select("*").eq("tournament_id", tournamentId).order("name");
    if (d1?.length) return d1 as TeamRow[];

    // 2. teams ALL (handles cases where tournament_id column differs)
    const { data: d2 } = await supabase.from("teams").select("*").order("name");
    if (d2?.length) return d2 as TeamRow[];

    // 3. selecciones fallback
    const { data: d3 } = await supabase.from("selecciones").select("*");
    return (d3 as TeamRow[]) ?? [];
  },

  // ── Matches (primary: partidos; fallback: matches) ─────────────────────────
  async getTournamentMatches(tournamentId: string, phase?: string): Promise<Match[]> {
    const supabase = db();

    const fetchPartidos = async (tid?: string): Promise<Match[] | null> => {
      try {
        let q = supabase.from("partidos").select("*").order("fecha_hora", { ascending: true });
        if (tid) q = q.eq("tournament_id", tid);

        const { data, error } = await q;
        if (error || !data?.length) return null;

        // Collect unique team IDs and group letters
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rows = data as any[];
        const teamIds = [...new Set(rows.flatMap((m: any) => [m.equipo_1_id, m.equipo_2_id]).filter(Boolean))];
        const letters = [...new Set(rows.map((m: any) => m.grupo_id).filter(Boolean))];

        // Parallel lookups
        const [teamsRes, groupsRes] = await Promise.all([
          teamIds.length
            ? supabase.from("teams").select("*").in("id", teamIds)
            : { data: [] },
          letters.length
            ? supabase.from("groups").select("*").in("letter", letters)
            : { data: [] },
        ]);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const teamsById    = Object.fromEntries((teamsRes.data  ?? []).map((t: any) => [t.id,     t]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupsByLetter = Object.fromEntries((groupsRes.data ?? []).map((g: any) => [g.letter, g]));

        return rows.map((m: any) => mapPartidoToMatch(m, teamsById, groupsByLetter));
      } catch {
        return null;
      }
    };

    const fetchMatches = async (tid?: string): Promise<Match[] | null> => {
      try {
        let q = supabase
          .from("matches")
          .select("*, home_team:teams(*), away_team:teams(*), group:groups(*)")
          .order("match_date", { ascending: true });
        if (tid)   q = q.eq("tournament_id", tid);
        if (phase) q = q.eq("phase", phase);

        const { data, error } = await q;
        if (error || !data?.length) return null;
        return data as Match[];
      } catch {
        return null;
      }
    };

    // Priority: partidos w/ tournament_id → partidos all → matches w/ tid → matches all
    return (
      (await fetchPartidos(tournamentId)) ??
      (await fetchPartidos())             ??
      (await fetchMatches(tournamentId))  ??
      (await fetchMatches())              ??
      []
    );
  },

  // ── Groups ─────────────────────────────────────────────────────────────────
  async getGroups(tournamentId: string): Promise<Group[]> {
    const supabase = db();

    const { data: groupsRaw } = await supabase
      .from("groups").select("*").eq("tournament_id", tournamentId).order("letter");

    const groups = (groupsRaw as GroupRow[]) ?? [];

    const enriched = await Promise.all(
      groups.map(async (group: GroupRow) => {
        const [teamsRes, standingsRes] = await Promise.all([
          supabase.from("teams").select("*").eq("tournament_id", tournamentId),
          supabase.from("standings").select("*, team:teams(*)").eq("group_id", group.id).order("points", { ascending: false }),
        ]);

        // Fetch matches for this group from partidos
        const { data: partidosRaw } = await supabase
          .from("partidos").select("*").eq("grupo_id", group.letter).order("fecha_hora");

        const teamsById = Object.fromEntries(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ((teamsRes.data ?? []) as any[]).map((t: any) => [t.id, t])
        );
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const groupsByLetter = { [group.letter]: group } as Record<string, any>;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const matches = ((partidosRaw ?? []) as any[]).map((m: any) =>
          mapPartidoToMatch(m, teamsById, groupsByLetter)
        );

        return {
          ...group,
          teams:     teamsRes.data    ?? [],
          matches,
          standings: (standingsRes.data as Standing[]) ?? [],
        } as Group;
      })
    );

    return enriched;
  },
};
