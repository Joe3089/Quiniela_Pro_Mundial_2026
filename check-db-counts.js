const https = require('https');
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndraHlpaGRqb2p5dnh3ZnJvYnl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyOTkxNDMsImV4cCI6MjA5NDg3NTE0M30.AfUqyGm8O21N3ZJY0iuzDa5iKVtqvnFnjF5u_Mwq274';
const tables = ['matches', 'teams', 'groups', 'standings', 'predictions'];
let pending = tables.length;
for (const table of tables) {
  const options = {
    hostname: 'wkhyihdjojyvxwfrobyw.supabase.co',
    path: `/rest/v1/${table}?select=id&limit=1`,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: 'count=exact',
    },
  };
  https.get(options, (res) => {
    let data = '';
    res.on('data', (c) => data += c);
    res.on('end', () => {
      console.log(`${table}: status=${res.statusCode} count=${res.headers['content-range'] || 'none'} len=${data.length}`);
      if (--pending === 0) process.exit(0);
    });
  }).on('error', (e) => {
    console.error(`${table}: error ${e.message}`);
    if (--pending === 0) process.exit(1);
  });
}
