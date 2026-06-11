const { createClient } = require('@supabase/supabase-js');
const url = 'https://wkhyihdjojyvxwfrobyw.supabase.co';
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraHlpaGRqb2p5dnh3ZnJvYnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTkxNDMsImV4cCI6MjA5NDg3NTE0M30.AfUqyGm8O21N3ZJY0iuzDa5iKVtqvnFnjF5u_Mwq274';
const supabase = createClient(url, anon);
(async () => {
  const { data: teams, error: e1 } = await supabase.from('teams').select('id,name,tournament_id').eq('tournament_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890').limit(5);
  console.log('teams', teams?.length, e1);
  const { data: matches, error: e2 } = await supabase.from('matches').select('id,home_team_id,away_team_id,tournament_id').eq('tournament_id', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890').limit(5);
  console.log('matches', matches?.length, e2);
})();
