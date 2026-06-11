const https = require('https');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraHlpaGRqb2p5dnh3ZnJvYnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTkxNDMsImV4cCI6MjA5NDg3NTE0M30.AfUqyGm8O21N3ZJY0iuzDa5iKVtqvnFnjF5u_Mwq274';
const fetch = (path) => new Promise((resolve, reject) => {
  https.get({ hostname: 'wkhyihdjojyvxwfrobyw.supabase.co', path, headers: { apikey: key, Authorization: `Bearer ${key}` } }, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => resolve(JSON.parse(data)));
  }).on('error', reject);
});
(async () => {
  try {
    const match = await fetch('/rest/v1/matches?select=*&limit=1');
    const team = await fetch('/rest/v1/teams?select=*&limit=1');
    const group = await fetch('/rest/v1/groups?select=*&limit=1');
    console.log('match', JSON.stringify(match, null, 2));
    console.log('team', JSON.stringify(team, null, 2));
    console.log('group', JSON.stringify(group, null, 2));
  } catch (err) {
    console.error('error', err);
  }
})();
