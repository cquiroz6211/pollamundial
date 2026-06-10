// ============================================================
// FIFA WORLD CUP 2026 — Polla Familiar Toribios
// 48 equipos, 12 grupos de 4, formato expandido
// Puntuación: Grupos=1, R32=2, R16=4, QF=6, SF=8, Final=10, Campeón=15
// ============================================================

// --- Equipos por grupo (datos oficiales) ---
export interface GroupTeam {
  position: number  // 1, 2, 3, 4
  name: string
  flag: string
  group: string
}

export const GROUPS: Record<string, GroupTeam[]> = {
  'A': [
    { position: 1, name: 'México', flag: '🇲🇽', group: 'A' },
    { position: 2, name: 'Corea del Sur', flag: '🇰🇷', group: 'A' },
    { position: 3, name: 'Sudáfrica', flag: '🇿🇦', group: 'A' },
    { position: 4, name: 'República Checa', flag: '🇨🇿', group: 'A' },
  ],
  'B': [
    { position: 1, name: 'Canadá', flag: '🇨🇦', group: 'B' },
    { position: 2, name: 'Suiza', flag: '🇨🇭', group: 'B' },
    { position: 3, name: 'Qatar', flag: '🇶🇦', group: 'B' },
    { position: 4, name: 'Bosnia y Herzegovina', flag: '🇧🇦', group: 'B' },
  ],
  'C': [
    { position: 1, name: 'Brasil', flag: '🇧🇷', group: 'C' },
    { position: 2, name: 'Marruecos', flag: '🇲🇦', group: 'C' },
    { position: 3, name: 'Haití', flag: '🇭🇹', group: 'C' },
    { position: 4, name: 'Escocia', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', group: 'C' },
  ],
  'D': [
    { position: 1, name: 'Estados Unidos', flag: '🇺🇸', group: 'D' },
    { position: 2, name: 'Paraguay', flag: '🇵🇾', group: 'D' },
    { position: 3, name: 'Australia', flag: '🇦🇺', group: 'D' },
    { position: 4, name: 'Turquía', flag: '🇹🇷', group: 'D' },
  ],
  'E': [
    { position: 1, name: 'Alemania', flag: '🇩🇪', group: 'E' },
    { position: 2, name: 'Ecuador', flag: '🇪🇨', group: 'E' },
    { position: 3, name: 'Costa de Marfil', flag: '🇨🇮', group: 'E' },
    { position: 4, name: 'Curazao', flag: '🇨🇼', group: 'E' },
  ],
  'F': [
    { position: 1, name: 'Países Bajos', flag: '🇳🇱', group: 'F' },
    { position: 2, name: 'Japón', flag: '🇯🇵', group: 'F' },
    { position: 3, name: 'Suecia', flag: '🇸🇪', group: 'F' },
    { position: 4, name: 'Túnez', flag: '🇹🇳', group: 'F' },
  ],
  'G': [
    { position: 1, name: 'Bélgica', flag: '🇧🇪', group: 'G' },
    { position: 2, name: 'Irán', flag: '🇮🇷', group: 'G' },
    { position: 3, name: 'Egipto', flag: '🇪🇬', group: 'G' },
    { position: 4, name: 'Nueva Zelanda', flag: '🇳🇿', group: 'G' },
  ],
  'H': [
    { position: 1, name: 'España', flag: '🇪🇸', group: 'H' },
    { position: 2, name: 'Uruguay', flag: '🇺🇾', group: 'H' },
    { position: 3, name: 'Arabia Saudita', flag: '🇸🇦', group: 'H' },
    { position: 4, name: 'Cabo Verde', flag: '🇨🇻', group: 'H' },
  ],
  'I': [
    { position: 1, name: 'Francia', flag: '🇫🇷', group: 'I' },
    { position: 2, name: 'Senegal', flag: '🇸🇳', group: 'I' },
    { position: 3, name: 'Noruega', flag: '🇳🇴', group: 'I' },
    { position: 4, name: 'Irak', flag: '🇮🇶', group: 'I' },
  ],
  'J': [
    { position: 1, name: 'Argentina', flag: '🇦🇷', group: 'J' },
    { position: 2, name: 'Argelia', flag: '🇩🇿', group: 'J' },
    { position: 3, name: 'Austria', flag: '🇦🇹', group: 'J' },
    { position: 4, name: 'Jordania', flag: '🇯🇴', group: 'J' },
  ],
  'K': [
    { position: 1, name: 'Portugal', flag: '🇵🇹', group: 'K' },
    { position: 2, name: 'Colombia', flag: '🇨🇴', group: 'K' },
    { position: 3, name: 'Uzbekistán', flag: '🇺🇿', group: 'K' },
    { position: 4, name: 'República Democrática del Congo', flag: '🇨🇩', group: 'K' },
  ],
  'L': [
    { position: 1, name: 'Inglaterra', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'L' },
    { position: 2, name: 'Croacia', flag: '🇭🇷', group: 'L' },
    { position: 3, name: 'Ghana', flag: '🇬🇭', group: 'L' },
    { position: 4, name: 'Panamá', flag: '🇵🇦', group: 'L' },
  ],
}

// --- Calendario de partidos de fase de grupos (horarios COT = UTC-5) ---
export interface GroupMatch {
  id: string
  group: string
  team_home: string
  team_away: string
  date: string        // ISO date YYYY-MM-DD
  time_cot: string    // HH:mm en hora Colombia
  venue: string
  matchday: number    // 1, 2, 3
}

export const GROUP_MATCHES: GroupMatch[] = [
  // MATCHDAY 1 — Jueves 11 de junio
  { id: 'g1', group: 'A', team_home: 'México', team_away: 'Sudáfrica', date: '2026-06-11', time_cot: '14:00', venue: 'Ciudad de México', matchday: 1 },
  { id: 'g2', group: 'A', team_home: 'Corea del Sur', team_away: 'República Checa', date: '2026-06-11', time_cot: '21:00', venue: 'Guadalajara', matchday: 1 },

  // MATCHDAY 1 — Viernes 12 de junio
  { id: 'g3', group: 'B', team_home: 'Canadá', team_away: 'Bosnia y Herzegovina', date: '2026-06-12', time_cot: '14:00', venue: 'Toronto', matchday: 1 },
  { id: 'g4', group: 'D', team_home: 'Estados Unidos', team_away: 'Paraguay', date: '2026-06-12', time_cot: '20:00', venue: 'Los Ángeles', matchday: 1 },

  // MATCHDAY 1 — Sábado 13 de junio
  { id: 'g5', group: 'B', team_home: 'Qatar', team_away: 'Suiza', date: '2026-06-13', time_cot: '14:00', venue: 'Bahía de San Francisco', matchday: 1 },
  { id: 'g6', group: 'C', team_home: 'Brasil', team_away: 'Marruecos', date: '2026-06-13', time_cot: '17:00', venue: 'Nueva York / Nueva Jersey', matchday: 1 },
  { id: 'g7', group: 'C', team_home: 'Haití', team_away: 'Escocia', date: '2026-06-13', time_cot: '20:00', venue: 'Boston', matchday: 1 },
  { id: 'g8', group: 'D', team_home: 'Australia', team_away: 'Turquía', date: '2026-06-13', time_cot: '23:00', venue: 'Vancouver', matchday: 1 },

  // MATCHDAY 1 — Domingo 14 de junio
  { id: 'g9', group: 'E', team_home: 'Alemania', team_away: 'Curazao', date: '2026-06-14', time_cot: '12:00', venue: 'Houston', matchday: 1 },
  { id: 'g10', group: 'F', team_home: 'Países Bajos', team_away: 'Japón', date: '2026-06-14', time_cot: '15:00', venue: 'Dallas', matchday: 1 },
  { id: 'g11', group: 'E', team_home: 'Costa de Marfil', team_away: 'Ecuador', date: '2026-06-14', time_cot: '18:00', venue: 'Filadelfia', matchday: 1 },
  { id: 'g12', group: 'F', team_home: 'Suecia', team_away: 'Túnez', date: '2026-06-14', time_cot: '21:00', venue: 'Monterrey', matchday: 1 },

  // MATCHDAY 1 — Lunes 15 de junio
  { id: 'g13', group: 'H', team_home: 'España', team_away: 'Cabo Verde', date: '2026-06-15', time_cot: '11:00', venue: 'Atlanta', matchday: 1 },
  { id: 'g14', group: 'G', team_home: 'Bélgica', team_away: 'Egipto', date: '2026-06-15', time_cot: '14:00', venue: 'Seattle', matchday: 1 },
  { id: 'g15', group: 'H', team_home: 'Arabia Saudita', team_away: 'Uruguay', date: '2026-06-15', time_cot: '17:00', venue: 'Miami', matchday: 1 },
  { id: 'g16', group: 'G', team_home: 'Irán', team_away: 'Nueva Zelanda', date: '2026-06-15', time_cot: '20:00', venue: 'Los Ángeles', matchday: 1 },

  // MATCHDAY 1 — Martes 16 de junio
  { id: 'g17', group: 'I', team_home: 'Francia', team_away: 'Senegal', date: '2026-06-16', time_cot: '14:00', venue: 'Nueva York / Nueva Jersey', matchday: 1 },
  { id: 'g18', group: 'I', team_home: 'Irak', team_away: 'Noruega', date: '2026-06-16', time_cot: '17:00', venue: 'Boston', matchday: 1 },
  { id: 'g19', group: 'J', team_home: 'Argentina', team_away: 'Argelia', date: '2026-06-16', time_cot: '20:00', venue: 'Kansas City', matchday: 1 },
  { id: 'g20', group: 'J', team_home: 'Austria', team_away: 'Jordania', date: '2026-06-16', time_cot: '23:00', venue: 'Bahía de San Francisco', matchday: 1 },

  // MATCHDAY 1 — Miércoles 17 de junio
  { id: 'g21', group: 'K', team_home: 'Portugal', team_away: 'República Democrática del Congo', date: '2026-06-17', time_cot: '13:00', venue: 'Houston', matchday: 1 },
  { id: 'g22', group: 'L', team_home: 'Inglaterra', team_away: 'Croacia', date: '2026-06-17', time_cot: '16:00', venue: 'Dallas', matchday: 1 },
  { id: 'g23', group: 'L', team_home: 'Ghana', team_away: 'Panamá', date: '2026-06-17', time_cot: '19:00', venue: 'Toronto', matchday: 1 },
  { id: 'g24', group: 'K', team_home: 'Uzbekistán', team_away: 'Colombia', date: '2026-06-17', time_cot: '22:00', venue: 'Ciudad de México', matchday: 1 },
]

// --- Bracket de eliminatorias (formato expandido 48 equipos) ---
// Dieciseisavos: 12 primeros de grupo + 4 mejores terceros
// El bracket se construye con posiciones: 1A vs 3ABCDF, etc.

export interface KnockoutMatch {
  id: string
  phase: string
  round: string       // 'R32', 'R16', 'QF', 'SF', '3rd', 'Final'
  slot: string        // posición en el bracket (R32-1, R32-2, etc.)
  team_home_template: string  // ej: "1A", "3ABCDF", "W1"
  team_away_template: string  // ej: "3ABCDF", "1B"
  scheduled_date?: string
  scheduled_time_cot?: string
  venue?: string
}

// Dieciseisavos de final — 16 partidos
export const ROUND_OF_32: KnockoutMatch[] = [
  { id: 'r32-1', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-1', team_home_template: '1A', team_away_template: '3ABCDF', scheduled_date: '2026-06-29', scheduled_time_cot: '17:00', venue: 'Nueva York / Nueva Jersey' },
  { id: 'r32-2', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-2', team_home_template: '1B', team_away_template: '3ABCDF', scheduled_date: '2026-06-29', scheduled_time_cot: '20:00', venue: 'Los Ángeles' },
  { id: 'r32-3', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-3', team_home_template: '1C', team_away_template: '3ABCDF', scheduled_date: '2026-06-30', scheduled_time_cot: '17:00', venue: 'Houston' },
  { id: 'r32-4', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-4', team_home_template: '1D', team_away_template: '3ABCDF', scheduled_date: '2026-06-30', scheduled_time_cot: '20:00', venue: 'Miami' },
  { id: 'r32-5', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-5', team_home_template: '1E', team_away_template: '3EFGH', scheduled_date: '2026-07-01', scheduled_time_cot: '17:00', venue: 'Filadelfia' },
  { id: 'r32-6', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-6', team_home_template: '1F', team_away_template: '3EFGH', scheduled_date: '2026-07-01', scheduled_time_cot: '20:00', venue: 'Chicago' },
  { id: 'r32-7', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-7', team_home_template: '1G', team_away_template: '3EFGH', scheduled_date: '2026-07-02', scheduled_time_cot: '17:00', venue: 'Seattle' },
  { id: 'r32-8', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-8', team_home_template: '1H', team_away_template: '3EFGH', scheduled_date: '2026-07-02', scheduled_time_cot: '20:00', venue: 'Dallas' },
  { id: 'r32-9', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-9', team_home_template: '1I', team_away_template: '3IJKL', scheduled_date: '2026-07-03', scheduled_time_cot: '17:00', venue: 'Nueva York / Nueva Jersey' },
  { id: 'r32-10', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-10', team_home_template: '1J', team_away_template: '3IJKL', scheduled_date: '2026-07-03', scheduled_time_cot: '20:00', venue: 'Boston' },
  { id: 'r32-11', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-11', team_home_template: '1K', team_away_template: '3IJKL', scheduled_date: '2026-07-04', scheduled_time_cot: '17:00', venue: 'Pittsburgh' },
  { id: 'r32-12', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-12', team_home_template: '1L', team_away_template: '3IJKL', scheduled_date: '2026-07-04', scheduled_time_cot: '20:00', venue: 'Toronto' },
  { id: 'r32-13', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-13', team_home_template: '2A', team_away_template: '3IJKL', scheduled_date: '2026-07-04', scheduled_time_cot: '13:00', venue: 'Kansas City' },
  { id: 'r32-14', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-14', team_home_template: '2B', team_away_template: '3ABCDF', scheduled_date: '2026-07-04', scheduled_time_cot: '16:00', venue: 'San Francisco' },
  { id: 'r32-15', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-15', team_home_template: '2C', team_away_template: '3ABCDF', scheduled_date: '2026-07-04', scheduled_time_cot: '16:00', venue: 'Monterrey' },
  { id: 'r32-16', phase: 'Dieciseisavos', round: 'R32', slot: 'R32-16', team_home_template: '2D', team_away_template: '3EFGH', scheduled_date: '2026-07-04', scheduled_time_cot: '16:00', venue: 'Vancouver' },
]

// Octavos de final — 8 partidos
export const ROUND_OF_16: KnockoutMatch[] = [
  { id: 'r16-1', phase: 'Octavos', round: 'R16', slot: 'R16-1', team_home_template: 'W R32-1', team_away_template: 'W R32-2', scheduled_date: '2026-07-05', scheduled_time_cot: '17:00' },
  { id: 'r16-2', phase: 'Octavos', round: 'R16', slot: 'R16-2', team_home_template: 'W R32-3', team_away_template: 'W R32-4', scheduled_date: '2026-07-05', scheduled_time_cot: '20:00' },
  { id: 'r16-3', phase: 'Octavos', round: 'R16', slot: 'R16-3', team_home_template: 'W R32-5', team_away_template: 'W R32-6', scheduled_date: '2026-07-06', scheduled_time_cot: '17:00' },
  { id: 'r16-4', phase: 'Octavos', round: 'R16', slot: 'R16-4', team_home_template: 'W R32-7', team_away_template: 'W R32-8', scheduled_date: '2026-07-06', scheduled_time_cot: '20:00' },
  { id: 'r16-5', phase: 'Octavos', round: 'R16', slot: 'R16-5', team_home_template: 'W R32-9', team_away_template: 'W R32-10', scheduled_date: '2026-07-07', scheduled_time_cot: '17:00' },
  { id: 'r16-6', phase: 'Octavos', round: 'R16', slot: 'R16-6', team_home_template: 'W R32-11', team_away_template: 'W R32-12', scheduled_date: '2026-07-07', scheduled_time_cot: '20:00' },
  { id: 'r16-7', phase: 'Octavos', round: 'R16', slot: 'R16-7', team_home_template: 'W R32-13', team_away_template: 'W R32-14', scheduled_date: '2026-07-08', scheduled_time_cot: '17:00' },
  { id: 'r16-8', phase: 'Octavos', round: 'R16', slot: 'R16-8', team_home_template: 'W R32-15', team_away_template: 'W R32-16', scheduled_date: '2026-07-08', scheduled_time_cot: '20:00' },
]

// Cuartos de final — 4 partidos
export const QUARTERFINALS: KnockoutMatch[] = [
  { id: 'qf-1', phase: 'Cuartos de Final', round: 'QF', slot: 'QF-1', team_home_template: 'W R16-1', team_away_template: 'W R16-2', scheduled_date: '2026-07-10', scheduled_time_cot: '17:00' },
  { id: 'qf-2', phase: 'Cuartos de Final', round: 'QF', slot: 'QF-2', team_home_template: 'W R16-3', team_away_template: 'W R16-4', scheduled_date: '2026-07-10', scheduled_time_cot: '20:00' },
  { id: 'qf-3', phase: 'Cuartos de Final', round: 'QF', slot: 'QF-3', team_home_template: 'W R16-5', team_away_template: 'W R16-6', scheduled_date: '2026-07-11', scheduled_time_cot: '17:00' },
  { id: 'qf-4', phase: 'Cuartos de Final', round: 'QF', slot: 'QF-4', team_home_template: 'W R16-7', team_away_template: 'W R16-8', scheduled_date: '2026-07-11', scheduled_time_cot: '20:00' },
]

// Semifinales — 2 partidos
export const SEMIFINALS: KnockoutMatch[] = [
  { id: 'sf-1', phase: 'Semifinal', round: 'SF', slot: 'SF-1', team_home_template: 'W QF-1', team_away_template: 'W QF-2', scheduled_date: '2026-07-14', scheduled_time_cot: '17:00', venue: 'Miami' },
  { id: 'sf-2', phase: 'Semifinal', round: 'SF', slot: 'SF-2', team_home_template: 'W QF-3', team_away_template: 'W QF-4', scheduled_date: '2026-07-15', scheduled_time_cot: '17:00', venue: 'Nueva York / Nueva Jersey' },
]

// Tercer puesto y Final
export const THIRD_PLACE: KnockoutMatch = {
  id: '3rd', phase: 'Tercer Puesto', round: '3rd',
  team_home_template: 'L SF-1', team_away_template: 'L SF-2',
  scheduled_date: '2026-07-18', scheduled_time_cot: '17:00', venue: 'Miami'
}

export const FINAL: KnockoutMatch = {
  id: 'final', phase: 'Final', round: 'Final',
  team_home_template: 'W SF-1', team_away_template: 'W SF-2',
  scheduled_date: '2026-07-19', scheduled_time_cot: '17:00', venue: 'Nueva York / Nueva Jersey'
}

// --- Puntuación por fase ---
export interface PhasePoints {
  phase: string
  points_per_team: number
  description: string
}

export const PHASE_POINTS: PhasePoints[] = [
  { phase: 'Grupos', points_per_team: 1, description: 'Cada acierto en fase de grupos (posición en tabla)' },
  { phase: 'Dieciseisavos', points_per_team: 2, description: 'Cada equipo acertado en R32' },
  { phase: 'Octavos', points_per_team: 4, description: 'Cada equipo acertado en R16' },
  { phase: 'Cuartos de Final', points_per_team: 6, description: 'Cada equipo acertado en Cuartos' },
  { phase: 'Semifinal', points_per_team: 8, description: 'Cada equipo acertado en Semifinal' },
  { phase: 'Final', points_per_team: 10, description: 'Equipo que llega a la Final' },
  { phase: 'Gran Campeón', points_per_team: 15, description: 'Campeón del Mundial' },
]

export const TOTAL_POINTS_AVAILABLE = PHASE_POINTS.reduce((sum, p) => sum + p.points_per_team, 0)

// --- Fases en orden ---
export const PHASE_ORDER = [
  'Grupos',
  'Dieciseisavos',
  'Octavos',
  'Cuartos de Final',
  'Semifinal',
  'Final',
  'Gran Campeón',
]

// --- Todos los equipos del mundial ---
export const ALL_TEAMS = Object.values(GROUPS).flat().map(t => t.name)

// --- Helper: obtener equipo por nombre ---
export function findTeam(name: string): GroupTeam | undefined {
  return ALL_TEAMS.find(t => t.name === name) ? Object.values(GROUPS).flat().find(t => t.name === name) : undefined
}

// --- Helper: obtener bandera por nombre ---
export function getTeamFlag(name: string): string {
  const team = Object.values(GROUPS).flat().find(t => t.name === name)
  return team?.flag || '⚽'
}

// --- Helper: obtener grupo de un equipo ---
export function getTeamGroup(name: string): string {
  const team = Object.values(GROUPS).flat().find(t => t.name === name)
  return team?.group || '?'
}
