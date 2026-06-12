/**
 * API-Football v3 server-side client.
 * Base URL : https://v3.football.api-sports.io
 * Auth     : x-apisports-key header
 * Free plan: 100 requests / day
 *
 * FIFA World Cup 2026 = league 1, season 2026
 * Player photo        = https://media.api-sports.io/football/players/{id}.png
 */

const BASE = "https://v3.football.api-sports.io";
const FIFA_WC_LEAGUE = 1;
const SEASON = 2026;
// WC 2026 fixture data isn't in the API yet — fall back to 2024 for player data
const PLAYER_SEASON = 2024;

function headers() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) throw new Error("API_FOOTBALL_KEY is not set in environment variables");
  return {
    "x-apisports-key": key,
    "Content-Type": "application/json",
  };
}

async function get<T>(
  path: string,
  options: { revalidate?: number | false } = { revalidate: 3600 }
): Promise<T> {
  const revalidate = options.revalidate ?? 3600;
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    cache: revalidate === 0 ? "no-store" : undefined,
    next: revalidate === 0 ? undefined : { revalidate },
  });
  if (!res.ok) throw new Error(`API-Football error ${res.status}: ${path}`);
  const json = await res.json();
  if (json.errors && Object.keys(json.errors).length > 0) {
    throw new Error(`API-Football: ${JSON.stringify(json.errors)}`);
  }
  return json.response as T;
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface AFPlayer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string };
    games: { position: string; rating: string | null };
    goals: { total: number | null };
    cards: { yellow: number; red: number };
  }>;
}

export interface AFTeam {
  team: { id: number; name: string; code: string; country: string; logo: string };
  venue: { id: number; name: string; city: string };
}

export interface AFFixture {
  fixture: {
    id: number;
    date: string;
    status: { short: string; elapsed: number | null };
    venue: { name: string; city: string };
  };
  league: { round: string };
  teams: {
    home: { id: number; name: string; logo: string; winner: boolean | null };
    away: { id: number; name: string; logo: string; winner: boolean | null };
  };
  goals: { home: number | null; away: number | null };
  score: {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
  };
}

export interface AFStanding {
  rank: number;
  team: { id: number; name: string; logo: string };
  points: number;
  goalsDiff: number;
  group: string;
  all: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
}

// ── API methods ────────────────────────────────────────────────────────────

/** All teams participating in FIFA WC 2026 */
export async function getWCTeams(): Promise<AFTeam[]> {
  return get<AFTeam[]>(`/teams?league=${FIFA_WC_LEAGUE}&season=${SEASON}`);
}

/** Players for a specific team.
 *  Tries WC 2026 first; if empty, falls back to PLAYER_SEASON (2024).
 *  This is needed because the WC 2026 API data is not yet fully populated.
 */
export async function getTeamPlayers(teamId: number, page = 1): Promise<AFPlayer[]> {
  const wc = await get<AFPlayer[]>(
    `/players?league=${FIFA_WC_LEAGUE}&season=${SEASON}&team=${teamId}&page=${page}`
  );
  if (wc.length > 0) return wc;
  // Fallback: use latest club data (2024 season, any league)
  return get<AFPlayer[]>(`/players?team=${teamId}&season=${PLAYER_SEASON}&page=${page}`);
}

/** Search player by name to get their API-Football ID and photo */
export async function searchPlayer(name: string): Promise<AFPlayer[]> {
  return get<AFPlayer[]>(`/players?search=${encodeURIComponent(name)}&league=${FIFA_WC_LEAGUE}&season=${SEASON}`);
}

/** All fixtures for WC 2026 */
export async function getWCFixtures(options?: { revalidate?: number | false }): Promise<AFFixture[]> {
  return get<AFFixture[]>(`/fixtures?league=${FIFA_WC_LEAGUE}&season=${SEASON}`, options);
}

/** Live fixtures right now */
export async function getLiveFixtures(): Promise<AFFixture[]> {
  return get<AFFixture[]>(`/fixtures?league=${FIFA_WC_LEAGUE}&season=${SEASON}&live=all`, { revalidate: 0 });
}

/** Fixture by API-Football fixture ID */
export async function getFixture(fixtureId: number): Promise<AFFixture[]> {
  return get<AFFixture[]>(`/fixtures?id=${fixtureId}`, { revalidate: 0 });
}

/** Group standings for WC 2026 */
export async function getStandings(): Promise<AFStanding[][]> {
  const data = await get<Array<{ league: { standings: AFStanding[][] } }>>(
    `/standings?league=${FIFA_WC_LEAGUE}&season=${SEASON}`
  );
  return data[0]?.league?.standings ?? [];
}

/** Player photo URL — no API call needed */
export function getPlayerPhotoUrl(apiFootballId: number): string {
  return `https://media.api-sports.io/football/players/${apiFootballId}.png`;
}

/** Check API status and remaining requests */
export async function getApiStatus(): Promise<{
  requests: { current: number; limit_day: number };
  subscription: { plan: string; end: string };
}> {
  const data = await get<{ requests: { current: number; limit_day: number }; subscription: { plan: string; end: string } }>("/status");
  return data as any;
}

// ── Events & Statistics ────────────────────────────────────────────────────

export interface AFFixtureEvent {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string;
  comments: string | null;
}

export interface AFFixtureStats {
  team: { id: number; name: string; logo: string };
  statistics: Array<{
    type: string;
    value: number | string | null;
  }>;
}

/** All events for a fixture (goals, cards, subs, VAR) */
export async function getFixtureEvents(fixtureId: number): Promise<AFFixtureEvent[]> {
  return get<AFFixtureEvent[]>(`/fixtures/events?fixture=${fixtureId}`, { revalidate: 0 });
}

/** Statistics for both teams in a fixture */
export async function getFixtureStats(fixtureId: number): Promise<AFFixtureStats[]> {
  return get<AFFixtureStats[]>(`/fixtures/statistics?fixture=${fixtureId}`, { revalidate: 0 });
}

/** Lineups for both teams in a fixture */
export async function getFixtureLineups(fixtureId: number): Promise<unknown[]> {
  return get<unknown[]>(`/fixtures/lineups?fixture=${fixtureId}`, { revalidate: 60 });
}

// ── Tournament-wide statistics ─────────────────────────────────────────────

export interface AFTopScorer {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    nationality: string;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    goals: { total: number | null; assists: number | null; saves: number | null; conceded: number | null };
    games: { position: string; appearances: number | null };
    cards: { yellow: number; red: number };
  }>;
}

/** Top scorers for WC 2026 (cached 1h) */
export async function getTopScorers(): Promise<AFTopScorer[]> {
  return get<AFTopScorer[]>(`/players/topscorers?league=${FIFA_WC_LEAGUE}&season=${SEASON}`, { revalidate: 3600 });
}

/** Top assists for WC 2026 (cached 1h) */
export async function getTopAssists(): Promise<AFTopScorer[]> {
  return get<AFTopScorer[]>(`/players/topassists?league=${FIFA_WC_LEAGUE}&season=${SEASON}`, { revalidate: 3600 });
}

/** Top yellow cards for WC 2026 (cached 1h) */
export async function getTopYellowCards(): Promise<AFTopScorer[]> {
  return get<AFTopScorer[]>(`/players/topyellowcards?league=${FIFA_WC_LEAGUE}&season=${SEASON}`, { revalidate: 3600 });
}

/** Top red cards for WC 2026 (cached 1h) */
export async function getTopRedCards(): Promise<AFTopScorer[]> {
  return get<AFTopScorer[]>(`/players/topredcards?league=${FIFA_WC_LEAGUE}&season=${SEASON}`, { revalidate: 3600 });
}
