// ============================================================
// Types para Polla Familiar Toribios — FIFA World Cup 2026
// ============================================================

export type Prediction = '1' | 'X' | '2'

export interface User {
  id: string
  name: string
  avatar: string
  group_id: string
  created_at: string
}

export interface Group {
  id: string
  code: string
  name: string
  created_at: string
  admin_id: string
}

export interface GroupMatch {
  id: string
  group_id: string
  group_letter: string
  team_home: string
  team_away: string
  phase: string
  scheduled_at: string
  time_cot: string
  venue: string
  matchday: number
  status: 'pending' | 'active' | 'completed'
  result_home: number | null
  result_away: number | null
}

export interface BracketMatch {
  id: string
  group_id: string
  match_type: 'r32' | 'r16' | 'qf' | 'sf' | '3rd' | 'final'
  phase: string
  team_home: string
  team_away: string
  template_home: string  // ej: "1A", "W R32-1"
  template_away: string  // ej: "3ABCDF", "W R32-2"
  scheduled_at: string
  status: 'pending' | 'active' | 'completed'
  result_home: number | null
  result_away: number | null
}

export interface GroupStandingPrediction {
  id: string
  user_id: string
  group_letter: string
  position_1: string  // equipo 1°
  position_2: string  // equipo 2°
  position_3: string  // equipo 3°
  position_4: string  // equipo 4°
  created_at: string
  updated_at: string
}

export interface BracketPrediction {
  id: string
  user_id: string
  match_id: string
  predicted_winner: string
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  match_id: string
  prediction_type: 'group_standing' | 'bracket'
  phase: string
  points: number
  correct: boolean
  created_at: string
}

export interface UserStats {
  id: string
  user_id: string
  total_predictions: number
  total_correct: number
  accuracy: number
  current_streak: number
  best_streak: number
  champion_prediction: string | null
  top_scorer_prediction: string | null
  last_updated: string
}

export interface PointRules {
  id: string
  group_id: string
  group_standing_correct: number  // 1 pt
  r32_correct: number             // 2 pts
  r16_correct: number             // 4 pts
  qf_correct: number              // 6 pts
  sf_correct: number              // 8 pts
  final_correct: number           // 10 pts
  champion_correct: number        // 15 pts
}

export interface LeaderboardEntry {
  name: string
  avatar: string
  total_points: number
  correct_predictions: number
  total_predictions: number
  rank: number
}

export interface PhasePoints {
  phase: string
  points_per_team: number
  description: string
}
