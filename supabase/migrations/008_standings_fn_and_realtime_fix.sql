-- Function to compute and upsert standings from finished matches.
-- Called automatically by trigger when a match status changes to 'finished'.

create or replace function public.refresh_group_standings(p_tournament_id uuid)
returns void language plpgsql security definer as $$
declare
  v_match record;
begin
  delete from public.standings where tournament_id = p_tournament_id;

  for v_match in
    select
      m.group_id,
      m.home_team_id,
      m.away_team_id,
      m.home_score,
      m.away_score
    from public.matches m
    where m.tournament_id = p_tournament_id
      and m.phase = 'group'
      and m.status = 'finished'
      and m.home_score is not null
      and m.away_score is not null
      and m.group_id is not null
  loop
    insert into public.standings
      (group_id, team_id, tournament_id, played, won, drawn, lost,
       goals_for, goals_against, goal_difference, points)
    values (
      v_match.group_id, v_match.home_team_id, p_tournament_id, 1,
      case when v_match.home_score > v_match.away_score then 1 else 0 end,
      case when v_match.home_score = v_match.away_score then 1 else 0 end,
      case when v_match.home_score < v_match.away_score then 1 else 0 end,
      v_match.home_score, v_match.away_score,
      v_match.home_score - v_match.away_score,
      case when v_match.home_score > v_match.away_score then 3
           when v_match.home_score = v_match.away_score then 1 else 0 end
    )
    on conflict (group_id, team_id) do update set
      played = standings.played + 1,
      won = standings.won + excluded.won, drawn = standings.drawn + excluded.drawn,
      lost = standings.lost + excluded.lost,
      goals_for = standings.goals_for + excluded.goals_for,
      goals_against = standings.goals_against + excluded.goals_against,
      goal_difference = standings.goals_for + excluded.goals_for
                      - (standings.goals_against + excluded.goals_against),
      points = standings.points + excluded.points;

    insert into public.standings
      (group_id, team_id, tournament_id, played, won, drawn, lost,
       goals_for, goals_against, goal_difference, points)
    values (
      v_match.group_id, v_match.away_team_id, p_tournament_id, 1,
      case when v_match.away_score > v_match.home_score then 1 else 0 end,
      case when v_match.away_score = v_match.home_score then 1 else 0 end,
      case when v_match.away_score < v_match.home_score then 1 else 0 end,
      v_match.away_score, v_match.home_score,
      v_match.away_score - v_match.home_score,
      case when v_match.away_score > v_match.home_score then 3
           when v_match.away_score = v_match.home_score then 1 else 0 end
    )
    on conflict (group_id, team_id) do update set
      played = standings.played + 1,
      won = standings.won + excluded.won, drawn = standings.drawn + excluded.drawn,
      lost = standings.lost + excluded.lost,
      goals_for = standings.goals_for + excluded.goals_for,
      goals_against = standings.goals_against + excluded.goals_against,
      goal_difference = standings.goals_for + excluded.goals_for
                      - (standings.goals_against + excluded.goals_against),
      points = standings.points + excluded.points;
  end loop;
end;
$$;

alter table public.standings
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'standings_group_team_unique'
  ) then
    alter table public.standings
      add constraint standings_group_team_unique unique (group_id, team_id);
  end if;
end $$;

create or replace function public.on_match_finished()
returns trigger language plpgsql security definer as $$
begin
  if NEW.status = 'finished' and NEW.phase = 'group' and
     NEW.home_score is not null and NEW.away_score is not null then
    perform public.refresh_group_standings(NEW.tournament_id);
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_match_finished on public.matches;
create trigger trg_match_finished
  after insert or update on public.matches
  for each row execute function public.on_match_finished();
