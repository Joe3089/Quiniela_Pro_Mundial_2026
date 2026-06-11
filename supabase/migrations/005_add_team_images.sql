-- Migration 005: Add image URL columns to teams
alter table if exists public.teams
  add column if not exists escudo_url text,
  add column if not exists logo_url text;

-- Indexes are not required for these free-text URL columns
