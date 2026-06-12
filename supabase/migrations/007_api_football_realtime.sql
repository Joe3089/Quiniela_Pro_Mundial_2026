-- Link local tournament data to API-Football and enable Supabase Realtime.

alter table public.teams
  add column if not exists api_football_team_id integer;

alter table public.matches
  add column if not exists api_football_fixture_id bigint,
  add column if not exists api_football_home_team_id integer,
  add column if not exists api_football_away_team_id integer,
  add column if not exists api_football_status text,
  add column if not exists elapsed integer,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists teams_tournament_api_football_team_id_unique
  on public.teams (tournament_id, api_football_team_id)
  where api_football_team_id is not null;

create unique index if not exists matches_api_football_fixture_id_unique
  on public.matches (api_football_fixture_id)
  where api_football_fixture_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'on_matches_updated'
  ) then
    create trigger on_matches_updated
      before update on public.matches
      for each row execute function public.handle_updated_at();
  end if;
end $$;

alter table public.matches replica identity full;
alter table public.standings replica identity full;
alter table public.rankings replica identity full;

do $$
begin
  alter publication supabase_realtime add table public.matches;
exception
  when duplicate_object or undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.standings;
exception
  when duplicate_object or undefined_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.rankings;
exception
  when duplicate_object or undefined_object then null;
end $$;
