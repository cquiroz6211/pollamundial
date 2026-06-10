-- PASO 5: Row Level Security (RLS)

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

SELECT 'PASO 5 COMPLETADO: RLS habilitado' as status;
