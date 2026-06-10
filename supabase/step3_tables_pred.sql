-- PASO 3: Crear tablas de predicciones y scoring

CREATE TABLE group_standings (
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

CREATE TABLE matches (
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

CREATE TABLE bracket_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_winner TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL CHECK (prediction_type IN ('group_standing','bracket')),
  phase TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  correct BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_stats (
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

CREATE TABLE point_rules (
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

SELECT 'PASO 3 COMPLETADO: todas las tablas creadas' as status;
