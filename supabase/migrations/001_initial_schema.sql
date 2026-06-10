-- ============================================================
-- POLLA FAMILIAR TORIBIOS — FIFA World Cup 2026
-- Schema actualizado para formato de 48 equipos
-- Puntuación: Grupos=1, R32=2, R16=4, QF=6, SF=8, Final=10, Campeón=15
-- ============================================================

-- Drop existing tables (fresh start)
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS group_standings CASCADE;
DROP TABLE IF EXISTS bracket_predictions CASCADE;

-- =============================================
-- TABLES
-- =============================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES users(id)
);

ALTER TABLE users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- =============================================
-- GROUP STANDING PREDICTIONS
-- El usuario predice las posiciones de cada grupo
-- (1°, 2°, 3°, 4° para cada uno de los 12 grupos)
-- =============================================
CREATE TABLE IF NOT EXISTS group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_letter TEXT NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  position_1 TEXT NOT NULL,  -- nombre del equipo 1°
  position_2 TEXT NOT NULL,  -- nombre del equipo 2°
  position_3 TEXT NOT NULL,  -- nombre del equipo 3°
  position_4 TEXT NOT NULL,  -- nombre del equipo 4°
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_letter)
);

-- =============================================
-- MATCHES (solo para referencia y calendario)
-- =============================================
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('group', 'r32', 'r16', 'qf', 'sf', '3rd', 'final')),
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  group_letter TEXT,         -- para partidos de grupo: A, B, C...
  phase TEXT NOT NULL,       -- 'Grupos', 'Dieciseisavos', etc.
  scheduled_at TIMESTAMPTZ,
  time_cot TEXT,             -- '14:00', etc.
  venue TEXT,
  matchday INTEGER,          -- 1, 2, 3 para grupos
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  result_home INTEGER,
  result_away INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BRACKET PREDICTIONS
-- El usuario predice quién avanza en cada partido de eliminatorias
-- =============================================
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL,  -- nombre del equipo que predice ganará
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- =============================================
-- SCORES — se calculan automáticamente
-- =============================================
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('group_standing', 'bracket')),
  phase TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER STATS
-- =============================================
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  total_predictions INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  best_streak INTEGER NOT NULL DEFAULT 0,
  champion_prediction TEXT,
  top_scorer_prediction TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- POINT RULES (configurable por grupo)
-- =============================================
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  group_standing_correct INTEGER NOT NULL DEFAULT 1,  -- pts por acierto en posición de grupo
  r32_correct INTEGER NOT NULL DEFAULT 2,
  r16_correct INTEGER NOT NULL DEFAULT 4,
  qf_correct INTEGER NOT NULL DEFAULT 6,
  sf_correct INTEGER NOT NULL DEFAULT 8,
  final_correct INTEGER NOT NULL DEFAULT 10,
  champion_correct INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default point rules
INSERT INTO point_rules (group_id, group_standing_correct, r32_correct, r16_correct, qf_correct, sf_correct, final_correct, champion_correct)
SELECT id, 1, 2, 4, 6, 8, 10, 15 FROM groups;

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_match_id ON scores(match_id);
CREATE INDEX IF NOT EXISTS idx_group_standings_user ON group_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_bracket_pred_user ON bracket_predictions(user_id);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Calculate group standing scores for a user
CREATE OR REPLACE FUNCTION calculate_group_standing_scores(
  p_user_id UUID,
  p_group_id UUID
) RETURNS VOID AS $$
DECLARE
  v_rec RECORD;
  v_group_letter TEXT;
  v_correct_pos TEXT;
  v_predicted_pos TEXT;
  v_pts INTEGER;
  v_rule RECORD;
BEGIN
  -- Get point rules
  SELECT * INTO v_rule FROM point_rules WHERE group_id = p_group_id LIMIT 1;
  v_pts := COALESCE(v_rule.group_standing_correct, 1);

  -- For each group prediction
  FOR v_rec IN
    SELECT gs.*, g.group_letter
    FROM group_standings gs
    JOIN (
      SELECT DISTINCT ON (group_letter) group_letter
      FROM group_standings gs2
      WHERE gs2.user_id = p_user_id
      ORDER BY gs2.group_letter
    ) g ON TRUE
    WHERE gs.user_id = p_user_id
  LOOP
    -- This function is called per user, we need to evaluate each group
    NULL; -- handled by update_group_standing_scores
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Calculate scores for group standings predictions
CREATE OR REPLACE FUNCTION update_group_standing_scores(
  p_user_id UUID,
  p_group_id UUID
) RETURNS VOID AS $$
DECLARE
  v_rule RECORD;
  v_pts INTEGER;
  v_rec RECORD;
  v_group_letter TEXT;
  v_correct BOOLEAN;
BEGIN
  -- Get point rules
  SELECT * INTO v_rule FROM point_rules WHERE group_id = p_group_id LIMIT 1;
  v_pts := COALESCE(v_rule.group_standing_correct, 1);

  -- Delete old group standing scores for this user
  DELETE FROM scores
  WHERE user_id = p_user_id
  AND prediction_type = 'group_standing';

  -- Score each group prediction
  -- We need actual results stored somewhere — for now, admin marks groups as completed
  -- with the real standings
  NULL; -- Will be called after admin inputs real results
END;
$$ LANGUAGE plpgsql;

-- Calculate bracket prediction scores
CREATE OR REPLACE FUNCTION update_bracket_scores(
  p_user_id UUID,
  p_group_id UUID
) RETURNS VOID AS $$
DECLARE
  v_rule RECORD;
  v_pts INTEGER;
  v_match RECORD;
  v_pred RECORD;
  v_correct BOOLEAN;
BEGIN
  SELECT * INTO v_rule FROM point_rules WHERE group_id = p_group_id LIMIT 1;

  -- For each bracket match
  FOR v_match IN
    SELECT m.* FROM matches m
    WHERE m.group_id = p_group_id
    AND m.match_type IN ('r32', 'r16', 'qf', 'sf', '3rd', 'final')
    AND m.status = 'completed'
  LOOP
    -- Get user's prediction for this match
    SELECT * INTO v_pred FROM bracket_predictions
    WHERE user_id = p_user_id AND match_id = v_match.id;

    IF v_pred IS NOT NULL AND v_match.result_home IS NOT NULL AND v_match.result_away IS NOT NULL THEN
      -- Determine actual winner
      v_correct := FALSE;
      IF v_match.result_home > v_match.result_away AND v_pred.predicted_winner = v_match.team_home THEN
        v_correct := TRUE;
      ELSIF v_match.result_away > v_match.result_home AND v_pred.predicted_winner = v_match.team_away THEN
        v_correct := TRUE;
      END IF;

      -- Determine points based on phase
      CASE v_match.match_type
        WHEN 'r32' THEN v_pts := COALESCE(v_rule.r32_correct, 2);
        WHEN 'r16' THEN v_pts := COALESCE(v_rule.r16_correct, 4);
        WHEN 'qf' THEN v_pts := COALESCE(v_rule.qf_correct, 6);
        WHEN 'sf' THEN v_pts := COALESCE(v_rule.sf_correct, 8);
        WHEN '3rd' THEN v_pts := COALESCE(v_rule.sf_correct, 8);
        WHEN 'final' THEN v_pts := COALESCE(v_rule.final_correct, 10);
      END CASE;

      -- Insert score
      INSERT INTO scores (user_id, match_id, prediction_type, phase, points, correct)
      VALUES (p_user_id, v_match.id, 'bracket', v_match.phase, v_pts, v_correct)
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_accuracy DECIMAL;
BEGIN
  SELECT COALESCE(COUNT(*), 0), COALESCE(SUM(CASE WHEN correct THEN 1 ELSE 0 END), 0)
  INTO v_total, v_correct
  FROM scores
  WHERE user_id = p_user_id;

  v_accuracy := CASE WHEN v_total > 0 THEN (v_correct::DECIMAL / v_total::DECIMAL * 100) ELSE 0 END;

  UPDATE user_stats
  SET
    total_predictions = v_total,
    total_correct = v_correct,
    accuracy = v_accuracy,
    last_updated = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_predictions, total_correct, accuracy)
    VALUES (p_user_id, v_total, v_correct, v_accuracy);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Get leaderboard
CREATE OR REPLACE FUNCTION get_leaderboard(p_group_id UUID)
RETURNS TABLE (
  name TEXT,
  avatar TEXT,
  total_points INTEGER,
  correct_predictions INTEGER,
  total_predictions INTEGER,
  rank INTEGER
) AS $$
WITH ranked AS (
  SELECT
    u.name,
    u.avatar,
    COALESCE(SUM(s.points), 0) as total_points,
    COALESCE(SUM(CASE WHEN s.correct THEN 1 ELSE 0 END), 0) as correct_predictions,
    COUNT(s.points) as total_predictions,
    ROW_NUMBER() OVER (
      ORDER BY COALESCE(SUM(s.points), 0) DESC,
               COALESCE(SUM(CASE WHEN s.correct THEN 1 ELSE 0 END), 0) DESC
    ) as rank
  FROM users u
  LEFT JOIN scores s ON u.id = s.user_id
  WHERE u.group_id = p_group_id
  GROUP BY u.id, u.name, u.avatar
)
SELECT * FROM ranked ORDER BY rank;
$$ LANGUAGE sql;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

-- Allow all operations (simple app, no real auth)
CREATE POLICY "Enable all for all users" ON groups FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON matches FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON group_standings FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON bracket_predictions FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON scores FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON user_stats FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON point_rules FOR ALL USING (true);
