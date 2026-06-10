-- PASO 4: Indexes + Functions

-- Indexes
CREATE INDEX idx_users_group_id ON users(group_id);
CREATE INDEX idx_matches_group_id ON matches(group_id);
CREATE INDEX idx_matches_type ON matches(match_type);
CREATE INDEX idx_group_standings_user ON group_standings(user_id);
CREATE INDEX idx_bracket_pred_user ON bracket_predictions(user_id);
CREATE INDEX idx_scores_user_id ON scores(user_id);
CREATE INDEX idx_scores_match_id ON scores(match_id);

-- Function: update user stats
CREATE OR REPLACE FUNCTION update_user_stats(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total INTEGER;
  v_correct INTEGER;
  v_accuracy DECIMAL;
BEGIN
  SELECT COALESCE(COUNT(*), 0), COALESCE(SUM(CASE WHEN correct THEN 1 ELSE 0 END), 0)
  INTO v_total, v_correct
  FROM scores WHERE user_id = p_user_id;

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

-- Function: get leaderboard
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
    ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(s.points), 0) DESC) as rank
  FROM users u
  LEFT JOIN scores s ON u.id = s.user_id
  WHERE u.group_id = p_group_id
  GROUP BY u.id, u.name, u.avatar
)
SELECT * FROM ranked ORDER BY rank;
$$ LANGUAGE sql;

SELECT 'PASO 4 COMPLETADO: indexes + functions' as status;
