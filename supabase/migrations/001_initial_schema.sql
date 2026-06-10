-- Create users table FIRST (groups references it)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  avatar TEXT,
  group_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  admin_id UUID REFERENCES users(id)
);

-- Add foreign key after both tables exist
ALTER TABLE users ADD CONSTRAINT fk_users_group FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;

-- Create matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  team_home TEXT NOT NULL,
  team_away TEXT NOT NULL,
  phase TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result_home INTEGER,
  result_away INTEGER,
  predictions_closed BOOLEAN DEFAULT FALSE
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction TEXT NOT NULL CHECK (prediction IN ('1', 'X', '2')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Create scores table
CREATE TABLE IF NOT EXISTS scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  correct BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create user_stats table
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

-- Create point_rules table
CREATE TABLE IF NOT EXISTS point_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  simple_correct INTEGER NOT NULL DEFAULT 3,
  exact_score INTEGER NOT NULL DEFAULT 5,
  champion_pick INTEGER NOT NULL DEFAULT 10,
  top_scorer_pick INTEGER NOT NULL DEFAULT 10
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_users_group_id ON users(group_id);
CREATE INDEX IF NOT EXISTS idx_matches_group_id ON matches(group_id);
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_user_id ON scores(user_id);
CREATE INDEX IF NOT EXISTS idx_scores_match_id ON scores(match_id);

-- Create function to calculate scores
CREATE OR REPLACE FUNCTION calculate_match_score(
  p_user_id UUID,
  p_match_id UUID
) RETURNS TABLE (points INTEGER, correct BOOLEAN) AS $$
DECLARE
  v_prediction TEXT;
  v_result_home INTEGER;
  v_result_away INTEGER;
  v_simple_points INTEGER;
  v_exact_points INTEGER;
BEGIN
  -- Get prediction
  SELECT prediction INTO v_prediction
  FROM predictions
  WHERE user_id = p_user_id AND match_id = p_match_id;

  -- Get match result
  SELECT result_home, result_away
  INTO v_result_home, v_result_away
  FROM matches
  WHERE id = p_match_id;

  -- Get point rules (use default if not found)
  SELECT COALESCE(simple_correct, 3), COALESCE(exact_score, 5)
  INTO v_simple_points, v_exact_points
  FROM point_rules
  LIMIT 1;

  -- Determine correctness
  IF v_prediction = '1' AND v_result_home > v_result_away THEN
    RETURN QUERY SELECT v_simple_points::INTEGER, TRUE;
  ELSIF v_prediction = 'X' AND v_result_home = v_result_away THEN
    RETURN QUERY SELECT v_simple_points::INTEGER, TRUE;
  ELSIF v_prediction = '2' AND v_result_home < v_result_away THEN
    RETURN QUERY SELECT v_simple_points::INTEGER, TRUE;
  ELSE
    RETURN QUERY SELECT 0, FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_accuracy DECIMAL;
  v_streak INTEGER;
  v_best_streak INTEGER;
BEGIN
  SELECT COALESCE(COUNT(*), 0), COALESCE(SUM(CASE WHEN correct THEN 1 ELSE 0 END), 0)
  INTO v_total, v_correct
  FROM scores
  WHERE user_id = p_user_id;

  v_accuracy := CASE WHEN v_total > 0 THEN (v_correct::DECIMAL / v_total::DECIMAL * 100) ELSE 0 END;

  -- Simple streak calculation (current consecutive correct from most recent)
  v_streak := 0;
  WITH ordered_scores AS (
    SELECT correct FROM scores
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
  )
  SELECT COALESCE(MAX(seq), 0) INTO v_best_streak FROM (
    SELECT COUNT(*) as seq FROM (
      SELECT correct, LAG(correct) OVER (ORDER BY created_at DESC) as prev
      FROM ordered_scores
    ) sub
    WHERE correct = true AND (prev IS NULL OR prev = true)
    GROUP BY created_at
  ) streaks;

  UPDATE user_stats
  SET
    total_predictions = v_total,
    total_correct = v_correct,
    accuracy = v_accuracy,
    current_streak = v_streak,
    best_streak = v_best_streak,
    last_updated = NOW()
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    INSERT INTO user_stats (user_id, total_predictions, total_correct, accuracy, current_streak, best_streak)
    VALUES (p_user_id, v_total, v_correct, v_accuracy, v_streak, v_best_streak);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get leaderboard
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
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC, COALESCE(SUM(CASE WHEN s.correct THEN 1 ELSE 0 END), 0) DESC) as rank
  FROM users u
  LEFT JOIN scores s ON u.id = s.user_id
  WHERE u.group_id = p_group_id
  GROUP BY u.id, u.name, u.avatar
)
SELECT * FROM ranked ORDER BY rank;
$$ LANGUAGE sql;

-- Enable Row Level Security (optional - disable for now for simplicity)
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE point_rules ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for simplicity (we're using a simple app)
DROP POLICY IF EXISTS "Enable all for all users" ON groups;
DROP POLICY IF EXISTS "Enable all for all users" ON users;
DROP POLICY IF EXISTS "Enable all for all users" ON matches;
DROP POLICY IF EXISTS "Enable all for all users" ON predictions;
DROP POLICY IF EXISTS "Enable all for all users" ON scores;
DROP POLICY IF EXISTS "Enable all for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable all for all users" ON point_rules;

-- Allow all operations for now (simplify for small group)
CREATE POLICY "Enable all for all users" ON groups FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON matches FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON predictions FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON scores FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON user_stats FOR ALL USING (true);
CREATE POLICY "Enable all for all users" ON point_rules FOR ALL USING (true);
