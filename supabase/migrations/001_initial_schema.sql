-- ============================================================
-- POLLA FAMILIAR TORIBIOS — FIFA World Cup 2026
-- Migración limpia: drop todas las tablas viejas, crear nuevas
-- Ejecuta ESTE archivo en el SQL Editor de Supabase
-- ============================================================

-- 1. Drop all existing objects in order (dependencies first)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_leaderboard(UUID);
DROP FUNCTION IF EXISTS update_user_stats(UUID);
DROP FUNCTION IF EXISTS update_bracket_scores(UUID, UUID);
DROP FUNCTION IF EXISTS update_group_standing_scores(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_group_standing_scores(UUID, UUID);
DROP FUNCTION IF EXISTS calculate_match_score(UUID, UUID);

DROP POLICY IF EXISTS "Enable all for all users" ON groups;
DROP POLICY IF EXISTS "Enable all for all users" ON users;
DROP POLICY IF EXISTS "Enable all for all users" ON matches;
DROP POLICY IF EXISTS "Enable all for all users" ON group_standings;
DROP POLICY IF EXISTS "Enable all for all users" ON bracket_predictions;
DROP POLICY IF EXISTS "Enable all for all users" ON scores;
DROP POLICY IF EXISTS "Enable all for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable all for all users" ON point_rules;

DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;
DROP TABLE IF EXISTS group_standings CASCADE;
DROP TABLE IF EXISTS bracket_predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- 2. Create tables
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES users(id);

-- Group standings predictions (user picks 1°-4° for each group)
CREATE TABLE IF NOT EXISTS group_standings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  group_letter TEXT NOT NULL CHECK (group_letter IN ('A','B','C','D','E','F','G','H','I','J','K','L')),
  position_1 TEXT NOT NULL DEFAULT '',
  position_2 TEXT NOT NULL DEFAULT '',
  position_3 TEXT NOT NULL DEFAULT '',
  position_4 TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_letter)
);

-- Matches (group + knockout)
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  match_type TEXT NOT NULL CHECK (match_type IN ('group','r32','r16','qf','sf','3rd','final')),
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  group_letter TEXT,
  phase TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ,
  time_cot TEXT,
  venue TEXT,
  matchday INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  result_home INTEGER,
  result_away INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bracket predictions (user picks winner per knockout match)
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Scores (calculated per phase)
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('group_standing','bracket')),
  phase TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User stats
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

-- Point rules
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  group_standing_correct INTEGER NOT NULL DEFAULT 1,
  r32_correct INTEGER NOT NULL DEFAULT 2,
  r16_correct INTEGER NOT NULL DEFAULT 4,
  qf_correct INTEGER NOT NULL DEFAULT 6,
  sf_correct INTEGER NOT NULL DEFAULT 8,
  final_correct INTEGER NOT NULL DEFAULT 10,
  champion_correct INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_type ON matches(match_type);
CREATE INDEX IF NOT EXISTS idx_group_standings_user ON group_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_bracket_pred_user ON bracket_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_match_id ON scores(match_id);

-- 4. Functions
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
  SET total_predictions = v_total, total_correct = v_correct, accuracy = v_accuracy, last_updated = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_predictions, total_correct, accuracy)
    VALUES (p_user_id, v_total, v_correct, v_accuracy);
  END IF;
END;
$$ LANGUAGE plpgsql;

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
    u.name, u.avatar,
    COALESCE(SUM(s.points), 0) as total_points,
    COALESCE(SUM(CASE WHEN s.correct THEN 1 ELSE 0 END), 0) as correct_predictions,
    COUNT(s.points) as total_predictions,
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC, COALESCE(SUM(CASE WHEN s.correct THEN 1 ELSE 0 END), 0) DESC) as rank
  FROM users u
  LEFT JOIN scores s ON u.id = s.user_id
  WHERE u.group_id = p_group_id
  GROUP BY u.id, u.name, u.avatar
)
SELECT * FROM ranked ORDER BY rank;
$$ LANGUAGE sql;

-- 5. Row Level Security
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for all users" ON groups FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON matches FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON group_standings FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON bracket_predictions FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON scores FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON user_stats FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON point_rules FOR ALL USING (true);
