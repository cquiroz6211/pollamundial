export interface WorldCupMatch {
  team_home: string
  team_away: string
  phase: string
  scheduled_at: string
}

// FIFA World Cup 2026 — All 52 matches (32 group + 20 knockout)
// Dates are approximate based on official FIFA schedule
export const WORLD_CUP_MATCHES: WorldCupMatch[] = [
  // GROUP A
  { team_home: 'USA', team_away: 'China', phase: 'Group A', scheduled_at: '2026-06-11T17:00:00Z' },
  { team_home: 'Portugal', team_away: 'Ghana', phase: 'Group A', scheduled_at: '2026-06-12T00:00:00Z' },
  { team_home: 'Uruguay', team_away: 'Czech Republic', phase: 'Group A', scheduled_at: '2026-06-12T20:00:00Z' },
  { team_home: 'USA', team_away: 'Portugal', phase: 'Group A', scheduled_at: '2026-06-16T20:00:00Z' },
  { team_home: 'China', team_away: 'Uruguay', phase: 'Group A', scheduled_at: '2026-06-17T00:00:00Z' },
  { team_home: 'Ghana', team_away: 'Czech Republic', phase: 'Group A', scheduled_at: '2026-06-17T20:00:00Z' },
  { team_home: 'USA', team_away: 'Uruguay', phase: 'Group A', scheduled_at: '2026-06-21T20:00:00Z' },
  { team_home: 'China', team_away: 'Ghana', phase: 'Group A', scheduled_at: '2026-06-21T20:00:00Z' },
  { team_home: 'Portugal', team_away: 'Czech Republic', phase: 'Group A', scheduled_at: '2026-06-21T20:00:00Z' },

  // GROUP B
  { team_home: 'France', team_away: 'Canada', phase: 'Group B', scheduled_at: '2026-06-12T00:00:00Z' },
  { team_home: 'Mexico', team_away: 'South Africa', phase: 'Group B', scheduled_at: '2026-06-12T20:00:00Z' },
  { team_home: 'Japan', team_away: 'Morocco', phase: 'Group B', scheduled_at: '2026-06-13T00:00:00Z' },
  { team_home: 'France', team_away: 'Mexico', phase: 'Group B', scheduled_at: '2026-06-17T00:00:00Z' },
  { team_home: 'Canada', team_away: 'Japan', phase: 'Group B', scheduled_at: '2026-06-17T20:00:00Z' },
  { team_home: 'South Africa', team_away: 'Morocco', phase: 'Group B', scheduled_at: '2026-06-18T00:00:00Z' },
  { team_home: 'France', team_away: 'Japan', phase: 'Group B', scheduled_at: '2026-06-22T00:00:00Z' },
  { team_home: 'Canada', team_away: 'South Africa', phase: 'Group B', scheduled_at: '2026-06-22T00:00:00Z' },
  { team_home: 'Mexico', team_away: 'Morocco', phase: 'Group B', scheduled_at: '2026-06-22T00:00:00Z' },

  // GROUP C
  { team_home: 'Argentina', team_away: 'Estonia', phase: 'Group C', scheduled_at: '2026-06-12T20:00:00Z' },
  { team_home: 'Saudi Arabia', team_away: 'Denmark', phase: 'Group C', scheduled_at: '2026-06-13T00:00:00Z' },
  { team_home: 'Nigeria', team_away: 'Belgium', phase: 'Group C', scheduled_at: '2026-06-13T20:00:00Z' },
  { team_home: 'Argentina', team_away: 'Saudi Arabia', phase: 'Group C', scheduled_at: '2026-06-18T00:00:00Z' },
  { team_home: 'Estonia', team_away: 'Nigeria', phase: 'Group C', scheduled_at: '2026-06-18T20:00:00Z' },
  { team_home: 'Denmark', team_away: 'Belgium', phase: 'Group C', scheduled_at: '2026-06-19T00:00:00Z' },
  { team_home: 'Argentina', team_away: 'Nigeria', phase: 'Group C', scheduled_at: '2026-06-22T20:00:00Z' },
  { team_home: 'Estonia', team_away: 'Denmark', phase: 'Group C', scheduled_at: '2026-06-22T20:00:00Z' },
  { team_home: 'Saudi Arabia', team_away: 'Belgium', phase: 'Group C', scheduled_at: '2026-06-22T20:00:00Z' },

  // GROUP D
  { team_home: 'Brazil', team_away: 'Serbia', phase: 'Group D', scheduled_at: '2026-06-13T00:00:00Z' },
  { team_home: 'Switzerland', team_away: 'Cameroon', phase: 'Group D', scheduled_at: '2026-06-13T20:00:00Z' },
  { team_home: 'Colombia', team_away: 'Uzbekistan', phase: 'Group D', scheduled_at: '2026-06-14T00:00:00Z' },
  { team_home: 'Brazil', team_away: 'Switzerland', phase: 'Group D', scheduled_at: '2026-06-18T20:00:00Z' },
  { team_home: 'Serbia', team_away: 'Colombia', phase: 'Group D', scheduled_at: '2026-06-19T00:00:00Z' },
  { team_home: 'Cameroon', team_away: 'Uzbekistan', phase: 'Group D', scheduled_at: '2026-06-19T20:00:00Z' },
  { team_home: 'Brazil', team_away: 'Colombia', phase: 'Group D', scheduled_at: '2026-06-23T00:00:00Z' },
  { team_home: 'Serbia', team_away: 'Cameroon', phase: 'Group D', scheduled_at: '2026-06-23T00:00:00Z' },
  { team_home: 'Switzerland', team_away: 'Uzbekistan', phase: 'Group D', scheduled_at: '2026-06-23T00:00:00Z' },

  // GROUP E
  { team_home: 'Germany', team_away: 'New Zealand', phase: 'Group E', scheduled_at: '2026-06-14T00:00:00Z' },
  { team_home: 'Spain', team_away: 'Costa Rica', phase: 'Group E', scheduled_at: '2026-06-14T20:00:00Z' },
  { team_home: 'Australia', team_away: 'Iran', phase: 'Group E', scheduled_at: '2026-06-15T00:00:00Z' },
  { team_home: 'Germany', team_away: 'Spain', phase: 'Group E', scheduled_at: '2026-06-19T20:00:00Z' },
  { team_home: 'New Zealand', team_away: 'Australia', phase: 'Group E', scheduled_at: '2026-06-20T00:00:00Z' },
  { team_home: 'Costa Rica', team_away: 'Iran', phase: 'Group E', scheduled_at: '2026-06-20T20:00:00Z' },
  { team_home: 'Germany', team_away: 'Australia', phase: 'Group E', scheduled_at: '2026-06-24T00:00:00Z' },
  { team_home: 'New Zealand', team_away: 'Costa Rica', phase: 'Group E', scheduled_at: '2026-06-24T00:00:00Z' },
  { team_home: 'Spain', team_away: 'Iran', phase: 'Group E', scheduled_at: '2026-06-24T00:00:00Z' },

  // GROUP F
  { team_home: 'England', team_away: 'Austria', phase: 'Group F', scheduled_at: '2026-06-14T20:00:00Z' },
  { team_home: 'Egypt', team_away: 'Iraq', phase: 'Group F', scheduled_at: '2026-06-15T00:00:00Z' },
  { team_home: 'Korea Republic', team_away: 'Portugal', phase: 'Group F', scheduled_at: '2026-06-15T20:00:00Z' },
  { team_home: 'England', team_away: 'Egypt', phase: 'Group F', scheduled_at: '2026-06-20T20:00:00Z' },
  { team_home: 'Austria', team_away: 'Korea Republic', phase: 'Group F', scheduled_at: '2026-06-21T00:00:00Z' },
  { team_home: 'Iraq', team_away: 'Portugal', phase: 'Group F', scheduled_at: '2026-06-21T20:00:00Z' },
  { team_home: 'England', team_away: 'Korea Republic', phase: 'Group F', scheduled_at: '2026-06-24T20:00:00Z' },
  { team_home: 'Austria', team_away: 'Iraq', phase: 'Group F', scheduled_at: '2026-06-24T20:00:00Z' },
  { team_home: 'Egypt', team_away: 'Portugal', phase: 'Group F', scheduled_at: '2026-06-24T20:00:00Z' },

  // GROUP G
  { team_home: 'Netherlands', team_away: 'Paraguay', phase: 'Group G', scheduled_at: '2026-06-15T00:00:00Z' },
  { team_home: 'Senegal', team_away: 'Qatar', phase: 'Group G', scheduled_at: '2026-06-15T20:00:00Z' },
  { team_home: 'Ecuador', team_away: 'Jamaica', phase: 'Group G', scheduled_at: '2026-06-16T00:00:00Z' },
  { team_home: 'Netherlands', team_away: 'Senegal', phase: 'Group G', scheduled_at: '2026-06-21T00:00:00Z' },
  { team_home: 'Paraguay', team_away: 'Ecuador', phase: 'Group G', scheduled_at: '2026-06-21T20:00:00Z' },
  { team_home: 'Qatar', team_away: 'Jamaica', phase: 'Group G', scheduled_at: '2026-06-22T00:00:00Z' },
  { team_home: 'Netherlands', team_away: 'Ecuador', phase: 'Group G', scheduled_at: '2026-06-25T00:00:00Z' },
  { team_home: 'Paraguay', team_away: 'Qatar', phase: 'Group G', scheduled_at: '2026-06-25T00:00:00Z' },
  { team_home: 'Senegal', team_away: 'Jamaica', phase: 'Group G', scheduled_at: '2026-06-25T00:00:00Z' },

  // GROUP H
  { team_home: 'Croatia', team_away: 'Bolivia', phase: 'Group H', scheduled_at: '2026-06-15T20:00:00Z' },
  { team_home: 'Uruguay', team_away: 'Iceland', phase: 'Group H', scheduled_at: '2026-06-16T00:00:00Z' },
  { team_home: 'Tunisia', team_away: 'Venezuela', phase: 'Group H', scheduled_at: '2026-06-16T20:00:00Z' },
  { team_home: 'Croatia', team_away: 'Uruguay', phase: 'Group H', scheduled_at: '2026-06-22T00:00:00Z' },
  { team_home: 'Bolivia', team_away: 'Tunisia', phase: 'Group H', scheduled_at: '2026-06-22T20:00:00Z' },
  { team_home: 'Iceland', team_away: 'Venezuela', phase: 'Group H', scheduled_at: '2026-06-23T00:00:00Z' },
  { team_home: 'Croatia', team_away: 'Tunisia', phase: 'Group H', scheduled_at: '2026-06-25T20:00:00Z' },
  { team_home: 'Bolivia', team_away: 'Iceland', phase: 'Group H', scheduled_at: '2026-06-25T20:00:00Z' },
  { team_home: 'Uruguay', team_away: 'Venezuela', phase: 'Group H', scheduled_at: '2026-06-25T20:00:00Z' },

  // ROUND OF 32
  { team_home: 'A1', team_away: 'B2', phase: 'Round of 32', scheduled_at: '2026-06-27T16:00:00Z' },
  { team_home: 'C1', team_away: 'D2', phase: 'Round of 32', scheduled_at: '2026-06-27T20:00:00Z' },
  { team_home: 'E1', team_away: 'F2', phase: 'Round of 32', scheduled_at: '2026-06-28T16:00:00Z' },
  { team_home: 'G1', team_away: 'H2', phase: 'Round of 32', scheduled_at: '2026-06-28T20:00:00Z' },
  { team_home: 'B1', team_away: 'A2', phase: 'Round of 32', scheduled_at: '2026-06-29T16:00:00Z' },
  { team_home: 'D1', team_away: 'C2', phase: 'Round of 32', scheduled_at: '2026-06-29T20:00:00Z' },
  { team_home: 'F1', team_away: 'E2', phase: 'Round of 32', scheduled_at: '2026-06-30T16:00:00Z' },
  { team_home: 'H1', team_away: 'G2', phase: 'Round of 32', scheduled_at: '2026-06-30T20:00:00Z' },

  // ROUND OF 16
  { team_home: 'W1', team_away: 'W2', phase: 'Round of 16', scheduled_at: '2026-07-03T16:00:00Z' },
  { team_home: 'W3', team_away: 'W4', phase: 'Round of 16', scheduled_at: '2026-07-03T20:00:00Z' },
  { team_home: 'W5', team_away: 'W6', phase: 'Round of 16', scheduled_at: '2026-07-04T16:00:00Z' },
  { team_home: 'W7', team_away: 'W8', phase: 'Round of 16', scheduled_at: '2026-07-04T20:00:00Z' },

  // QUARTERFINALS
  { team_home: 'QF1', team_away: 'QF2', phase: 'Quarterfinal', scheduled_at: '2026-07-07T20:00:00Z' },
  { team_home: 'QF3', team_away: 'QF4', phase: 'Quarterfinal', scheduled_at: '2026-07-08T20:00:00Z' },

  // SEMIFINALS
  { team_home: 'SF1', team_away: 'SF2', phase: 'Semifinal', scheduled_at: '2026-07-11T20:00:00Z' },

  // THIRD PLACE
  { team_home: 'L1', team_away: 'L2', phase: 'Third Place', scheduled_at: '2026-07-14T17:00:00Z' },

  // FINAL
  { team_home: 'F1', team_away: 'F2', phase: 'Final', scheduled_at: '2026-07-19T20:00:00Z' },
]

// Helper: group matches by phase
export function getMatchesByPhase(matches: WorldCupMatch[]): Map<string, WorldCupMatch[]> {
  const phaseMap = new Map<string, WorldCupMatch[]>()
  for (const match of matches) {
    if (!phaseMap.has(match.phase)) {
      phaseMap.set(match.phase, [])
    }
    phaseMap.get(match.phase)!.push(match)
  }
  return phaseMap
}

// Helper: get unique phases in order
export const PHASE_ORDER = [
  'Group A', 'Group B', 'Group C', 'Group D', 'Group E', 'Group F', 'Group G', 'Group H',
  'Round of 32', 'Round of 16', 'Quarterfinal', 'Semifinal', 'Third Place', 'Final',
]
