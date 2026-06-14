/**
 * Seed player_squads from Call Of Applications.csv
 * Run: node scripts/seed-squads.mjs
 * Requires: NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";

// Load .env.local manually
const envLines = readFileSync(".env.local", "utf-8").split("\n");
const env = {};
for (const line of envLines) {
  const m = line.match(/^([A-Z_]+)=(.+)$/);
  if (m) env[m[1]] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const TOURNAMENT_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

const TEAM_IDS = {
  "Mexico":                    "f2f935ce-7ba6-4bda-ad54-1f522d870d1e",
  "South Africa":              "819414a1-23c1-4d56-ad11-2d290f439ee6",
  "South Korea":               "5df99b6d-2cb0-4978-bfc4-bdc4808add1e",
  "Czech Republic":            "f3df6f9c-f431-47d7-9cbc-806a6b51b75e",
  "Canada":                    "be1cf5ed-abcc-4d80-90dc-c0b369eb7370",
  "Bosnia and Herzegovina":    "f57fb0d3-b325-4a9c-bfed-d8427b90b048",
  "Qatar":                     "19a58a45-7189-4b36-8fd3-88f477ba8a3f",
  "Switzerland":               "41e405b3-5b26-4e7d-b8af-730c8342712a",
  "Brazil":                    "e5db3cf4-9598-495c-b3c3-80b5955f0cea",
  "Morocco":                   "9ffb1c70-c136-440c-af45-a874e6f26ee7",
  "Haiti":                     "89a361aa-babf-4638-9e7a-7639b525f4e0",
  "Scotland":                  "7e917009-b1f0-4fa5-bda2-d64d58d2adc4",
  "United States":             "442c9bbf-c48c-4b57-abaa-53335494359d",
  "Paraguay":                  "b2e92513-e804-4ce1-babc-4c5b294fc618",
  "Australia":                 "f1f4d0bb-9550-49b7-a8be-a79a28be2912",
  "Turkey":                    "d7bce6d8-34dd-4916-9f40-ff2a9f56609d",
  "Deutschland":               "4eb357c0-4396-4d72-b3ce-977e6e2dc8a6",
  "Curaçao":             "1aba3beb-1d1b-4d39-b69f-424a18cd680d",
  "Côte d’Ivoire":  "3bb5fbce-093e-48e7-9f2f-ed36ab87a22b",
  "Ecuador":                   "1aae92af-acf8-461b-99fd-0303c261aea1",
  "Nertherland":               "210d4319-3c1b-4c70-b339-acaa9ed22239",
  "Japan":                     "8bd613fa-1353-4a69-93af-1ae4163dfb86",
  "Sweden":                    "67bfec1a-5da6-4bf9-aab1-f6a4802dcba3",
  "Tunisia":                   "524c559a-4e9f-4f0f-9768-a317bd6fca8a",
  "Belgium":                   "b2cd1c20-e61c-4a74-abf1-c938a359ff69",
  "Egypt":                     "59fa371a-d7f5-41d3-99b5-97af328066e0",
  "Iran":                      "38a29269-1586-4b05-949e-0dbc04ebfbb9",
  "New Zeland":                "98373185-6efd-465d-a821-3e7e0dece960",
  "Spain":                     "15881210-5ee1-4dca-a81a-ae806796e6c2",
  "Cape Verde":                "82206106-bf90-4b86-90fd-1bfd20fd043e",
  "Saudi Arabia":              "4cf18ea3-dd98-437b-9abd-9a778dbc374a",
  "Uruguay":                   "41a06eb1-cc4f-44cc-9e41-c63a62211bcd",
  "France":                    "9ff5792a-2a50-48d2-b83b-79405d6129ae",
  "Senegal":                   "a6fe4f36-1bf2-4191-b391-1dbbf2fc1218",
  "Iraq":                      "2bcac82d-3f4e-40de-81a3-9749f1ec5eb4",
  "Norway":                    "bcaaa33e-2212-427d-b6f4-4baf5d132f9f",
  "Argentina":                 "d4d648d7-ca16-4688-a2b5-66d353b6e0a8",
  "Algeria":                   "37062f6e-dbbd-450a-a2c5-9feb0666b79e",
  "Austria":                   "f80a9a6a-540b-42be-b0b0-161a5597d224",
  "Jordan":                    "cdc5b233-42fe-4b32-88fe-b3c8fac4400a",
  "Portugal":                  "8dcb4fd7-ec16-4894-b9a5-18af9df6e337",
  "RD Congo":                  "429be785-a88f-4339-b0f4-6a0e68726b16",
  "Uzbekistan":                "59e6d526-98db-47e1-92e7-2743c8f6e678",
  "Colombia":                  "7631e0b5-b770-4576-b8ac-1a86f66d92ed",
  "England":                   "a814f9bd-3e5f-40ea-b49f-79419f07a425",
  "Hrvatska":                  "72807304-8681-4149-aa36-f38550b33cc8",
  "Ghana":                     "19458bcf-6033-472f-aebb-7dac6fc2d6dc",
  "Panama":                    "c2023b60-a386-4c3f-b2bf-494a8539170e",
};

const POS_MAP = {
  "Portero": "GK",
  "Defensa": "DF",
  "Mediocampista": "MF",
  "Delantero": "FW",
};

// Column indices: player names at 0,6,11,17; positions at 1,7,12,18
// Team header names at cols 2,8,13,19
const TEAM_COLS = [[0,1],[6,7],[11,12],[17,18]];
const HEADER_COLS = [2,8,13,19];

function parseCSV(csvPath) {
  // Read with latin1 to preserve byte values, then re-encode
  const raw = readFileSync(csvPath, "latin1");
  const lines = raw.split("\n");
  const players = [];
  let currentTeams = ["","","",""];

  for (const line of lines) {
    const cols = line.split(";");
    while (cols.length < 20) cols.push("");
    const c0 = cols[0].trim();

    if (c0 === "") {
      // Possible team header row
      const candidates = HEADER_COLS.map(i => cols[i]?.trim() ?? "");
      const isTeamRow = candidates.some(c => c !== "" && TEAM_IDS[c] !== undefined);
      if (isTeamRow) {
        currentTeams = candidates;
      }
      continue;
    }

    if (c0.startsWith("DT") || c0 === "Jugador" || c0.startsWith("LISTA")) continue;

    // Player row
    for (let ti = 0; ti < 4; ti++) {
      const teamName = currentTeams[ti];
      if (!teamName) continue;
      const [nc, pc] = TEAM_COLS[ti];
      const pname = cols[nc]?.trim() ?? "";
      const ppos  = cols[pc]?.trim() ?? "";
      if (!pname || !ppos) continue;
      const teamId = TEAM_IDS[teamName];
      if (!teamId) continue;
      const position = POS_MAP[ppos];
      if (!position) continue;
      players.push({ team_id: teamId, tournament_id: TOURNAMENT_ID, name: pname, position, is_starter: false, is_captain: false, is_injured: false, source: "csv" });
    }
  }
  return players;
}

async function main() {
  const csvPath = "C:\\Users\\Usuario\\Desktop\\BD de supebase\\BD Quiniela\\Call Of Applications.csv";
  const players = parseCSV(csvPath);
  console.log(`Parsed ${players.length} players`);

  // Clear existing CSV records
  const { error: delErr } = await supabase.from("player_squads").delete().eq("source", "csv");
  if (delErr) { console.error("Delete error:", delErr); process.exit(1); }
  console.log("Cleared existing CSV records");

  // Insert in batches of 200
  let inserted = 0;
  const BATCH = 200;
  for (let i = 0; i < players.length; i += BATCH) {
    const batch = players.slice(i, i + BATCH);
    const { error } = await supabase.from("player_squads").insert(batch);
    if (error) {
      console.error(`Batch ${i/BATCH + 1} error:`, error.message ?? error);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`Inserted ${inserted}/${players.length}`);
  }
  console.log("Done!");
}

main().catch(e => { console.error(e); process.exit(1); });
