-- PASO 1: Drop todo lo viejo (ejecuta esto primero)
DROP POLICY IF EXISTS "Enable all for all users" ON group_standings;
DROP POLICY IF EXISTS "Enable all for all users" ON bracket_predictions;
DROP POLICY IF EXISTS "Enable all for all users" ON scores;
DROP POLICY IF EXISTS "Enable all for all users" ON user_stats;
DROP POLICY IF EXISTS "Enable all for all users" ON point_rules;
DROP POLICY IF EXISTS "Enable all for all users" ON matches;
DROP POLICY IF EXISTS "Enable all for all users" ON users;
DROP POLICY IF EXISTS "Enable all for all users" ON groups;

DROP FUNCTION IF EXISTS get_leaderboard(UUID);
DROP FUNCTION IF EXISTS update_user_stats(UUID);

DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS scores CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS point_rules CASCADE;
DROP TABLE IF EXISTS group_standings CASCADE;
DROP TABLE IF EXISTS bracket_predictions CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

SELECT 'PASO 1 COMPLETADO: Todo limpio' as status;
