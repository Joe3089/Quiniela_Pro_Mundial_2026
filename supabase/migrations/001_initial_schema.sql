-- ============================================================
-- Quiniela Pro Mundial 2026 - Initial Schema
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
create type match_phase as enum (
  'group', 'round_of_32', 'round_of_16',
  'quarter_final', 'semi_final', 'third_place', 'final'
);

create type match_status as enum (
  'scheduled', 'live', 'finished', 'postponed', 'cancelled'
);

create type prediction_status as enum (
  'pending', 'correct', 'incorrect', 'partial'
);

-- ============================================================
-- TABLES
-- ============================================================

-- Users (extends Supabase auth.users)
create table public.users (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text not null unique,
  username     text not null unique,
  display_name text,
  avatar_url   text,
  is_admin     boolean not null default false,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Tournaments
create table public.tournaments (
  id             uuid primary key default uuid_generate_v4(),
  name           text not null,
  slug           text not null unique,
  season         text not null,
  start_date     date not null,
  end_date       date not null,
  is_active      boolean not null default true,
  logo_url       text,
  host_countries text[] not null default '{}',
  created_at     timestamptz not null default now()
);

-- Teams
create table public.teams (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,
  short_name    text not null,
  flag_url      text,
  fifa_code     text not null,
  continent     text not null default 'Unknown'
);

-- Groups
create table public.groups (
  id            uuid primary key default uuid_generate_v4(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name          text not null,
  letter        char(1) not null,
  unique (tournament_id, letter)
);

-- Matches
create table public.matches (
  id                      uuid primary key default uuid_generate_v4(),
  tournament_id           uuid not null references public.tournaments(id) on delete cascade,
  phase                   match_phase not null default 'group',
  round_number            integer,
  group_id                uuid references public.groups(id),
  home_team_id            uuid references public.teams(id),
  away_team_id            uuid references public.teams(id),
  home_score              integer,
  away_score              integer,
  home_score_penalties    integer,
  away_score_penalties    integer,
  match_date              timestamptz not null,
  venue                   text,
  city                    text,
  status                  match_status not null default 'scheduled',
  created_at              timestamptz not null default now(),
  constraint different_teams check (home_team_id != away_team_id)
);

-- Predictions
create table public.predictions (
  id                       uuid primary key default uuid_generate_v4(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  match_id                 uuid not null references public.matches(id) on delete cascade,
  tournament_id            uuid not null references public.tournaments(id) on delete cascade,
  home_score_prediction    integer not null check (home_score_prediction >= 0),
  away_score_prediction    integer not null check (away_score_prediction >= 0),
  points_earned            integer,
  status                   prediction_status not null default 'pending',
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (user_id, match_id)
);

-- Rankings
create table public.rankings (
  id                  uuid primary key default uuid_generate_v4(),
  user_id             uuid not null references public.users(id) on delete cascade,
  tournament_id       uuid not null references public.tournaments(id) on delete cascade,
  total_points        integer not null default 0,
  exact_scores        integer not null default 0,
  correct_winners     integer not null default 0,
  exact_draws         integer not null default 0,
  partial_draws       integer not null default 0,
  wrong_predictions   integer not null default 0,
  predictions_count   integer not null default 0,
  rank_position       integer,
  updated_at          timestamptz not null default now(),
  unique (user_id, tournament_id)
);

-- Standings
create table public.standings (
  id              uuid primary key default uuid_generate_v4(),
  group_id        uuid not null references public.groups(id) on delete cascade,
  team_id         uuid not null references public.teams(id) on delete cascade,
  tournament_id   uuid not null references public.tournaments(id) on delete cascade,
  played          integer not null default 0,
  won             integer not null default 0,
  drawn           integer not null default 0,
  lost            integer not null default 0,
  goals_for       integer not null default 0,
  goals_against   integer not null default 0,
  goal_difference integer not null default 0,
  points          integer not null default 0,
  unique (group_id, team_id)
);

-- ============================================================
-- INDEXES
-- ============================================================
create index idx_users_username on public.users using gin(username gin_trgm_ops);
create index idx_matches_tournament on public.matches(tournament_id);
create index idx_matches_phase on public.matches(phase);
create index idx_matches_date on public.matches(match_date);
create index idx_matches_status on public.matches(status);
create index idx_predictions_user on public.predictions(user_id);
create index idx_predictions_match on public.predictions(match_id);
create index idx_predictions_tournament on public.predictions(tournament_id);
create index idx_rankings_tournament on public.rankings(tournament_id, total_points desc);
create index idx_rankings_user on public.rankings(user_id);
create index idx_standings_group on public.standings(group_id, points desc);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Auto-create user profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_username text;
  final_username text;
  counter int := 0;
begin
  base_username := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'
  ));
  if length(base_username) < 3 then
    base_username := 'user' || substr(new.id::text, 1, 6);
  end if;

  final_username := base_username;
  loop
    exit when not exists (select 1 from public.users where username = final_username);
    counter := counter + 1;
    final_username := base_username || counter::text;
  end loop;

  insert into public.users (id, email, username, display_name, avatar_url)
  values (
    new.id,
    new.email,
    final_username,
    coalesce(new.raw_user_meta_data->>'display_name', final_username),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Calculate prediction points
create or replace function public.calculate_prediction_points(p_prediction_id uuid)
returns integer language plpgsql security definer as $$
declare
  v_pred public.predictions%rowtype;
  v_match public.matches%rowtype;
  v_points integer := 0;
  v_pred_winner text;
  v_actual_winner text;
begin
  select * into v_pred from public.predictions where id = p_prediction_id;
  select * into v_match from public.matches where id = v_pred.match_id;

  if v_match.status != 'finished' or v_match.home_score is null then
    return null;
  end if;

  -- Exact score
  if v_pred.home_score_prediction = v_match.home_score
     and v_pred.away_score_prediction = v_match.away_score then
    v_points := 5;
  else
    -- Determine winners
    if v_pred.home_score_prediction > v_pred.away_score_prediction then
      v_pred_winner := 'home';
    elsif v_pred.home_score_prediction < v_pred.away_score_prediction then
      v_pred_winner := 'away';
    else
      v_pred_winner := 'draw';
    end if;

    if v_match.home_score > v_match.away_score then
      v_actual_winner := 'home';
    elsif v_match.home_score < v_match.away_score then
      v_actual_winner := 'away';
    else
      v_actual_winner := 'draw';
    end if;

    if v_pred_winner = v_actual_winner then
      if v_actual_winner = 'draw' then
        v_points := 2; -- Exact draw outcome (but not exact score)
      else
        v_points := 3; -- Correct winner
      end if;
    elsif v_pred_winner = 'draw' or v_actual_winner = 'draw' then
      v_points := 1; -- Partial draw
    end if;
  end if;

  -- Update prediction
  update public.predictions
  set points_earned = v_points,
      status = case
        when v_points = 5 then 'correct'::prediction_status
        when v_points >= 1 then 'partial'::prediction_status
        else 'incorrect'::prediction_status
      end,
      updated_at = now()
  where id = p_prediction_id;

  return v_points;
end;
$$;

-- Update user ranking
create or replace function public.update_user_ranking(p_user_id uuid, p_tournament_id uuid)
returns void language plpgsql security definer as $$
declare
  v_stats record;
begin
  select
    count(*) filter (where status != 'pending') as predictions_count,
    coalesce(sum(points_earned), 0) as total_points,
    count(*) filter (where points_earned = 5) as exact_scores,
    count(*) filter (where points_earned = 3) as correct_winners,
    count(*) filter (where points_earned = 2) as exact_draws,
    count(*) filter (where points_earned = 1) as partial_draws,
    count(*) filter (where points_earned = 0 and status = 'incorrect') as wrong_predictions
  into v_stats
  from public.predictions
  where user_id = p_user_id and tournament_id = p_tournament_id;

  insert into public.rankings (user_id, tournament_id, total_points, exact_scores,
    correct_winners, exact_draws, partial_draws, wrong_predictions, predictions_count)
  values (p_user_id, p_tournament_id, v_stats.total_points, v_stats.exact_scores,
    v_stats.correct_winners, v_stats.exact_draws, v_stats.partial_draws,
    v_stats.wrong_predictions, v_stats.predictions_count)
  on conflict (user_id, tournament_id) do update
  set total_points = excluded.total_points,
      exact_scores = excluded.exact_scores,
      correct_winners = excluded.correct_winners,
      exact_draws = excluded.exact_draws,
      partial_draws = excluded.partial_draws,
      wrong_predictions = excluded.wrong_predictions,
      predictions_count = excluded.predictions_count,
      updated_at = now();

  -- Recalculate rank positions
  with ranked as (
    select id, row_number() over (
      order by total_points desc, exact_scores desc, correct_winners desc
    ) as new_rank
    from public.rankings where tournament_id = p_tournament_id
  )
  update public.rankings r
  set rank_position = ranked.new_rank
  from ranked where r.id = ranked.id;
end;
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================
create trigger on_users_updated
  before update on public.users
  for each row execute function public.handle_updated_at();

create trigger on_predictions_updated
  before update on public.predictions
  for each row execute function public.handle_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- After match finishes, calculate all predictions
create or replace function public.on_match_finished()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'finished' and old.status != 'finished' then
    perform public.calculate_prediction_points(p.id)
    from public.predictions p
    where p.match_id = new.id;

    -- Update rankings for all users who predicted this match
    perform public.update_user_ranking(p.user_id, p.tournament_id)
    from public.predictions p
    where p.match_id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_match_status_change
  after update of status, home_score, away_score on public.matches
  for each row execute function public.on_match_finished();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.users enable row level security;
alter table public.tournaments enable row level security;
alter table public.teams enable row level security;
alter table public.groups enable row level security;
alter table public.matches enable row level security;
alter table public.predictions enable row level security;
alter table public.rankings enable row level security;
alter table public.standings enable row level security;

-- Helper function
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select coalesce(
    (select is_admin from public.users where id = auth.uid()),
    false
  );
$$;

-- Users policies
create policy "Public profiles are viewable by everyone"
  on public.users for select using (true);
create policy "Users can update own profile"
  on public.users for update using (auth.uid() = id);

-- Tournaments policies
create policy "Tournaments viewable by all"
  on public.tournaments for select using (true);
create policy "Only admins can manage tournaments"
  on public.tournaments for all using (public.is_admin());

-- Teams, Groups, Matches, Standings - public read
create policy "Teams viewable by all" on public.teams for select using (true);
create policy "Only admins manage teams" on public.teams for all using (public.is_admin());
create policy "Groups viewable by all" on public.groups for select using (true);
create policy "Only admins manage groups" on public.groups for all using (public.is_admin());
create policy "Matches viewable by all" on public.matches for select using (true);
create policy "Only admins manage matches" on public.matches for all using (public.is_admin());
create policy "Standings viewable by all" on public.standings for select using (true);
create policy "Only admins manage standings" on public.standings for all using (public.is_admin());

-- Predictions policies
create policy "Users see own predictions before match starts"
  on public.predictions for select
  using (
    auth.uid() = user_id or
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.status in ('finished', 'live')
    )
  );
create policy "Users can insert own predictions"
  on public.predictions for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'scheduled'
        and m.match_date > now()
    )
  );
create policy "Users can update own pending predictions"
  on public.predictions for update
  using (
    auth.uid() = user_id and
    exists (
      select 1 from public.matches m
      where m.id = match_id and m.status = 'scheduled'
        and m.match_date > now()
    )
  );

-- Rankings policies
create policy "Rankings viewable by all"
  on public.rankings for select using (true);
