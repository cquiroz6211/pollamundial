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

export interface Match {
  id: string
  group_id: string
  team_home: string
  team_away: string
  phase: string
  scheduled_at: string
  status: 'pending' | 'active' | 'closed' | 'completed'
  result_home: number | null
  result_away: number | null
  predictions_closed: boolean
}

export interface PredictionRecord {
  id: string
  user_id: string
  match_id: string
  prediction: Prediction
  created_at: string
}

export interface Score {
  id: string
  user_id: string
  match_id: string
  points: number
  correct: boolean
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
  simple_correct: number
  exact_score: number
  champion_pick: number
  top_scorer_pick: number
}

export interface LeaderboardEntry {
  name: string
  avatar: string
  total_points: number
  correct_predictions: number
  total_predictions: number
}
