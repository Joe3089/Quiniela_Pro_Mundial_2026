#!/usr/bin/env node
/*
  CSV importer + image uploader
  - Imports `Teams.csv` into `teams` (upsert)
  - Tries to import `Match.csv` into `matches` (best-effort heuristic)
  - Uploads local images found in the provided folder to Supabase Storage
  - Updates `teams` with `flag_url`, `escudo_url`, `logo_url` when matches found

  Usage:
    node scripts/import-csv-to-supabase.js "C:/Users/Usuario/Desktop/BD de supebase/BD Quiniela"
    (reads from .env.local or env variables)

  Requirements:
    - `@supabase/supabase-js` installed (already in project)
    - `.env.local` with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
    - A Supabase bucket named `team-logos` (or adjust `IMAGE_BUCKET` below)
*/
require('dotenv').config({ path: '.env.local', override: true });

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const csvFolder = process.argv[2] || path.join(__dirname, '..', 'BD de supebase', 'BD Quiniela');
const IMAGE_BUCKET = process.env.IMAGE_BUCKET || 'team-logos';

// Debug: check if env vars loaded
console.log('Env vars loaded:');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? 'OK' : 'MISSING');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK (length: ' + process.env.SUPABASE_SERVICE_ROLE_KEY.length + ')' : 'MISSING');
console.log('  IMAGE_BUCKET:', IMAGE_BUCKET);

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findTournament() {
  const { data, error } = await supabase.from('tournaments').select('*').eq('slug', 'mundial-2026').maybeSingle();
  if (error) throw error;
  return data;
}

function parseSemicolonCSV(content) {
  const lines = content.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((l) => l.split(';').map((c) => c.trim()));
}

function normalizeName(s) {
  return s
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]/gi, '').toLowerCase();
}

async function uploadImages(folder, teams) {
  // find image files in folder
  const exts = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
  const files = fs.readdirSync(folder).filter((f) => exts.includes(path.extname(f).toLowerCase()));
  if (!files.length) {
    console.log('No image files found in', folder);
    return {};
  }

  const map = {};
  for (const f of files) {
    const name = path.basename(f, path.extname(f));
    const normalized = normalizeName(name);

    // try to match to a team
    const match = teams.find((t) => normalizeName(t.name).includes(normalized) || normalized.includes(normalizeName(t.name)));
    if (!match) continue;

    const filePath = `teams/${match.name.replace(/[^a-z0-9]/gi, '_')}${path.extname(f)}`;
    const full = path.join(folder, f);
    const fileBuffer = fs.readFileSync(full);

    try {
      const { error: upErr } = await supabase.storage.from(IMAGE_BUCKET).upload(filePath, fileBuffer, { upsert: true });
      if (upErr) { console.warn('Upload failed for', f, upErr); continue; }
      const { data } = await supabase.storage.from(IMAGE_BUCKET).getPublicUrl(filePath);
      const publicUrl = data?.publicUrl ?? null;
      if (publicUrl) {
        map[match.name] = publicUrl;
        console.log('Uploaded', f, '->', publicUrl);
      }
    } catch (e) {
      console.warn('Storage error for', f, e.message || e);
    }
  }

  return map;
}

async function importTeams(folder, tournament) {
  const file = path.join(folder, 'Teams.csv');
  if (!fs.existsSync(file)) {
    console.error('Teams.csv not found in', folder);
    return [];
  }

  const raw = fs.readFileSync(file, 'utf8');
  const rows = parseSemicolonCSV(raw);

  const teams = [];
  for (const cols of rows) {
    // Heuristic: pick non-empty cells that look like country names
    for (const c of cols) {
      if (!c) continue;
      const low = c.toLowerCase();
      if (['pais', 'bandera', 'escudo de la federacion', 'selecciones', 'teams'].some((k) => low.includes(k))) continue;
      if (/\d/.test(c)) continue;
      if (c.length < 2 || c.length > 60) continue;
      teams.push({ name: c });
      break;
    }
  }

  // dedupe by normalized name
  const dedup = Object.values(teams.reduce((acc, t) => { acc[normalizeName(t.name)] = t; return acc; }, {}));

  const toUpsert = dedup.map((t) => {
    // Generate FIFA code: first 3 uppercase letters of name
    const fifa = t.name.replace(/[^a-z]/gi, '').substring(0, 3).toUpperCase();
    return {
      tournament_id: tournament.id,
      name: t.name,
      short_name: t.name.substring(0, 20),
      fifa_code: fifa || 'XXX',
      continent: 'Unknown',
    };
  });

  const batchSize = 50;
  for (let i = 0; i < toUpsert.length; i += batchSize) {
    const batch = toUpsert.slice(i, i + batchSize);
    const { data, error } = await supabase.from('teams').upsert(batch, { onConflict: ['tournament_id', 'name'] }).select();
    if (error) {
      console.error('Upsert error:', error);
    } else {
      console.log(`Upserted ${data.length} teams (batch ${i / batchSize + 1})`);
    }
  }

  return dedup;
}

async function importMatches(folder, tournament, teamsByName) {
  const fileCandidates = ['Match.csv', 'Fixture.csv', 'matches.csv'];
  let file = null;
  for (const f of fileCandidates) {
    const p = path.join(folder, f);
    if (fs.existsSync(p)) { file = p; break; }
  }
  if (!file) { console.log('No matches CSV found'); return; }

  const raw = fs.readFileSync(file, 'utf8');
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const pairs = [];
  for (const line of lines) {
    const cols = line.split(';').map((c) => c.trim()).filter(Boolean);
    // find two team names in the columns
    const found = cols.map((c) => {
      const match = Object.keys(teamsByName).find((n) => normalizeName(n) === normalizeName(c) || normalizeName(n).includes(normalizeName(c)) || normalizeName(c).includes(normalizeName(n)));
      return match ?? null;
    }).filter(Boolean);
    if (found.length >= 2) {
      pairs.push({ home: found[0], away: found[1], raw: cols });
    }
  }

  if (!pairs.length) { console.log('No obvious match rows parsed from', file); return; }

  const tournamentId = tournament.id;
  for (const p of pairs) {
    const home = teamsByName[p.home];
    const away = teamsByName[p.away];
    if (!home || !away) continue;

    const matchRow = {
      tournament_id: tournamentId,
      phase: 'group',
      group_id: null,
      home_team_id: home.id || null,
      away_team_id: away.id || null,
      match_date: new Date().toISOString(),
      venue: null,
      city: null,
      status: 'scheduled',
    };

    const { data, error } = await supabase.from('matches').upsert(matchRow, { onConflict: ['tournament_id', 'home_team_id', 'away_team_id', 'match_date'] }).select();
    if (error) console.warn('Match upsert error', error);
    else console.log('Upserted match', p.home, 'vs', p.away);
  }
}

async function buildTeamsIndex(tournament) {
  const { data, error } = await supabase.from('teams').select('*').eq('tournament_id', tournament.id);
  if (error) throw error;
  const byName = {};
  (data || []).forEach((t) => { byName[t.name] = t; });
  return byName;
}

async function main() {
  const tournament = await findTournament();
  if (!tournament) { console.error('Tournament "mundial-2026" not found. Create it first.'); process.exit(1); }

  console.log('Importing teams...');
  const dedupTeams = await importTeams(csvFolder, tournament);

  console.log('Refreshing teams from DB...');
  const teamsByName = await buildTeamsIndex(tournament);

  console.log('Uploading images (if any) and updating teams...');
  const imageMap = await uploadImages(csvFolder, Object.values(teamsByName));

  // apply image URLs to teams
  for (const [teamName, url] of Object.entries(imageMap)) {
    const team = Object.values(teamsByName).find((t) => normalizeName(t.name) === normalizeName(teamName));
    if (!team) continue;
    const updates = { id: team.id, escudo_url: url, logo_url: url, flag_url: team.flag_url || url };
    const { data, error } = await supabase.from('teams').update(updates).eq('id', team.id).select();
    if (error) console.warn('Failed to update team image URLs for', team.name, error);
    else console.log('Updated images for', team.name);
  }

  console.log('Importing matches (best-effort)...');
  await importMatches(csvFolder, tournament, teamsByName);

  console.log('Import complete');
}

main().catch((e) => { console.error(e); process.exit(1); });
