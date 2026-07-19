import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^"|"$/g,'')];}));
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const TID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const KEY = env.API_FOOTBALL_KEY;
async function api(path){ const r=await fetch(`https://v3.football.api-sports.io${path}`,{headers:{'x-apisports-key':KEY}}); const j=await r.json(); return j; }

const EXTRA={'ø':'o','æ':'ae','ß':'ss','ł':'l','đ':'d','ð':'d','þ':'th','œ':'oe','ı':'i','ø':'o'};
const norm=s=>(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().split('').map(c=>EXTRA[c]||c).join('').replace(/[^a-z\s]/g,'').replace(/\s+/g,' ').trim();
const tokens=s=>norm(s).split(' ').filter(t=>t.length>1);
const lastTok=s=>{const t=tokens(s); return t[t.length-1]||norm(s);};
const initOf=n=>{const m=n.match(/^\s*(\p{L})\.?\s/u); return m?norm(m[1]):null;};

// NAME_ALIASES from route (canonical)
const ALIAS={"K. Mbappe":"Kylian Mbappé","K. Mbappé":"Kylian Mbappé","L. Messi":"Lionel Messi","H. Kane":"Harry Kane","C. Ronaldo":"Cristiano Ronaldo","M. Olise":"Michael Olise"};
const canon=n=>ALIAS[n]||n;

// 1) gather scorer/assister -> team_id
const { data: ev } = await sb.from('match_events').select('player_name, assist_name, team_id, type').eq('tournament_id',TID).in('type',['goal','penalty']);
const nameTeam={}; // canonicalName -> Set(team_id)
const allNames=new Set();
for(const r of ev){
  const s=canon(r.player_name); allNames.add(s); (nameTeam[s]=nameTeam[s]||new Set()).add(r.team_id);
  if(r.assist_name){ const a=canon(r.assist_name); allNames.add(a); (nameTeam[a]=nameTeam[a]||new Set()).add(r.team_id); }
}
console.log('unique names:', allNames.size);

// 2) team_id -> api_football_team_id
const { data: teams } = await sb.from('teams').select('id, name, api_football_team_id').eq('tournament_id',TID);
const teamApi={}; for(const t of teams) teamApi[t.id]=t.api_football_team_id;

// 3) fetch squads per api team id (cache)
const squadCache={};
async function getSquad(apiId){
  if(!apiId) return [];
  if(squadCache[apiId]) return squadCache[apiId];
  const j=await api(`/players/squads?team=${apiId}`);
  const players=j.response?.[0]?.players||[];
  squadCache[apiId]=players; return players;
}
// profiles cache
const profCache={};
async function profiles(sur){ if(profCache[sur]) return profCache[sur]; const j=await api(`/players/profiles?search=${encodeURIComponent(sur)}`); const r=j.response||[]; profCache[sur]=r; return r; }

function matchInSquad(name, squad){
  const sur=lastTok(name); const oi=initOf(name);
  const cand=squad.filter(p=>{ const pt=tokens(p.name); return pt[pt.length-1]===sur || pt.includes(sur); });
  if(!cand.length) return null;
  if(oi){ const byi=cand.find(p=>norm(p.name)[0]===oi || norm(p.firstname||'')[0]===oi); if(byi) return byi; }
  return cand[0];
}
function matchInProfiles(name, list){
  const sur=lastTok(name); const oi=initOf(name);
  const scored=list.map(c=>{const p=c.player; const pt=tokens(p.name); const last=pt[pt.length-1]; let s=0; if(last===sur)s+=10; else if(pt.includes(sur))s+=6; const fi=norm(p.firstname||p.name)[0]; if(oi){ if(fi===oi)s+=5; else s-=3;} if(norm(p.name)===norm(name))s+=8; return {p,s};}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s);
  return scored[0]?.p||null;
}

const rows=[]; const unresolved=[];
for(const name of allNames){
  let found=null;
  for(const tid of nameTeam[name]){
    const apiId=teamApi[tid];
    const squad=await getSquad(apiId);
    const m=matchInSquad(name, squad);
    if(m){ found={id:m.id, name:m.name}; break; }
  }
  if(!found){
    const list=await profiles(lastTok(name));
    const m=matchInProfiles(name, list);
    if(m) found={id:m.id, name:m.name};
  }
  if(found){ rows.push({ name, api_football_id: found.id, photo_url:`https://media.api-sports.io/football/players/${found.id}.png`, updated_at:new Date().toISOString() }); }
  else unresolved.push(name);
}
console.log('resolved:', rows.length, '| unresolved:', unresolved.length);
console.log('unresolved names:', unresolved.join(', '));

// 4) upsert
let ok=0;
for(let i=0;i<rows.length;i+=100){ const chunk=rows.slice(i,i+100); const {error}=await sb.from('player_photos').upsert(chunk,{onConflict:'name'}); if(error){console.log('upsert err',error.message);} else ok+=chunk.length; }
console.log('upserted:', ok);
console.log('api requests used this run ~', Object.keys(squadCache).length + Object.keys(profCache).length);
