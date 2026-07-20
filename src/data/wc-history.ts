export interface WCEdition {
  year: number;
  host: string;
  hostContinent: string;
  champion: string;
  runnerUp: string;
  third: string;
  fourth: string;
  topScorer: { name: string; country: string; goals: number };
  totalGoals: number;
  teams: number;
  matches: number;
  attendance: number;
}

export interface WCChampion {
  country: string;
  flag: string;
  fifaCode: string;
  titles: number;
  years: number[];
  runnerUp: number;
  runnerUpYears: number[];
  thirdPlace: number;
  confederation: string;
}

export interface TopScorer {
  rank: number;
  name: string;
  country: string;
  flag: string;
  fifaCode?: string;
  confederation?: string;
  goals: number;       // Pre-2026 historical goals only
  gamesPlayed: number; // Pre-2026 WC appearances
  editions: number;
  years: string;
}

export interface WCRecord {
  category: string;
  record: string;
  holder: string;
  value: string;
  year?: number;
  vulnerable?: boolean;
  challengedBy?: string;
  context?: string;
}

export const WC_EDITIONS: WCEdition[] = [
  { year: 1930, host: "Uruguay",      hostContinent: "América del Sur",   champion: "Uruguay",   runnerUp: "Argentina",  third: "EE.UU.",      fourth: "Yugoslavia", topScorer: { name: "Guillermo Stábile", country: "ARG", goals: 8  }, totalGoals: 70,  teams: 13, matches: 18, attendance: 434_500 },
  { year: 1934, host: "Italia",        hostContinent: "Europa",             champion: "Italia",    runnerUp: "Checoslovaquia", third: "Alemania", fourth: "Austria",    topScorer: { name: "Oldřich Nejedlý",  country: "TCH", goals: 5  }, totalGoals: 70,  teams: 16, matches: 17, attendance: 395_000 },
  { year: 1938, host: "Francia",       hostContinent: "Europa",             champion: "Italia",    runnerUp: "Hungría",    third: "Brasil",      fourth: "Suecia",     topScorer: { name: "Leônidas",        country: "BRA", goals: 7  }, totalGoals: 84,  teams: 15, matches: 18, attendance: 483_000 },
  { year: 1950, host: "Brasil",        hostContinent: "América del Sur",   champion: "Uruguay",   runnerUp: "Brasil",     third: "Suecia",      fourth: "España",     topScorer: { name: "Ademir",          country: "BRA", goals: 9  }, totalGoals: 88,  teams: 13, matches: 22, attendance: 1_337_000 },
  { year: 1954, host: "Suiza",         hostContinent: "Europa",             champion: "Alemania",  runnerUp: "Hungría",    third: "Austria",     fourth: "Uruguay",    topScorer: { name: "Sándor Kocsis",   country: "HUN", goals: 11 }, totalGoals: 140, teams: 16, matches: 26, attendance: 943_000 },
  { year: 1958, host: "Suecia",        hostContinent: "Europa",             champion: "Brasil",    runnerUp: "Suecia",     third: "Francia",     fourth: "Alemania",   topScorer: { name: "Just Fontaine",   country: "FRA", goals: 13 }, totalGoals: 126, teams: 16, matches: 35, attendance: 868_000 },
  { year: 1962, host: "Chile",         hostContinent: "América del Sur",   champion: "Brasil",    runnerUp: "Checoslovaquia", third: "Chile",    fourth: "Yugoslavia", topScorer: { name: "Flórián Albert", country: "HUN", goals: 4  }, totalGoals: 89,  teams: 16, matches: 32, attendance: 776_000 },
  { year: 1966, host: "Inglaterra",    hostContinent: "Europa",             champion: "Inglaterra",runnerUp: "Alemania",   third: "Portugal",    fourth: "URSS",       topScorer: { name: "Eusébio",         country: "POR", goals: 9  }, totalGoals: 89,  teams: 16, matches: 32, attendance: 1_614_000 },
  { year: 1970, host: "México",        hostContinent: "América del Norte", champion: "Brasil",    runnerUp: "Italia",     third: "Alemania",    fourth: "Uruguay",    topScorer: { name: "Gerd Müller",     country: "GER", goals: 10 }, totalGoals: 95,  teams: 16, matches: 32, attendance: 1_673_975 },
  { year: 1974, host: "Alemania",      hostContinent: "Europa",             champion: "Alemania",  runnerUp: "Holanda",    third: "Polonia",     fourth: "Brasil",     topScorer: { name: "Grzegorz Lato",   country: "POL", goals: 7  }, totalGoals: 97,  teams: 16, matches: 38, attendance: 1_774_022 },
  { year: 1978, host: "Argentina",     hostContinent: "América del Sur",   champion: "Argentina", runnerUp: "Holanda",    third: "Brasil",      fourth: "Italia",     topScorer: { name: "Mario Kempes",    country: "ARG", goals: 6  }, totalGoals: 102, teams: 16, matches: 38, attendance: 1_610_215 },
  { year: 1982, host: "España",        hostContinent: "Europa",             champion: "Italia",    runnerUp: "Alemania",   third: "Polonia",     fourth: "Francia",    topScorer: { name: "Paolo Rossi",     country: "ITA", goals: 6  }, totalGoals: 146, teams: 24, matches: 52, attendance: 2_109_723 },
  { year: 1986, host: "México",        hostContinent: "América del Norte", champion: "Argentina", runnerUp: "Alemania",   third: "Francia",     fourth: "Bélgica",    topScorer: { name: "Gary Lineker",    country: "ENG", goals: 6  }, totalGoals: 132, teams: 24, matches: 52, attendance: 2_394_031 },
  { year: 1990, host: "Italia",        hostContinent: "Europa",             champion: "Alemania",  runnerUp: "Argentina",  third: "Italia",      fourth: "Inglaterra", topScorer: { name: "Salvatore Schillaci", country: "ITA", goals: 6 }, totalGoals: 115, teams: 24, matches: 52, attendance: 2_516_215 },
  { year: 1994, host: "EE.UU.",        hostContinent: "América del Norte", champion: "Brasil",    runnerUp: "Italia",     third: "Suecia",      fourth: "Bulgaria",   topScorer: { name: "Hristo Stoichkov", country: "BUL", goals: 6 }, totalGoals: 141, teams: 24, matches: 52, attendance: 3_587_538 },
  { year: 1998, host: "Francia",       hostContinent: "Europa",             champion: "Francia",   runnerUp: "Brasil",     third: "Croacia",     fourth: "Holanda",    topScorer: { name: "Davor Šuker",     country: "CRO", goals: 6  }, totalGoals: 171, teams: 32, matches: 64, attendance: 2_785_100 },
  { year: 2002, host: "Corea/Japón",   hostContinent: "Asia",               champion: "Brasil",    runnerUp: "Alemania",   third: "Turquía",     fourth: "Corea del Sur", topScorer: { name: "Ronaldo",       country: "BRA", goals: 8  }, totalGoals: 161, teams: 32, matches: 64, attendance: 2_705_197 },
  { year: 2006, host: "Alemania",      hostContinent: "Europa",             champion: "Italia",    runnerUp: "Francia",    third: "Alemania",    fourth: "Portugal",   topScorer: { name: "Miroslav Klose", country: "GER", goals: 5  }, totalGoals: 147, teams: 32, matches: 64, attendance: 3_359_439 },
  { year: 2010, host: "Sudáfrica",     hostContinent: "África",             champion: "España",    runnerUp: "Holanda",    third: "Alemania",    fourth: "Uruguay",    topScorer: { name: "Thomas Müller",  country: "GER", goals: 5  }, totalGoals: 145, teams: 32, matches: 64, attendance: 3_178_856 },
  { year: 2014, host: "Brasil",        hostContinent: "América del Sur",   champion: "Alemania",  runnerUp: "Argentina",  third: "Holanda",     fourth: "Brasil",     topScorer: { name: "James Rodríguez",country: "COL", goals: 6  }, totalGoals: 171, teams: 32, matches: 64, attendance: 3_429_873 },
  { year: 2018, host: "Rusia",         hostContinent: "Europa",             champion: "Francia",   runnerUp: "Croacia",    third: "Bélgica",     fourth: "Inglaterra", topScorer: { name: "Harry Kane",      country: "ENG", goals: 6  }, totalGoals: 169, teams: 32, matches: 64, attendance: 3_031_768 },
  { year: 2022, host: "Qatar",         hostContinent: "Asia",               champion: "Argentina", runnerUp: "Francia",    third: "Croacia",     fourth: "Marruecos",  topScorer: { name: "Kylian Mbappé",   country: "FRA", goals: 8  }, totalGoals: 172, teams: 32, matches: 64, attendance: 3_404_252 },
  { year: 2026, host: "EE.UU. · Canadá · México", hostContinent: "América del Norte", champion: "España", runnerUp: "Argentina", third: "Inglaterra", fourth: "Francia", topScorer: { name: "Kylian Mbappé", country: "FRA", goals: 10 }, totalGoals: 308, teams: 48, matches: 104, attendance: 0 },
];

export const WC_CHAMPIONS: WCChampion[] = [
  { country: "Brasil",      flag: "🇧🇷", fifaCode: "BRA", titles: 5, years: [1958, 1962, 1970, 1994, 2002], runnerUp: 2, runnerUpYears: [1950, 1998], thirdPlace: 2, confederation: "CONMEBOL" },
  { country: "Alemania",    flag: "🇩🇪", fifaCode: "GER", titles: 4, years: [1954, 1974, 1990, 2014], runnerUp: 4, runnerUpYears: [1966, 1982, 1986, 2002], thirdPlace: 4, confederation: "UEFA" },
  { country: "Italia",      flag: "🇮🇹", fifaCode: "ITA", titles: 4, years: [1934, 1938, 1982, 2006], runnerUp: 2, runnerUpYears: [1970, 1994], thirdPlace: 1, confederation: "UEFA" },
  { country: "Argentina",   flag: "🇦🇷", fifaCode: "ARG", titles: 3, years: [1978, 1986, 2022], runnerUp: 4, runnerUpYears: [1930, 1990, 2014, 2026], thirdPlace: 0, confederation: "CONMEBOL" },
  { country: "Francia",     flag: "🇫🇷", fifaCode: "FRA", titles: 2, years: [1998, 2018], runnerUp: 2, runnerUpYears: [2006, 2022], thirdPlace: 2, confederation: "UEFA" },
  { country: "Uruguay",     flag: "🇺🇾", fifaCode: "URU", titles: 2, years: [1930, 1950], runnerUp: 0, runnerUpYears: [], thirdPlace: 0, confederation: "CONMEBOL" },
  { country: "España",      flag: "🇪🇸", fifaCode: "ESP", titles: 2, years: [2010, 2026], runnerUp: 0, runnerUpYears: [], thirdPlace: 0, confederation: "UEFA" },
  { country: "Inglaterra",  flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaCode: "ENG", titles: 1, years: [1966], runnerUp: 0, runnerUpYears: [], thirdPlace: 2, confederation: "UEFA" },
];

// goals = pre-2026 historical ONLY; WC2026 goals merged live from API-Football (PLAYER_API_IDS in estadisticas/page.tsx)
// gamesPlayed = pre-2026 WC appearances
export const ALL_TIME_SCORERS: TopScorer[] = [
  { rank: 1,  name: "Lionel Messi",     country: "Argentina", flag: "🇦🇷", fifaCode: "ARG", confederation: "CONMEBOL", goals: 13, gamesPlayed: 26, editions: 6, years: "2006–2026" },
  { rank: 2,  name: "Miroslav Klose",   country: "Alemania",  flag: "🇩🇪", fifaCode: "GER", confederation: "UEFA",     goals: 16, gamesPlayed: 24, editions: 4, years: "2002–2014" },
  { rank: 2,  name: "Kylian Mbappé",    country: "Francia",   flag: "🇫🇷", fifaCode: "FRA", confederation: "UEFA",     goals: 12, gamesPlayed: 13, editions: 3, years: "2018–2026" },
  { rank: 4,  name: "Ronaldo (R9)",     country: "Brasil",    flag: "🇧🇷", fifaCode: "BRA", confederation: "CONMEBOL", goals: 15, gamesPlayed: 19, editions: 4, years: "1994–2006" },
  { rank: 5,  name: "Gerd Müller",      country: "Alemania",  flag: "🇩🇪", fifaCode: "GER", confederation: "UEFA",     goals: 14, gamesPlayed: 13, editions: 2, years: "1970–1974" },
  { rank: 6,  name: "Just Fontaine",    country: "Francia",   flag: "🇫🇷", fifaCode: "FRA", confederation: "UEFA",     goals: 13, gamesPlayed:  6, editions: 1, years: "1958" },
  { rank: 7,  name: "Pelé",             country: "Brasil",    flag: "🇧🇷", fifaCode: "BRA", confederation: "CONMEBOL", goals: 12, gamesPlayed: 14, editions: 4, years: "1958–1970" },
  { rank: 8,  name: "Sándor Kocsis",    country: "Hungría",   flag: "🇭🇺", fifaCode: "HUN", confederation: "UEFA",     goals: 11, gamesPlayed:  5, editions: 1, years: "1954" },
  { rank: 8,  name: "Jürgen Klinsmann", country: "Alemania",  flag: "🇩🇪", fifaCode: "GER", confederation: "UEFA",     goals: 11, gamesPlayed: 17, editions: 3, years: "1990–1998" },
  { rank: 10, name: "Gabriel Batistuta",country: "Argentina", flag: "🇦🇷", fifaCode: "ARG", confederation: "CONMEBOL", goals: 10, gamesPlayed: 12, editions: 3, years: "1994–2002" },
  { rank: 10, name: "Gary Lineker",     country: "Inglaterra",flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaCode: "ENG", confederation: "UEFA",     goals: 10, gamesPlayed: 12, editions: 2, years: "1986–1990" },
  { rank: 10, name: "Teófilo Cubillas", country: "Perú",      flag: "🇵🇪", fifaCode: "PER", confederation: "CONMEBOL", goals: 10, gamesPlayed:  9, editions: 2, years: "1970–1978" },
  { rank: 10, name: "Grzegorz Lato",    country: "Polonia",   flag: "🇵🇱", fifaCode: "POL", confederation: "UEFA",     goals: 10, gamesPlayed: 14, editions: 3, years: "1974–1982" },
  { rank: 10, name: "Harry Kane",       country: "Inglaterra",flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaCode: "ENG", confederation: "UEFA",     goals:  8, gamesPlayed: 12, editions: 3, years: "2018–2026" },
  { rank: 10, name: "Cristiano Ronaldo",country: "Portugal",  flag: "🇵🇹", fifaCode: "POR", confederation: "UEFA",     goals:  8, gamesPlayed: 22, editions: 6, years: "2006–2026" },
];

export const RECORDS_2026: WCRecord[] = [
  {
    category: "Goleador histórico",
    record: "Más goles en Copas del Mundo",
    holder: "Kylian Mbappé (Francia) 🏆",
    value: "22 goles (2018–2026) — NUEVO RÉCORD",
    year: 2026,
    vulnerable: false,
    challengedBy: "Lionel Messi (Argentina) – 21 goles",
    context: "Mbappé cerró el Mundial 2026 con 10 goles (máximo goleador del torneo) y llegó a 22 en su carrera mundialista, superando a Messi (21) y a Klose (16, ahora 3º)."
  },
  {
    category: "Goleador histórico",
    record: "2º máximo goleador histórico de todos los tiempos",
    holder: "Lionel Messi (Argentina)",
    value: "21 goles (2006–2026)",
    year: 2026,
    vulnerable: false,
    challengedBy: "Miroslav Klose – 16 goles (3er lugar)",
    context: "Messi sumó 8 goles más en 2026 y terminó con 21 en su carrera, en el 2º lugar histórico por detrás de Mbappé (22)."
  },
  {
    category: "Goles en un torneo",
    record: "Más goles en una edición",
    holder: "Just Fontaine (Francia)",
    value: "13 goles (1958)",
    year: 1958,
    vulnerable: false,
    context: "Récord casi imposible de batir. Se juegan 7 partidos máx. por equipo."
  },
  {
    category: "Participaciones",
    record: "Más Mundiales jugados (jugador)",
    holder: "Lionel Messi / Cristiano Ronaldo",
    value: "6 Mundiales (2026) — NUEVO RÉCORD",
    vulnerable: false,
    context: "Tanto Messi como CR7 disputaron su 6to Mundial en 2026, estableciendo un nuevo récord histórico de participaciones."
  },
  {
    category: "Participaciones selección",
    record: "País con más Mundiales",
    holder: "Brasil",
    value: "23 participaciones (todas)",
    vulnerable: false,
    context: "Brasil es el único país en haber participado en los 23 Mundiales disputados hasta 2026."
  },
  {
    category: "Campeones consecutivos",
    record: "Títulos consecutivos",
    holder: "Italia (1934–1938) y Brasil (1958–1962)",
    value: "2 títulos consecutivos",
    vulnerable: false,
    context: "Argentina (campeón 2022) buscaba igualar la marca, pero cayó en la final de 2026 ante España. El récord sigue compartido entre Italia y Brasil — nadie ha logrado 3 títulos seguidos."
  },
  {
    category: "Portería imbatida",
    record: "Minutos sin encajar",
    holder: "Walter Zenga (Italia)",
    value: "517 minutos (1990)",
    vulnerable: false,
    challengedBy: "Emiliano Martínez (Argentina) – 235 minutos (2026)",
    context: "Verificado con los eventos de gol del torneo: la racha más larga de Martínez sin recibir goles en 2026 fue de 235 minutos (arrancó con dos partidos en cero antes de recibir el primero). El récord de Zenga sigue en pie por casi el doble."
  },
  {
    category: "Asistencias",
    record: "Más asistencias históricas",
    holder: "Lionel Messi (Argentina) 🏆",
    value: "10 asistencias (2006–2026) — NUEVO RÉCORD",
    year: 2026,
    vulnerable: false,
    challengedBy: "Diego Maradona (Argentina) – 8 asistencias (récord anterior)",
    context: "Messi llegó al Mundial 2026 empatado con Maradona en 8 asistencias históricas. En el torneo sumó 2 más: asistió el gol de Romero en la remontada 3-2 ante Egipto en octavos (min. 79) y el de Mac Allister ante Suiza en cuartos, cerrando con 10 y superando el récord de Maradona."
  },
  {
    category: "Sede",
    record: "Mayor asistencia en un Mundial",
    holder: "Mundial 2026 (EE.UU. · Canadá · México) 🏆",
    value: "6,810,966 espectadores — NUEVO RÉCORD",
    year: 2026,
    vulnerable: false,
    challengedBy: "EE.UU. 1994 – 3,587,538 espectadores (récord anterior)",
    context: "La API del torneo no expone asistencia por partido, pero fuentes de prensa confirmaron que la FIFA declaró el récord roto antes de terminar la fase de grupos (3,605,357 espectadores en 38 de 104 partidos, promedio ~65,000 por partido). El total final del torneo cerró en 6,810,966, muy por encima de los 3,587,538 de 1994."
  },
  {
    category: "Goles en un partido",
    record: "Partido con más goles",
    holder: "Austria 7–5 Suiza (1954)",
    value: "12 goles",
    vulnerable: false,
    context: "Récord histórico poco probable de batir, pero con 48 equipos y más partidos, las sorpresas abundarán."
  },
  {
    category: "Victorias consecutivas",
    record: "Más victorias seguidas",
    holder: "Argentina 🏆",
    value: "13 partidos sin perder (2022–2026) — NUEVO RÉCORD",
    year: 2026,
    vulnerable: false,
    challengedBy: "Brasil – 11 partidos sin perder (1970–1974, récord anterior)",
    context: "Tras perder su debut en 2022 ante Arabia Saudita, Argentina no volvió a caer hasta la final de 2026 ante España: 6 partidos para cerrar el título de 2022 (incluyendo penales ante Países Bajos y Francia) + 7 victorias corridas en 2026 = 13 partidos seguidos sin perder, superando el récord de Brasil."
  },
];

export const CONTINENT_STATS = [
  { continent: "Europa",        titles: 13, participations: 256, hostTimes: 11, color: "#3b82f6" },
  { continent: "América del Sur", titles: 9, participations: 128, hostTimes: 5, color: "#f59e0b" },
  { continent: "América del Norte", titles: 0, participations: 64, hostTimes: 4, color: "#10b981" },
  { continent: "Asia",           titles: 0, participations: 48, hostTimes: 2, color: "#ef4444" },
  { continent: "África",         titles: 0, participations: 40, hostTimes: 1, color: "#f97316" },
  { continent: "Oceanía",        titles: 0, participations: 8, hostTimes: 0, color: "#06b6d4" },
];

export const MOST_APPEARANCES = [
  { country: "Brasil",     flag: "🇧🇷", fifaCode: "BRA", count: 22, confederation: "CONMEBOL" },
  { country: "Alemania",   flag: "🇩🇪", fifaCode: "GER", count: 20, confederation: "UEFA" },
  { country: "Italia",     flag: "🇮🇹", fifaCode: "ITA", count: 18, confederation: "UEFA" },
  { country: "Argentina",  flag: "🇦🇷", fifaCode: "ARG", count: 18, confederation: "CONMEBOL" },
  { country: "México",     flag: "🇲🇽", fifaCode: "MEX", count: 17, confederation: "CONCACAF" },
  { country: "Francia",    flag: "🇫🇷", fifaCode: "FRA", count: 16, confederation: "UEFA" },
  { country: "España",     flag: "🇪🇸", fifaCode: "ESP", count: 16, confederation: "UEFA" },
  { country: "Inglaterra", flag: "󠁧󠁢󠁥󠁮󠁧󠁿🏴󠁧󠁢󠁥󠁮󠁧󠁿", fifaCode: "ENG", count: 16, confederation: "UEFA" },
  { country: "Uruguay",    flag: "🇺🇾", fifaCode: "URU", count: 14, confederation: "CONMEBOL" },
  { country: "Bélgica",    flag: "🇧🇪", fifaCode: "BEL", count: 14, confederation: "UEFA" },
];
