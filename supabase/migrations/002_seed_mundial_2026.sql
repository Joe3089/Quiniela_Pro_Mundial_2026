-- ============================================================
-- FIFA World Cup 2026 Seed Data
-- ============================================================

-- Insert tournament
insert into public.tournaments (id, name, slug, season, start_date, end_date, is_active, host_countries)
values (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'FIFA World Cup 2026',
  'mundial-2026',
  '2026',
  '2026-06-11',
  '2026-07-19',
  true,
  array['USA', 'Canada', 'Mexico']
);

-- Insert teams (all 48 qualified nations)
-- Group A
insert into public.groups (id, tournament_id, name, letter) values
  ('g-a0000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group A', 'A'),
  ('g-b0000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group B', 'B'),
  ('g-c0000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group C', 'C'),
  ('g-d0000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group D', 'D'),
  ('g-e0000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group E', 'E'),
  ('g-f0000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group F', 'F'),
  ('g-g0000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group G', 'G'),
  ('g-h0000000-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group H', 'H'),
  ('g-i0000000-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group I', 'I'),
  ('g-j0000000-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group J', 'J'),
  ('g-k0000000-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group K', 'K'),
  ('g-l0000000-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Group L', 'L');

-- Teams
insert into public.teams (id, tournament_id, name, short_name, fifa_code, continent, flag_url) values
  -- Group A
  ('t-usa00000-0000-0000-0000-000000000001','a1b2c3d4-e5f6-7890-abcd-ef1234567890','United States','USA','USA','CONCACAF','https://flagcdn.com/w40/us.png'),
  ('t-mex00000-0000-0000-0000-000000000002','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Mexico','MEX','MEX','CONCACAF','https://flagcdn.com/w40/mx.png'),
  ('t-can00000-0000-0000-0000-000000000003','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Canada','CAN','CAN','CONCACAF','https://flagcdn.com/w40/ca.png'),
  ('t-pan00000-0000-0000-0000-000000000004','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Panama','PAN','PAN','CONCACAF','https://flagcdn.com/w40/pa.png'),
  -- Group B
  ('t-arg00000-0000-0000-0000-000000000005','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Argentina','ARG','ARG','CONMEBOL','https://flagcdn.com/w40/ar.png'),
  ('t-bra00000-0000-0000-0000-000000000006','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Brazil','BRA','BRA','CONMEBOL','https://flagcdn.com/w40/br.png'),
  ('t-col00000-0000-0000-0000-000000000007','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Colombia','COL','COL','CONMEBOL','https://flagcdn.com/w40/co.png'),
  ('t-uru00000-0000-0000-0000-000000000008','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Uruguay','URU','URU','CONMEBOL','https://flagcdn.com/w40/uy.png'),
  -- Group C
  ('t-fra00000-0000-0000-0000-000000000009','a1b2c3d4-e5f6-7890-abcd-ef1234567890','France','FRA','FRA','UEFA','https://flagcdn.com/w40/fr.png'),
  ('t-eng00000-0000-0000-0000-000000000010','a1b2c3d4-e5f6-7890-abcd-ef1234567890','England','ENG','ENG','UEFA','https://flagcdn.com/w40/gb-eng.png'),
  ('t-ger00000-0000-0000-0000-000000000011','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Germany','GER','GER','UEFA','https://flagcdn.com/w40/de.png'),
  ('t-spa00000-0000-0000-0000-000000000012','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Spain','ESP','ESP','UEFA','https://flagcdn.com/w40/es.png'),
  -- Group D
  ('t-por00000-0000-0000-0000-000000000013','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Portugal','POR','POR','UEFA','https://flagcdn.com/w40/pt.png'),
  ('t-ned00000-0000-0000-0000-000000000014','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Netherlands','NED','NED','UEFA','https://flagcdn.com/w40/nl.png'),
  ('t-bel00000-0000-0000-0000-000000000015','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Belgium','BEL','BEL','UEFA','https://flagcdn.com/w40/be.png'),
  ('t-cro00000-0000-0000-0000-000000000016','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Croatia','CRO','CRO','UEFA','https://flagcdn.com/w40/hr.png'),
  -- Group E
  ('t-mor00000-0000-0000-0000-000000000017','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Morocco','MAR','MAR','CAF','https://flagcdn.com/w40/ma.png'),
  ('t-sen00000-0000-0000-0000-000000000018','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Senegal','SEN','SEN','CAF','https://flagcdn.com/w40/sn.png'),
  ('t-jpn00000-0000-0000-0000-000000000019','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Japan','JPN','JPN','AFC','https://flagcdn.com/w40/jp.png'),
  ('t-kor00000-0000-0000-0000-000000000020','a1b2c3d4-e5f6-7890-abcd-ef1234567890','South Korea','KOR','KOR','AFC','https://flagcdn.com/w40/kr.png'),
  -- Group F
  ('t-ita00000-0000-0000-0000-000000000021','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Italy','ITA','ITA','UEFA','https://flagcdn.com/w40/it.png'),
  ('t-sui00000-0000-0000-0000-000000000022','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Switzerland','SUI','SUI','UEFA','https://flagcdn.com/w40/ch.png'),
  ('t-den00000-0000-0000-0000-000000000023','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Denmark','DEN','DEN','UEFA','https://flagcdn.com/w40/dk.png'),
  ('t-mex00001-0000-0000-0000-000000000024','a1b2c3d4-e5f6-7890-abcd-ef1234567890','Ecuador','ECU','ECU','CONMEBOL','https://flagcdn.com/w40/ec.png');
