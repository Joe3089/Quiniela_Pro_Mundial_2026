-- ============================================================
-- Migration 009 — Playoff prediction fields
-- ============================================================

-- Add knockout-specific columns to predictions
ALTER TABLE predictions
  ADD COLUMN IF NOT EXISTS outcome_prediction TEXT
    CHECK (outcome_prediction IN ('90min', 'extra_time', 'penalties')),
  ADD COLUMN IF NOT EXISTS qualifier_team_id TEXT;

-- ============================================================
-- Update scoring function to handle playoff cases
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
  points int := 0;
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
      -- Exact score
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
  -- Cases from PDF:

  -- Real result: decided in 90 min (winner in 90)
  IF real_winner != 'draw' THEN
    IF home_pred = home_real AND away_pred = away_real THEN
      RETURN 5; -- Perfección Total: exact + correct winner
    ELSIF pred_winner = real_winner THEN
      RETURN 3; -- Victoria Base: correct winner no exact score
    ELSE
      RETURN 0;
    END IF;
  END IF;

  -- Real result: draw in 90 min (goes to AET or penalties)
  -- home_score_penalties / away_score_penalties determine real qualifier
  DECLARE
    real_qualifier text := NULL;
    pred_qualifier text := NULL;
    went_penalties boolean;
    pred_outcome text;
  BEGIN
    went_penalties := (m.home_score_penalties IS NOT NULL OR m.away_score_penalties IS NOT NULL);

    -- Real qualifier
    IF went_penalties THEN
      IF (m.home_score_penalties > m.away_score_penalties) THEN real_qualifier := 'home';
      ELSE real_qualifier := 'away'; END IF;
    ELSE
      -- AET: check if there was extra time (status AET)
      -- We use api_football_status to distinguish
      IF m.api_football_status IN ('AET','ET') THEN
        -- Winner in AET — we don't have AET score breakdown, skip qualifier logic
        real_qualifier := NULL;
      END IF;
    END IF;

    -- Predicted qualifier from qualifier_team_id
    IF p.qualifier_team_id IS NOT NULL THEN
      IF p.qualifier_team_id = m.home_team_id::text THEN pred_qualifier := 'home';
      ELSIF p.qualifier_team_id = m.away_team_id::text THEN pred_qualifier := 'away';
      END IF;
    END IF;

    pred_outcome := COALESCE(p.outcome_prediction, '90min');

    -- Both teams drew in 90min
    -- 5 pts: exact score + right qualifier
    IF home_pred = home_real AND away_pred = away_real THEN
      IF pred_qualifier = real_qualifier OR real_qualifier IS NULL THEN
        RETURN 5;
      ELSE
        RETURN 4; -- exact draw but wrong qualifier
      END IF;
    END IF;

    -- 4 pts: penalties route AND got qualifier right
    IF went_penalties AND pred_outcome = 'penalties' AND pred_qualifier = real_qualifier THEN
      RETURN 4;
    END IF;

    -- 3 pts: predicted AET (extra_time) and real was AET
    IF pred_outcome = 'extra_time' AND m.api_football_status IN ('AET','ET') AND NOT went_penalties THEN
      RETURN 3;
    END IF;

    -- 2 pts: draw + right qualifier but not exact score
    IF pred_qualifier = real_qualifier AND real_qualifier IS NOT NULL THEN
      RETURN 2;
    END IF;

    -- 1 pt: predicted draw (correct) but wrong qualifier and wrong exact
    IF pred_winner = 'draw' THEN
      RETURN 1;
    END IF;

    RETURN 0;
  END;
END;
$$;
