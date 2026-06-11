#!/usr/bin/env node
require('dotenv').config({ path: '.env.local', override: true });

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkData() {
  const { data: matches, error: matchErr } = await supabase
    .from('matches')
    .select('count', { count: 'exact' });
  
  const { data: groups, error: groupErr } = await supabase
    .from('groups')
    .select('*');
  
  const { data: teams, error: teamErr } = await supabase
    .from('teams')
    .select('count', { count: 'exact' });

  console.log('Matches count:', matches?.count || 0);
  console.log('Groups:', groups?.length || 0);
  console.log('Teams count:', teams?.count || 0);

  if (groups && groups.length > 0) {
    console.log('\nGroups:');
    groups.forEach(g => console.log(`  - ${g.name} (${g.letter})`));
  }

  if (matchErr) console.error('Match error:', matchErr);
  if (groupErr) console.error('Group error:', groupErr);
  if (teamErr) console.error('Team error:', teamErr);
}

checkData().catch(e => { console.error(e); process.exit(1); });
