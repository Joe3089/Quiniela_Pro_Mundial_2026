-- ══════════════════════════════════════════════════════
-- QUINIELA PRO — WC 2026 SEED DATA
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- 1. TOURNAMENT
INSERT INTO tournaments (id, name, slug, season, start_date, end_date, is_active, host_countries)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'FIFA World Cup 2026',
  'mundial-2026',
  '2026',
  '2026-06-11',
  '2026-07-19',
  true,
  ARRAY['USA','Canada','Mexico']
)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- 2. TEAMS (48 teams)
INSERT INTO teams (id, name, short_name, fifa_code, continent, flag_url, tournament_id) VALUES
-- CONCACAF
('t-usa','United States','USA','USA','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-mex','Mexico','MEX','MEX','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-can','Canada','CAN','CAN','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-pan','Panama','PAN','PAN','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-hon','Honduras','HON','HON','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-jam','Jamaica','JAM','JAM','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- CONMEBOL
('t-arg','Argentina','ARG','ARG','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-bra','Brazil','BRA','BRA','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-col','Colombia','COL','COL','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-ecu','Ecuador','ECU','ECU','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-uru','Uruguay','URU','URU','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-ven','Venezuela','VEN','VEN','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- UEFA
('t-esp','Spain','ESP','ESP','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-fra','France','FRA','FRA','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-eng','England','ENG','ENG','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-ger','Germany','GER','GER','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-por','Portugal','POR','POR','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-ned','Netherlands','NED','NED','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-bel','Belgium','BEL','BEL','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-srb','Serbia','SRB','SRB','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-cro','Croatia','CRO','CRO','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-hun','Hungary','HUN','HUN','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-aut','Austria','AUT','AUT','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-den','Denmark','DEN','DEN','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-sco','Scotland','SCO','SCO','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-svk','Slovakia','SVK','SVK','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-pol','Poland','POL','POL','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-tur','Turkey','TUR','TUR','UEFA',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- AFC
('t-jpn','Japan','JPN','JPN','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-kor','South Korea','KOR','KOR','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-irn','Iran','IRN','IRN','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-ksa','Saudi Arabia','KSA','KSA','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-aus','Australia','AUS','AUS','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-uzb','Uzbekistan','UZB','UZB','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-jor','Jordan','JOR','JOR','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-irq','Iraq','IRQ','IRQ','AFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- CAF
('t-mar','Morocco','MAR','MAR','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-sen','Senegal','SEN','SEN','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-nga','Nigeria','NGA','NGA','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-egy','Egypt','EGY','EGY','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-cmr','Cameroon','CMR','CMR','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-gha','Ghana','GHA','GHA','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-civ','Ivory Coast','CIV','CIV','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-rsa','South Africa','RSA','RSA','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-tun','Tunisia','TUN','TUN','CAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- OFC
('t-nzl','New Zealand','NZL','NZL','OFC',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
-- Intercontinental Playoff
('t-crc','Costa Rica','CRC','CRC','CONCACAF',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('t-bol','Bolivia','BOL','BOL','CONMEBOL',NULL,'a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- 3. GROUPS (A through L)
INSERT INTO groups (id, name, letter, tournament_id) VALUES
('g-a','Grupo A','A','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-b','Grupo B','B','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-c','Grupo C','C','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-d','Grupo D','D','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-e','Grupo E','E','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-f','Grupo F','F','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-g','Grupo G','G','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-h','Grupo H','H','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-i','Grupo I','I','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-j','Grupo J','J','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-k','Grupo K','K','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
('g-l','Grupo L','L','a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT (id) DO NOTHING;

-- 4. GROUP STAGE STANDINGS (initial 0s)
INSERT INTO standings (id, group_id, team_id, tournament_id, played, won, drawn, lost, goals_for, goals_against, goal_difference, points)
SELECT gen_random_uuid(), g.gid, g.tid, 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 0,0,0,0,0,0,0,0
FROM (VALUES
  ('g-a','t-usa'),('g-a','t-mar'),('g-a','t-jpn'),('g-a','t-pol'),
  ('g-b','t-mex'),('g-b','t-sen'),('g-b','t-kor'),('g-b','t-hun'),
  ('g-c','t-can'),('g-c','t-egy'),('g-c','t-irn'),('g-c','t-svk'),
  ('g-d','t-arg'),('g-d','t-nga'),('g-d','t-ksa'),('g-d','t-sco'),
  ('g-e','t-bra'),('g-e','t-civ'),('g-e','t-aus'),('g-e','t-tur'),
  ('g-f','t-col'),('g-f','t-cmr'),('g-f','t-jor'),('g-f','t-srb'),
  ('g-g','t-ecu'),('g-g','t-gha'),('g-g','t-irq'),('g-g','t-cro'),
  ('g-h','t-uru'),('g-h','t-tun'),('g-h','t-uzb'),('g-h','t-por'),
  ('g-i','t-ven'),('g-i','t-rsa'),('g-i','t-nzl'),('g-i','t-ned'),
  ('g-j','t-pan'),('g-j','t-bol'),('g-j','t-esp'),('g-j','t-fra'),
  ('g-k','t-hon'),('g-k','t-crc'),('g-k','t-eng'),('g-k','t-ger'),
  ('g-l','t-jam'),('g-l','t-den'),('g-l','t-aut'),('g-l','t-bel')
) AS g(gid, tid)
ON CONFLICT DO NOTHING;

-- 5. GROUP STAGE MATCHES (72 matches — 6 per group × 12 groups)
-- Each group: MD1 (days 1-3), MD2 (days 7-10), MD3 (days 16-19)
-- Base date: 2026-06-11
-- Group A matches (USA, MAR, JPN, POL)
INSERT INTO matches (id, tournament_id, phase, group_id, home_team_id, away_team_id, match_date, status, round_number, venue, city) VALUES
('m-a1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-usa','t-pol','2026-06-11 20:00:00+00',  'scheduled',1,'SoFi Stadium','Los Ángeles'),
('m-a2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-mar','t-jpn','2026-06-12 17:00:00+00',  'scheduled',1,'Rose Bowl','Los Ángeles'),
('m-a3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-pol','t-jpn','2026-06-17 17:00:00+00',  'scheduled',2,'MetLife Stadium','New York'),
('m-a4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-usa','t-mar','2026-06-17 20:00:00+00',  'scheduled',2,'AT&T Stadium','Dallas'),
('m-a5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-jpn','t-usa','2026-06-26 20:00:00+00',  'scheduled',3,'Levi Stadium','San Francisco'),
('m-a6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-a','t-pol','t-mar','2026-06-26 20:00:00+00',  'scheduled',3,'Estadio Azteca','Ciudad de México'),
-- Group B (MEX, SEN, KOR, HUN)
('m-b1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-mex','t-hun','2026-06-11 17:00:00+00',  'scheduled',1,'Estadio Azteca','Ciudad de México'),
('m-b2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-sen','t-kor','2026-06-12 20:00:00+00',  'scheduled',1,'AT&T Stadium','Dallas'),
('m-b3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-hun','t-kor','2026-06-18 17:00:00+00',  'scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-b4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-mex','t-sen','2026-06-18 20:00:00+00',  'scheduled',2,'Estadio Akron','Guadalajara'),
('m-b5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-kor','t-mex','2026-06-27 20:00:00+00',  'scheduled',3,'Lumen Field','Seattle'),
('m-b6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-b','t-hun','t-sen','2026-06-27 20:00:00+00',  'scheduled',3,'BC Place','Vancouver'),
-- Group C (CAN, EGY, IRN, SVK)
('m-c1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-can','t-svk','2026-06-12 14:00:00+00',  'scheduled',1,'BC Place','Vancouver'),
('m-c2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-egy','t-irn','2026-06-13 17:00:00+00',  'scheduled',1,'MetLife Stadium','New York'),
('m-c3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-svk','t-irn','2026-06-19 14:00:00+00',  'scheduled',2,'Rose Bowl','Los Ángeles'),
('m-c4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-can','t-egy','2026-06-19 17:00:00+00',  'scheduled',2,'BMO Field','Toronto'),
('m-c5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-irn','t-can','2026-06-28 20:00:00+00',  'scheduled',3,'AT&T Stadium','Dallas'),
('m-c6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-c','t-svk','t-egy','2026-06-28 20:00:00+00',  'scheduled',3,'SoFi Stadium','Los Ángeles'),
-- Group D (ARG, NGA, KSA, SCO)
('m-d1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-arg','t-sco','2026-06-12 23:00:00+00',  'scheduled',1,'MetLife Stadium','New York'),
('m-d2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-nga','t-ksa','2026-06-13 20:00:00+00',  'scheduled',1,'AT&T Stadium','Dallas'),
('m-d3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-sco','t-ksa','2026-06-18 14:00:00+00',  'scheduled',2,'Levi Stadium','San Francisco'),
('m-d4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-arg','t-nga','2026-06-18 23:00:00+00',  'scheduled',2,'Rose Bowl','Los Ángeles'),
('m-d5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-ksa','t-arg','2026-06-27 17:00:00+00',  'scheduled',3,'SoFi Stadium','Los Ángeles'),
('m-d6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-d','t-sco','t-nga','2026-06-27 17:00:00+00',  'scheduled',3,'MetLife Stadium','New York'),
-- Group E (BRA, CIV, AUS, TUR)
('m-e1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-bra','t-tur','2026-06-13 14:00:00+00',  'scheduled',1,'SoFi Stadium','Los Ángeles'),
('m-e2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-civ','t-aus','2026-06-13 23:00:00+00',  'scheduled',1,'AT&T Stadium','Dallas'),
('m-e3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-tur','t-aus','2026-06-19 20:00:00+00',  'scheduled',2,'MetLife Stadium','New York'),
('m-e4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-bra','t-civ','2026-06-20 17:00:00+00',  'scheduled',2,'Rose Bowl','Los Ángeles'),
('m-e5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-aus','t-bra','2026-06-28 17:00:00+00',  'scheduled',3,'Lumen Field','Seattle'),
('m-e6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-e','t-tur','t-civ','2026-06-28 17:00:00+00',  'scheduled',3,'BC Place','Vancouver'),
-- Group F (COL, CMR, JOR, SRB)
('m-f1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-col','t-srb','2026-06-14 17:00:00+00',  'scheduled',1,'Arrowhead Stadium','Kansas City'),
('m-f2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-cmr','t-jor','2026-06-14 20:00:00+00',  'scheduled',1,'NRG Stadium','Houston'),
('m-f3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-srb','t-jor','2026-06-20 14:00:00+00',  'scheduled',2,'MetLife Stadium','New York'),
('m-f4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-col','t-cmr','2026-06-20 23:00:00+00',  'scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-f5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-jor','t-col','2026-06-29 17:00:00+00',  'scheduled',3,'AT&T Stadium','Dallas'),
('m-f6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-f','t-srb','t-cmr','2026-06-29 17:00:00+00',  'scheduled',3,'Rose Bowl','Los Ángeles'),
-- Group G (ECU, GHA, IRQ, CRO)
('m-g1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-ecu','t-cro','2026-06-14 14:00:00+00',  'scheduled',1,'Levi Stadium','San Francisco'),
('m-g2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-gha','t-irq','2026-06-15 17:00:00+00',  'scheduled',1,'NRG Stadium','Houston'),
('m-g3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-cro','t-irq','2026-06-21 14:00:00+00',  'scheduled',2,'BC Place','Vancouver'),
('m-g4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-ecu','t-gha','2026-06-21 20:00:00+00',  'scheduled',2,'AT&T Stadium','Dallas'),
('m-g5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-irq','t-ecu','2026-06-29 20:00:00+00',  'scheduled',3,'MetLife Stadium','New York'),
('m-g6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-g','t-cro','t-gha','2026-06-29 20:00:00+00',  'scheduled',3,'Levi Stadium','San Francisco'),
-- Group H (URU, TUN, UZB, POR)
('m-h1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-por','t-tun','2026-06-15 14:00:00+00',  'scheduled',1,'Rose Bowl','Los Ángeles'),
('m-h2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-uru','t-uzb','2026-06-15 20:00:00+00',  'scheduled',1,'Arrowhead Stadium','Kansas City'),
('m-h3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-tun','t-uzb','2026-06-21 17:00:00+00',  'scheduled',2,'AT&T Stadium','Dallas'),
('m-h4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-por','t-uru','2026-06-21 23:00:00+00',  'scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-h5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-uzb','t-por','2026-06-30 20:00:00+00',  'scheduled',3,'Lumen Field','Seattle'),
('m-h6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-h','t-tun','t-uru','2026-06-30 20:00:00+00',  'scheduled',3,'NRG Stadium','Houston'),
-- Group I (VEN, RSA, NZL, NED)
('m-i1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-ned','t-rsa','2026-06-15 23:00:00+00',  'scheduled',1,'MetLife Stadium','New York'),
('m-i2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-ven','t-nzl','2026-06-16 17:00:00+00',  'scheduled',1,'Estadio Azteca','Ciudad de México'),
('m-i3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-rsa','t-nzl','2026-06-22 14:00:00+00',  'scheduled',2,'Rose Bowl','Los Ángeles'),
('m-i4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-ned','t-ven','2026-06-22 20:00:00+00',  'scheduled',2,'AT&T Stadium','Dallas'),
('m-i5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-nzl','t-ned','2026-06-30 17:00:00+00',  'scheduled',3,'BC Place','Vancouver'),
('m-i6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-i','t-rsa','t-ven','2026-06-30 17:00:00+00',  'scheduled',3,'BMO Field','Toronto'),
-- Group J (PAN, BOL, ESP, FRA)
('m-j1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-esp','t-bol','2026-06-16 14:00:00+00',  'scheduled',1,'SoFi Stadium','Los Ángeles'),
('m-j2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-fra','t-pan','2026-06-16 20:00:00+00',  'scheduled',1,'Levi Stadium','San Francisco'),
('m-j3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-bol','t-pan','2026-06-22 17:00:00+00',  'scheduled',2,'NRG Stadium','Houston'),
('m-j4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-esp','t-fra','2026-06-22 23:00:00+00',  'scheduled',2,'MetLife Stadium','New York'),
('m-j5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-pan','t-esp','2026-07-01 20:00:00+00',  'scheduled',3,'Estadio Akron','Guadalajara'),
('m-j6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-j','t-bol','t-fra','2026-07-01 20:00:00+00',  'scheduled',3,'Rose Bowl','Los Ángeles'),
-- Group K (HON, CRC, ENG, GER)
('m-k1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-eng','t-crc','2026-06-16 23:00:00+00',  'scheduled',1,'AT&T Stadium','Dallas'),
('m-k2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-ger','t-hon','2026-06-17 14:00:00+00',  'scheduled',1,'Arrowhead Stadium','Kansas City'),
('m-k3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-crc','t-hon','2026-06-23 14:00:00+00',  'scheduled',2,'Estadio Azteca','Ciudad de México'),
('m-k4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-eng','t-ger','2026-06-23 23:00:00+00',  'scheduled',2,'MetLife Stadium','New York'),
('m-k5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-hon','t-eng','2026-07-01 17:00:00+00',  'scheduled',3,'NRG Stadium','Houston'),
('m-k6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-k','t-crc','t-ger','2026-07-01 17:00:00+00',  'scheduled',3,'SoFi Stadium','Los Ángeles'),
-- Group L (JAM, DEN, AUT, BEL)
('m-l1','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-bel','t-jam','2026-06-17 23:00:00+00',  'scheduled',1,'Rose Bowl','Los Ángeles'),
('m-l2','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-den','t-aut','2026-06-17 20:00:00+00',  'scheduled',1,'Lumen Field','Seattle'),
('m-l3','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-jam','t-aut','2026-06-23 17:00:00+00',  'scheduled',2,'AT&T Stadium','Dallas'),
('m-l4','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-bel','t-den','2026-06-23 20:00:00+00',  'scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-l5','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-aut','t-bel','2026-07-02 20:00:00+00',  'scheduled',3,'Estadio Azteca','Ciudad de México'),
('m-l6','a1b2c3d4-e5f6-7890-abcd-ef1234567890','group','g-l','t-jam','t-den','2026-07-02 20:00:00+00',  'scheduled',3,'BC Place','Vancouver')
ON CONFLICT (id) DO NOTHING;

-- 6. KNOCKOUT STAGE PLACEHOLDERS (Round of 32 — 16 matches)
INSERT INTO matches (id, tournament_id, phase, group_id, home_team_id, away_team_id, match_date, status, round_number, venue, city) VALUES
('m-r32-01','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-04 17:00:00+00','scheduled',1,'MetLife Stadium','New York'),
('m-r32-02','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-04 21:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
('m-r32-03','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-05 17:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
('m-r32-04','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-05 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-r32-05','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-06 17:00:00+00','scheduled',3,'Estadio Azteca','Ciudad de México'),
('m-r32-06','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-06 21:00:00+00','scheduled',3,'NRG Stadium','Houston'),
('m-r32-07','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-07 17:00:00+00','scheduled',4,'Levi Stadium','San Francisco'),
('m-r32-08','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-07 21:00:00+00','scheduled',4,'BC Place','Vancouver'),
('m-r32-09','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-08 17:00:00+00','scheduled',5,'Arrowhead Stadium','Kansas City'),
('m-r32-10','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-08 21:00:00+00','scheduled',5,'Lumen Field','Seattle'),
('m-r32-11','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-09 17:00:00+00','scheduled',6,'BMO Field','Toronto'),
('m-r32-12','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-09 21:00:00+00','scheduled',6,'MetLife Stadium','New York'),
('m-r32-13','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-10 17:00:00+00','scheduled',7,'Rose Bowl','Los Ángeles'),
('m-r32-14','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-10 21:00:00+00','scheduled',7,'AT&T Stadium','Dallas'),
('m-r32-15','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-11 17:00:00+00','scheduled',8,'SoFi Stadium','Los Ángeles'),
('m-r32-16','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32',NULL,NULL,NULL,'2026-07-11 21:00:00+00','scheduled',8,'Estadio Azteca','Ciudad de México'),
-- Round of 16
('m-r16-01','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-14 17:00:00+00','scheduled',1,'MetLife Stadium','New York'),
('m-r16-02','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-14 21:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
('m-r16-03','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-15 17:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
('m-r16-04','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-15 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
('m-r16-05','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-16 17:00:00+00','scheduled',3,'Estadio Azteca','Ciudad de México'),
('m-r16-06','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-16 21:00:00+00','scheduled',3,'NRG Stadium','Houston'),
('m-r16-07','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-17 17:00:00+00','scheduled',4,'Levi Stadium','San Francisco'),
('m-r16-08','a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16',NULL,NULL,NULL,'2026-07-17 21:00:00+00','scheduled',4,'BC Place','Vancouver'),
-- Quarter-finals
('m-qf-01','a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final',NULL,NULL,NULL,'2026-07-17 17:00:00+00','scheduled',1,'MetLife Stadium','New York'),
('m-qf-02','a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final',NULL,NULL,NULL,'2026-07-17 21:00:00+00','scheduled',1,'Rose Bowl','Los Ángeles'),
('m-qf-03','a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final',NULL,NULL,NULL,'2026-07-18 17:00:00+00','scheduled',2,'AT&T Stadium','Dallas'),
('m-qf-04','a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final',NULL,NULL,NULL,'2026-07-18 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
-- Semi-finals
('m-sf-01','a1b2c3d4-e5f6-7890-abcd-ef1234567890','semi_final',NULL,NULL,NULL,'2026-07-21 21:00:00+00','scheduled',1,'MetLife Stadium','New York'),
('m-sf-02','a1b2c3d4-e5f6-7890-abcd-ef1234567890','semi_final',NULL,NULL,NULL,'2026-07-22 21:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
-- Third place
('m-3rd','a1b2c3d4-e5f6-7890-abcd-ef1234567890','third_place',NULL,NULL,NULL,'2026-07-25 17:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
-- Final
('m-final','a1b2c3d4-e5f6-7890-abcd-ef1234567890','final',NULL,NULL,NULL,'2026-07-19 21:00:00+00','scheduled',1,'MetLife Stadium','New York')
ON CONFLICT (id) DO NOTHING;

-- Done! Run this and the app will have full WC 2026 data.
-- To verify: SELECT count(*) FROM matches WHERE tournament_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- Expected: 104 matches
