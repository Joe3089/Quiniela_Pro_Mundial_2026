const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  'https://wkhyihdjojyvxwfrobyw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraHlpaGRqb2p5dnh3ZnJvYnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTkxNDMsImV4cCI6MjA5NDg3NTE0M30.AfUqyGm8O21N3ZJY0iuzDa5iKVtqvnFnjF5u_Mwq274'
);
(async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('id,phase,group_id,home_team_id,away_team_id,match_date,status')
    .order('match_date', { ascending: true });
  if (error) {
    console.error(error);
    process.exit(1);
  }
  console.log('count', data.length);
  const keyMap = new Map();
  data.forEach((m) => {
    const key = [m.phase, m.group_id, m.home_team_id, m.away_team_id, m.match_date, m.status].join('|');
    if (!keyMap.has(key)) keyMap.set(key, []);
    keyMap.get(key).push(m.id);
  });
  const dups = Array.from(keyMap.entries()).filter(([, ids]) => ids.length > 1);
  console.log('unique combos', keyMap.size, 'duplicates', dups.length);
  if (dups.length) console.log('first dups', dups.slice(0, 20).map(([k, ids]) => ({ key: k, ids })));
})();
