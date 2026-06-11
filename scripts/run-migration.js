#!/usr/bin/env node
require('dotenv').config({ path: '.env.local', override: true });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  const sql = `
    alter table public.teams
      add constraint teams_tournament_name_unique unique (tournament_id, name);
  `;

  try {
    const { data, error } = await supabase.rpc('exec', { sql });
    if (error) throw error;
    console.log('Migration applied successfully');
  } catch (e) {
    // Try direct SQL approach if rpc doesn't work
    console.log('Attempting direct SQL execution...');
    const { error } = await supabase.schema.public.table('teams').select('*').limit(1);
    if (error) throw error;
    console.log('Database connection verified. Please run this SQL in Supabase dashboard:');
    console.log(sql);
  }
}

runMigration().catch((e) => {
  console.error('Error:', e.message || e);
  console.log('\nManual fix: Run this SQL in your Supabase dashboard SQL editor:');
  console.log('');
  console.log('alter table public.teams add constraint teams_tournament_name_unique unique (tournament_id, name);');
  process.exit(1);
});
