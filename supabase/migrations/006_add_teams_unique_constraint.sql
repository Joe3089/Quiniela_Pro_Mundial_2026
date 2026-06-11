-- Migration 006: Add unique constraint for teams (tournament_id, name)
-- This allows proper UPSERT behavior in import scripts

alter table public.teams
  add constraint teams_tournament_name_unique unique (tournament_id, name);
