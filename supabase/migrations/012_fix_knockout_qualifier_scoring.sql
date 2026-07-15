-- ============================================================
-- Migration 012 — Fix knockout qualifier-scoring bug
-- ============================================================
-- Bug 1: for knockout matches decided in regulation (90 min), the scoring
-- function only compared the predicted winner derived from the raw
-- home/away score prediction. Users who predicted a draw (expecting the
-- match to go to extra time / penalties) but correctly picked the
-- eventual qualifier via `qualifier_team_id` were scored 0 instead of the
-- "correct winner" tier (3 pts), even though they picked the right team.
-- Fix: in the "decided in 90 minutes" branch, fall back to
-- qualifier_team_id when the raw scoreline comparison doesn't already
-- award points, before defaulting to 0.
--
-- Bug 2: when a match went to extra time / penalties, the "exact score"
-- (5 pt) check only compared the base 90-minute prediction fields
-- (home_score_prediction/away_score_prediction) against the match's
-- cumulative final score — never the phase-specific guess the user
-- actually entered (extra_time_home/away_prediction for the AET-cumulative
-- score, penalties_home/away_prediction for the shootout). A user who
-- correctly predicted 1-1 after 90' and 1-2 after extra time (matching
-- the real final score exactly) was scored 3 instead of 5 because their
-- *base* fields (1-1) didn't match the cumulative total (1-2), even
-- though their extra-time field did.
-- Fix: when resolving the "final" predicted score for the exact-match
-- check, prefer the deepest phase-specific field the user filled in
-- (penalties_prediction if the real match went to penalties,
-- extra_time_prediction if it went to AET) over the base 90' fields.
-- ============================================================

CREATE OR REPLACE FUNCTION calculate_prediction_points(prediction_id uuid)
RETURNS integer
LANGUAGE plpgsql AS $$
DECLARE
  p predictions%ROWTYPE;
  m matches%ROWTYPE;
  home_pred int;
  away_pred int;
  home_real int;
  away_real int;
  pred_winner text;    -- 'home' | 'away' | 'draw'
  real_winner text;
  is_knockout boolean;
BEGIN
  SELECT * INTO p FROM predictions WHERE id = prediction_id;
  SELECT * INTO m FROM matches WHERE id = p.match_id;

  IF m.status != 'finished' OR m.home_score IS NULL OR m.away_score IS NULL THEN
    RETURN NULL;
  END IF;

  home_pred := p.home_score_prediction;
  away_pred := p.away_score_prediction;
  home_real := m.home_score;
  away_real := m.away_score;

  is_knockout := m.phase != 'group';

  -- Determine predicted winner
  IF home_pred > away_pred THEN pred_winner := 'home';
  ELSIF away_pred > home_pred THEN pred_winner := 'away';
  ELSE pred_winner := 'draw';
  END IF;

  -- Determine real winner in 90min
  IF home_real > away_real THEN real_winner := 'home';
  ELSIF away_real > home_real THEN real_winner := 'away';
  ELSE real_winner := 'draw';
  END IF;

  -- ── GROUP STAGE SCORING ──────────────────────────────────
  IF NOT is_knockout THEN
    IF home_pred = home_real AND away_pred = away_real THEN
      IF real_winner != 'draw' THEN
        RETURN 5; -- exact win
      ELSE
        RETURN 4; -- exact draw
      END IF;
    ELSIF pred_winner = real_winner AND real_winner != 'draw' THEN
      RETURN 3; -- correct winner
    ELSIF pred_winner = 'draw' AND real_winner = 'draw' THEN
      RETURN 1; -- correct draw
    ELSE
      RETURN 0;
    END IF;
  END IF;

  -- ── PLAYOFF SCORING ──────────────────────────────────────

  -- Real result: decided in 90 min (winner in 90)
  IF real_winner != 'draw' THEN
    DECLARE
      real_winner_team_id uuid := CASE WHEN real_winner = 'home' THEN m.home_team_id ELSE m.away_team_id END;
    BEGIN
      IF home_pred = home_real AND away_pred = away_real THEN
        RETURN 5; -- Perfeccion Total: exact + correct winner
      ELSIF pred_winner = real_winner THEN
        RETURN 3; -- Victoria Base: correct winner via scoreline
      ELSIF p.qualifier_team_id IS NOT NULL AND p.qualifier_team_id = real_winner_team_id::text THEN
        RETURN 3; -- Victoria Base: correct winner via qualifier pick (FIX)
      ELSE
        RETURN 0;
      END IF;
    END;
  END IF;

  -- Real result: draw in 90 min (goes to AET or penalties)
  DECLARE
    real_qualifier text := NULL;
    pred_qualifier text := NULL;
    went_penalties boolean;
    pred_outcome text;
    exact_final boolean := false;
  BEGIN
    went_penalties := (m.home_score_penalties IS NOT NULL OR m.away_score_penalties IS NOT NULL);

    IF went_penalties THEN
      IF (m.home_score_penalties > m.away_score_penalties) THEN real_qualifier := 'home';
      ELSE real_qualifier := 'away'; END IF;
    ELSE
      IF m.api_football_status IN ('AET','ET') THEN
        real_qualifier := NULL;
      END IF;
    END IF;

    IF p.qualifier_team_id IS NOT NULL THEN
      IF p.qualifier_team_id = m.home_team_id::text THEN pred_qualifier := 'home';
      ELSIF p.qualifier_team_id = m.away_team_id::text THEN pred_qualifier := 'away';
      END IF;
    END IF;

    pred_outcome := COALESCE(p.outcome_prediction, '90min');

    -- "Exact" check: prefer the deepest phase-specific field the user filled
    -- in (FIX — previously only compared the base 90' fields to the
    -- cumulative total, missing exact extra-time/penalty predictions).
    IF went_penalties AND p.penalties_home_prediction IS NOT NULL AND p.penalties_away_prediction IS NOT NULL THEN
      exact_final := (p.penalties_home_prediction = m.home_score_penalties AND p.penalties_away_prediction = m.away_score_penalties);
    ELSIF p.extra_time_home_prediction IS NOT NULL AND p.extra_time_away_prediction IS NOT NULL THEN
      exact_final := (p.extra_time_home_prediction = home_real AND p.extra_time_away_prediction = away_real);
    ELSE
      exact_final := (home_pred = home_real AND away_pred = away_real);
    END IF;

    IF exact_final THEN
      IF pred_qualifier = real_qualifier OR real_qualifier IS NULL THEN
        RETURN 5;
      ELSE
        RETURN 4;
      END IF;
    END IF;

    IF went_penalties AND pred_outcome = 'penalties' AND pred_qualifier = real_qualifier THEN
      RETURN 4;
    END IF;

    IF pred_outcome = 'extra_time' AND m.api_football_status IN ('AET','ET') AND NOT went_penalties THEN
      RETURN 3;
    END IF;

    IF pred_qualifier = real_qualifier AND real_qualifier IS NOT NULL THEN
      RETURN 2;
    END IF;

    IF pred_winner = 'draw' THEN
      RETURN 1;
    END IF;

    RETURN 0;
  END;
END;
$$;
