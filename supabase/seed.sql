-- ══════════════════════════════════════════════════════════════════
-- QUINIELA PRO — WC 2026 SEED  (matches only — teams already exist)
-- Corre esto en Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. GROUPS (upsert por letra) ─────────────────────────────────
INSERT INTO groups (id, name, letter, tournament_id)
VALUES
  (gen_random_uuid(),'Grupo A','A','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo B','B','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo C','C','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo D','D','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo E','E','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo F','F','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo G','G','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo H','H','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo I','I','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo J','J','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo K','K','a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  (gen_random_uuid(),'Grupo L','L','a1b2c3d4-e5f6-7890-abcd-ef1234567890')
ON CONFLICT DO NOTHING;

-- ── 2. GROUP STAGE MATCHES  ──────────────────────────────────────
-- Uses CTE to look up the REAL UUIDs from existing teams/groups tables
WITH
  t  AS (SELECT id, fifa_code FROM teams),
  g  AS (SELECT id, letter   FROM groups WHERE tournament_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
  s (grp, home, away, dt, rnd, venue, city) AS (VALUES
    -- GROUP A
    ('A','USA','POL','2026-06-11 20:00:00+00',1,'SoFi Stadium','Los Ángeles'),
    ('A','MAR','JPN','2026-06-12 17:00:00+00',1,'Rose Bowl','Los Ángeles'),
    ('A','POL','JPN','2026-06-17 17:00:00+00',2,'MetLife Stadium','Nueva York'),
    ('A','USA','MAR','2026-06-17 20:00:00+00',2,'AT&T Stadium','Dallas'),
    ('A','JPN','USA','2026-06-26 20:00:00+00',3,'Levi Stadium','San Francisco'),
    ('A','POL','MAR','2026-06-26 20:00:00+00',3,'Estadio Azteca','Ciudad de México'),
    -- GROUP B
    ('B','MEX','HUN','2026-06-11 17:00:00+00',1,'Estadio Azteca','Ciudad de México'),
    ('B','SEN','KOR','2026-06-12 20:00:00+00',1,'AT&T Stadium','Dallas'),
    ('B','HUN','KOR','2026-06-18 17:00:00+00',2,'SoFi Stadium','Los Ángeles'),
    ('B','MEX','SEN','2026-06-18 20:00:00+00',2,'Estadio Akron','Guadalajara'),
    ('B','KOR','MEX','2026-06-27 20:00:00+00',3,'Lumen Field','Seattle'),
    ('B','HUN','SEN','2026-06-27 20:00:00+00',3,'BC Place','Vancouver'),
    -- GROUP C
    ('C','CAN','SVK','2026-06-12 14:00:00+00',1,'BC Place','Vancouver'),
    ('C','EGY','IRN','2026-06-13 17:00:00+00',1,'MetLife Stadium','Nueva York'),
    ('C','SVK','IRN','2026-06-19 14:00:00+00',2,'Rose Bowl','Los Ángeles'),
    ('C','CAN','EGY','2026-06-19 17:00:00+00',2,'BMO Field','Toronto'),
    ('C','IRN','CAN','2026-06-28 20:00:00+00',3,'AT&T Stadium','Dallas'),
    ('C','SVK','EGY','2026-06-28 20:00:00+00',3,'SoFi Stadium','Los Ángeles'),
    -- GROUP D
    ('D','ARG','SCO','2026-06-12 23:00:00+00',1,'MetLife Stadium','Nueva York'),
    ('D','NGA','KSA','2026-06-13 20:00:00+00',1,'AT&T Stadium','Dallas'),
    ('D','SCO','KSA','2026-06-18 14:00:00+00',2,'Levi Stadium','San Francisco'),
    ('D','ARG','NGA','2026-06-18 23:00:00+00',2,'Rose Bowl','Los Ángeles'),
    ('D','KSA','ARG','2026-06-27 17:00:00+00',3,'SoFi Stadium','Los Ángeles'),
    ('D','SCO','NGA','2026-06-27 17:00:00+00',3,'MetLife Stadium','Nueva York'),
    -- GROUP E
    ('E','BRA','TUR','2026-06-13 14:00:00+00',1,'SoFi Stadium','Los Ángeles'),
    ('E','CIV','AUS','2026-06-13 23:00:00+00',1,'AT&T Stadium','Dallas'),
    ('E','TUR','AUS','2026-06-19 20:00:00+00',2,'MetLife Stadium','Nueva York'),
    ('E','BRA','CIV','2026-06-20 17:00:00+00',2,'Rose Bowl','Los Ángeles'),
    ('E','AUS','BRA','2026-06-28 17:00:00+00',3,'Lumen Field','Seattle'),
    ('E','TUR','CIV','2026-06-28 17:00:00+00',3,'BC Place','Vancouver'),
    -- GROUP F
    ('F','COL','SRB','2026-06-14 17:00:00+00',1,'Arrowhead Stadium','Kansas City'),
    ('F','CMR','JOR','2026-06-14 20:00:00+00',1,'NRG Stadium','Houston'),
    ('F','SRB','JOR','2026-06-20 14:00:00+00',2,'MetLife Stadium','Nueva York'),
    ('F','COL','CMR','2026-06-20 23:00:00+00',2,'SoFi Stadium','Los Ángeles'),
    ('F','JOR','COL','2026-06-29 17:00:00+00',3,'AT&T Stadium','Dallas'),
    ('F','SRB','CMR','2026-06-29 17:00:00+00',3,'Rose Bowl','Los Ángeles'),
    -- GROUP G
    ('G','ECU','CRO','2026-06-14 14:00:00+00',1,'Levi Stadium','San Francisco'),
    ('G','GHA','IRQ','2026-06-15 17:00:00+00',1,'NRG Stadium','Houston'),
    ('G','CRO','IRQ','2026-06-21 14:00:00+00',2,'BC Place','Vancouver'),
    ('G','ECU','GHA','2026-06-21 20:00:00+00',2,'AT&T Stadium','Dallas'),
    ('G','IRQ','ECU','2026-06-29 20:00:00+00',3,'MetLife Stadium','Nueva York'),
    ('G','CRO','GHA','2026-06-29 20:00:00+00',3,'Levi Stadium','San Francisco'),
    -- GROUP H
    ('H','POR','TUN','2026-06-15 14:00:00+00',1,'Rose Bowl','Los Ángeles'),
    ('H','URU','UZB','2026-06-15 20:00:00+00',1,'Arrowhead Stadium','Kansas City'),
    ('H','TUN','UZB','2026-06-21 17:00:00+00',2,'AT&T Stadium','Dallas'),
    ('H','POR','URU','2026-06-21 23:00:00+00',2,'SoFi Stadium','Los Ángeles'),
    ('H','UZB','POR','2026-06-30 20:00:00+00',3,'Lumen Field','Seattle'),
    ('H','TUN','URU','2026-06-30 20:00:00+00',3,'NRG Stadium','Houston'),
    -- GROUP I
    ('I','NED','RSA','2026-06-15 23:00:00+00',1,'MetLife Stadium','Nueva York'),
    ('I','VEN','NZL','2026-06-16 17:00:00+00',1,'Estadio Azteca','Ciudad de México'),
    ('I','RSA','NZL','2026-06-22 14:00:00+00',2,'Rose Bowl','Los Ángeles'),
    ('I','NED','VEN','2026-06-22 20:00:00+00',2,'AT&T Stadium','Dallas'),
    ('I','NZL','NED','2026-06-30 17:00:00+00',3,'BC Place','Vancouver'),
    ('I','RSA','VEN','2026-06-30 17:00:00+00',3,'BMO Field','Toronto'),
    -- GROUP J
    ('J','ESP','BOL','2026-06-16 14:00:00+00',1,'SoFi Stadium','Los Ángeles'),
    ('J','FRA','PAN','2026-06-16 20:00:00+00',1,'Levi Stadium','San Francisco'),
    ('J','BOL','PAN','2026-06-22 17:00:00+00',2,'NRG Stadium','Houston'),
    ('J','ESP','FRA','2026-06-22 23:00:00+00',2,'MetLife Stadium','Nueva York'),
    ('J','PAN','ESP','2026-07-01 20:00:00+00',3,'Estadio Akron','Guadalajara'),
    ('J','BOL','FRA','2026-07-01 20:00:00+00',3,'Rose Bowl','Los Ángeles'),
    -- GROUP K
    ('K','ENG','CRC','2026-06-16 23:00:00+00',1,'AT&T Stadium','Dallas'),
    ('K','GER','HON','2026-06-17 14:00:00+00',1,'Arrowhead Stadium','Kansas City'),
    ('K','CRC','HON','2026-06-23 14:00:00+00',2,'Estadio Azteca','Ciudad de México'),
    ('K','ENG','GER','2026-06-23 23:00:00+00',2,'MetLife Stadium','Nueva York'),
    ('K','HON','ENG','2026-07-01 17:00:00+00',3,'NRG Stadium','Houston'),
    ('K','CRC','GER','2026-07-01 17:00:00+00',3,'SoFi Stadium','Los Ángeles'),
    -- GROUP L
    ('L','BEL','JAM','2026-06-17 23:00:00+00',1,'Rose Bowl','Los Ángeles'),
    ('L','DEN','AUT','2026-06-17 20:00:00+00',1,'Lumen Field','Seattle'),
    ('L','JAM','AUT','2026-06-23 17:00:00+00',2,'AT&T Stadium','Dallas'),
    ('L','BEL','DEN','2026-06-23 20:00:00+00',2,'SoFi Stadium','Los Ángeles'),
    ('L','AUT','BEL','2026-07-02 20:00:00+00',3,'Estadio Azteca','Ciudad de México'),
    ('L','JAM','DEN','2026-07-02 20:00:00+00',3,'BC Place','Vancouver')
  )
INSERT INTO matches
  (id, tournament_id, phase, group_id, home_team_id, away_team_id,
   match_date, status, round_number, venue, city)
SELECT
  gen_random_uuid(),
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'group',
  g.id,
  ht.id,
  at.id,
  s.dt::timestamptz,
  'scheduled',
  s.rnd,
  s.venue,
  s.city
FROM s
JOIN t AS ht ON ht.fifa_code = s.home
JOIN t AS at ON at.fifa_code = s.away
JOIN g         ON g.letter   = s.grp
ON CONFLICT DO NOTHING;

-- ── 3. KNOCKOUT PLACEHOLDERS (equipos TBD) ───────────────────────
INSERT INTO matches (id, tournament_id, phase, match_date, status, round_number, venue, city) VALUES
-- Ronda de 32
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-04 17:00:00+00','scheduled',1,'MetLife Stadium','Nueva York'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-04 21:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-05 17:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-05 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-06 17:00:00+00','scheduled',3,'Estadio Azteca','Ciudad de México'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-06 21:00:00+00','scheduled',3,'NRG Stadium','Houston'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-07 17:00:00+00','scheduled',4,'Levi Stadium','San Francisco'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-07 21:00:00+00','scheduled',4,'BC Place','Vancouver'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-08 17:00:00+00','scheduled',5,'Arrowhead Stadium','Kansas City'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-08 21:00:00+00','scheduled',5,'Lumen Field','Seattle'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-09 17:00:00+00','scheduled',6,'BMO Field','Toronto'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-09 21:00:00+00','scheduled',6,'MetLife Stadium','Nueva York'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-10 17:00:00+00','scheduled',7,'Rose Bowl','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-10 21:00:00+00','scheduled',7,'AT&T Stadium','Dallas'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-11 17:00:00+00','scheduled',8,'SoFi Stadium','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_32','2026-07-11 21:00:00+00','scheduled',8,'Estadio Azteca','Ciudad de México'),
-- Octavos
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-14 17:00:00+00','scheduled',1,'MetLife Stadium','Nueva York'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-14 21:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-15 17:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-15 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-16 17:00:00+00','scheduled',3,'Estadio Azteca','Ciudad de México'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-16 21:00:00+00','scheduled',3,'NRG Stadium','Houston'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-17 17:00:00+00','scheduled',4,'Levi Stadium','San Francisco'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','round_of_16','2026-07-17 21:00:00+00','scheduled',4,'BC Place','Vancouver'),
-- Cuartos
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final','2026-07-17 17:00:00+00','scheduled',1,'MetLife Stadium','Nueva York'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final','2026-07-17 21:00:00+00','scheduled',1,'Rose Bowl','Los Ángeles'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final','2026-07-18 17:00:00+00','scheduled',2,'AT&T Stadium','Dallas'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','quarter_final','2026-07-18 21:00:00+00','scheduled',2,'SoFi Stadium','Los Ángeles'),
-- Semifinales
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','semi_final','2026-07-21 21:00:00+00','scheduled',1,'MetLife Stadium','Nueva York'),
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','semi_final','2026-07-22 21:00:00+00','scheduled',2,'Rose Bowl','Los Ángeles'),
-- Tercer lugar
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','third_place','2026-07-25 17:00:00+00','scheduled',1,'AT&T Stadium','Dallas'),
-- Final
(gen_random_uuid(),'a1b2c3d4-e5f6-7890-abcd-ef1234567890','final','2026-07-19 21:00:00+00','scheduled',1,'MetLife Stadium','Nueva York')
ON CONFLICT DO NOTHING;

-- ── Verificación ──────────────────────────────────────────────────
SELECT COUNT(*) AS total_matches FROM matches
WHERE tournament_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- Esperado: 104
