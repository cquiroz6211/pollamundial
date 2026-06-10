'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { GROUPS, GROUP_MATCHES, ROUND_OF_32, ROUND_OF_16, QUARTERFINALS, SEMIFINALS, THIRD_PLACE, FINAL, PHASE_ORDER, PHASE_POINTS, getTeamFlag, ALL_TEAMS } from '@/data/world-cup-2026'
import type { User, LeaderboardEntry, GroupStandingPrediction, BracketPrediction } from '@/types'
import { Trophy, Target, Calendar, TrendingUp, LogOut, Shield, Star } from 'lucide-react'

type Tab = 'dashboard' | 'profile' | 'admin'
type DashboardTab = 'grupos' | 'eliminatorias' | 'puntos'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [groupPredictions, setGroupPredictions] = useState<GroupStandingPrediction[]>([])
  const [bracketPredictions, setBracketPredictions] = useState<BracketPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [dashTab, setDashTab] = useState<DashboardTab>('grupos')
  const [selectedGroup, setSelectedGroup] = useState<string>('A')
  const [selectedMatch, setSelectedMatch] = useState<{ id: string; type: 'group' | 'bracket' } | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [predictionError, setPredictionError] = useState('')
  const [completedGroups, setCompletedGroups] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const userId = localStorage.getItem('polla_user_id')
    const userName = localStorage.getItem('polla_user_name')
    const groupId = localStorage.getItem('polla_group_id')
    const isAdmin = localStorage.getItem('polla_is_admin') === 'true'

    if (!userId || !groupId) { router.push('/'); return }

    const fetchUser = async () => {
      try {
        const { data: userData } = await supabase.from('users').select('*').eq('id', userId).single()
        if (userData) {
          setUser({ ...userData, avatar: userName || userData.name })
          setActiveTab(isAdmin ? 'admin' : 'dashboard')
        } else { router.push('/') }
      } catch { router.push('/') }
      finally { setLoading(false) }
    }
    fetchUser()
  }, [router, supabase])

  useEffect(() => {
    if (!user) return
    const fetchLeaderboard = async () => {
      const { data } = await supabase.rpc('get_leaderboard', { p_group_id: user.group_id })
      if (data) setLeaderboard(data)
    }
    fetchLeaderboard()
  }, [user, supabase])

  useEffect(() => {
    if (!user) return
    const fetchPredictions = async () => {
      const [predsRes, bracketRes] = await Promise.all([
        supabase.from('group_standings').select('*').eq('user_id', user.id),
        supabase.from('bracket_predictions').select('*').eq('user_id', user.id),
      ])
      if (predsRes.data) setGroupPredictions(predsRes.data)
      if (bracketRes.data) setBracketPredictions(bracketRes.data)
    }
    fetchPredictions()
  }, [user, supabase])

  // Check completed groups
  useEffect(() => {
    if (!user) return
    const checkCompleted = async () => {
      const { data } = await supabase.from('matches')
        .select('group_letter, result_home, result_away')
        .eq('group_id', user.group_id)
        .eq('match_type', 'group')
      if (data) {
        const completed = new Set<string>()
        for (const g of PHASE_ORDER) {
          const groupMatches = data.filter(m => m.group_letter === g)
          if (groupMatches.length === 6 && groupMatches.every(m => m.result_home !== null && m.result_away !== null)) {
            completed.add(g)
          }
        }
        setCompletedGroups(completed)
      }
    }
    checkCompleted()
  }, [user, supabase])

  const getUserGroupPrediction = (groupLetter: string) => {
    return groupPredictions.find(p => p.group_letter === groupLetter)
  }

  const getGroupPredictionPositions = (groupLetter: string): Record<number, string> => {
    const pred = getUserGroupPrediction(groupLetter)
    if (!pred) return { 1: '', 2: '', 3: '', 4: '' }
    return { 1: pred.position_1, 2: pred.position_2, 3: pred.position_3, 4: pred.position_4 }
  }

  const handleGroupPrediction = async (groupLetter: string, position: number, teamName: string) => {
    if (!user) return

    const prev = getUserGroupPrediction(groupLetter)
    try {
      if (prev) {
        await supabase.from('group_standings').update({
          [`position_${position}`]: teamName,
          updated_at: new Date().toISOString(),
        }).eq('user_id', user.id).eq('group_letter', groupLetter)
      } else {
        await supabase.from('group_standings').insert({
          user_id: user.id,
          group_letter: groupLetter,
          position_1: position === 1 ? teamName : '',
          position_2: position === 2 ? teamName : '',
          position_3: position === 3 ? teamName : '',
          position_4: position === 4 ? teamName : '',
        })
      }
      // Refresh
      const { data } = await supabase.from('group_standings').select('*').eq('user_id', user.id)
      if (data) setGroupPredictions(data)
    } catch (err) {
      console.error('Error saving prediction:', err)
    }
  }

  const handleBracketPrediction = async (matchId: string, winner: string) => {
    if (!user || !winner) return
    setSaving(true)
    setPredictionError('')

    try {
      const existing = bracketPredictions.find(p => p.match_id === matchId)
      if (existing) {
        await supabase.from('bracket_predictions').update({ predicted_winner: winner }).eq('user_id', user.id).eq('match_id', matchId)
      } else {
        await supabase.from('bracket_predictions').insert({ user_id: user.id, match_id: matchId, predicted_winner: winner })
      }
      const { data } = await supabase.from('bracket_predictions').select('*').eq('user_id', user.id)
      if (data) setBracketPredictions(data)
    } catch (err) {
      console.error('Error saving bracket prediction:', err)
      setPredictionError('No se pudo guardar. Intenta de nuevo.')
    } finally {
      setSaving(false)
      setSelectedMatch(null)
      setSelectedPrediction('')
    }
  }

  const getBracketPrediction = (matchId: string) => {
    return bracketPredictions.find(p => p.match_id === matchId)?.predicted_winner || ''
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sports-bg text-slate-100">
        <div className="text-center animate-pulse">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
          <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-emerald-400">Cargando la Polla...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sports-bg text-sports-textLight font-sans relative overflow-hidden pb-12 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[-15%] w-[60%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-15%] w-[60%] h-[40%] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
        <div className="glass-card rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 shadow-xl shadow-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">Polla Mundial</h1>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Copa 2026 · Familia Toribios</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-xl border border-white/5">
            {['dashboard', 'profile', 'admin'].map((tab) => {
              if (tab === 'admin' && localStorage.getItem('polla_is_admin') !== 'true') return null
              const isActive = activeTab === tab
              return (
                <button key={tab} onClick={() => setActiveTab(tab as Tab)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${isActive ? 'bg-emerald-500 text-sports-bg shadow-md shadow-emerald-500/20' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                  {tab === 'dashboard' ? 'Dashboard' : tab === 'profile' ? 'Mi Perfil' : 'Admin'}
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 py-1.5 pl-3 pr-2.5 rounded-xl">
              <span className="text-xs font-bold text-slate-300">{user?.name}</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
            <button onClick={handleLogout} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl transition duration-200" title="Cerrar sesión">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* ==================== DASHBOARD ==================== */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <div className="bg-sports-card/50 glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative overflow-hidden sticky top-6">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/30 to-yellow-500/30"></div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-400" />
                  </div>
                  <h2 className="text-base font-display font-black tracking-tight text-slate-100">Tabla de Posiciones</h2>
                </div>
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {leaderboard.map((entry, index) => {
                    const isCurrentUser = entry.name === user?.name
                    const isTopThree = index < 3
                    const rankColors = [
                      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
                      'text-slate-300 bg-slate-300/10 border-slate-300/20',
                      'text-amber-600 bg-amber-600/10 border-amber-600/20',
                    ]
                    return (
                      <div key={`lb-${index}-${entry.name}`}
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${isCurrentUser ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950/20 border-white/5 hover:border-white/10 hover:bg-slate-950/30'}`}>
                        <span className={`text-xs font-black w-6 h-6 rounded-md flex items-center justify-center border ${isTopThree ? rankColors[index] : 'text-slate-500 bg-white/5 border-white/5'}`}>
                          {index + 1}
                        </span>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isCurrentUser ? 'bg-emerald-500 text-sports-bg font-black' : 'bg-slate-800'}`}>
                          {entry.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>{entry.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            {entry.correct_predictions || 0}/{entry.total_predictions || 0} aciertos
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-black tracking-wider px-2.5 py-1 rounded-lg ${isCurrentUser ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : index === 0 ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                            {entry.total_points || 0} pts
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Sub-tabs */}
              <div className="flex gap-2 mb-6 bg-slate-950/40 p-1.5 rounded-xl border border-white/5 w-fit">
                {(['grupos', 'eliminatorias', 'puntos'] as DashboardTab[]).map((tab) => (
                  <button key={tab} onClick={() => setDashTab(tab)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${dashTab === tab ? 'bg-emerald-500 text-sports-bg shadow-md shadow-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}>
                    {tab === 'grupos' ? '📊 Grupos' : tab === 'eliminatorias' ? '🏆 Eliminatorias' : '⭐ Puntos'}
                  </button>
                ))}
              </div>

              {/* ===== GROUPS TAB ===== */}
              {dashTab === 'grupos' && (
                <div>
                  {/* Group selector */}
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-3">
                    {PHASE_ORDER.map((g) => {
                      const isCompleted = completedGroups.has(g)
                      return (
                        <button key={g} onClick={() => setSelectedGroup(g)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 border flex items-center gap-2 ${selectedGroup === g ? 'bg-emerald-500 text-sports-bg border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-sports-card/50 text-slate-400 border-white/5 hover:border-white/10'}`}>
                          Grupo {g}
                          {isCompleted && <span className="text-[10px]">✅</span>}
                        </button>
                      )
                    })}
                  </div>

                  {/* Group table */}
                  {(() => {
                    const teams = GROUPS[selectedGroup] || []
                    const pred = getGroupPredictionPositions(selectedGroup)
                    return (
                      <div className="bg-sports-card/60 glass-card rounded-2xl border border-white/5 p-6">
                        <h3 className="text-lg font-display font-black text-emerald-400 mb-4">Grupo {selectedGroup}</h3>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/10">
                                <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">#</th>
                                <th className="text-left py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Equipo</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">Pts</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">PJ</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">PG</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">PE</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">PP</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">GF</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">GC</th>
                                <th className="text-center py-2 px-2 text-[10px] font-bold uppercase tracking-wider text-emerald-400">DIF</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teams.map((team, idx) => {
                                const userPred = pred[idx + 1]
                                const isPred = userPred === team.name
                                return (
                                  <tr key={team.name} className={`border-b border-white/5 ${isPred ? 'bg-emerald-500/10' : ''}`}>
                                    <td className="py-3 px-2">
                                      <span className={`text-xs font-black w-5 h-5 rounded flex items-center justify-center ${idx === 0 ? 'bg-emerald-500/20 text-emerald-400' : idx === 1 ? 'bg-blue-500/20 text-blue-400' : idx === 2 ? 'bg-white/5 text-slate-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {idx + 1}
                                      </span>
                                    </td>
                                    <td className="py-3 px-2">
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{team.flag}</span>
                                        <span className={`font-bold ${isPred ? 'text-emerald-400' : 'text-slate-200'}`}>{team.name}</span>
                                        {isPred && <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded">TU PICK</span>}
                                      </div>
                                    </td>
                                    <td className="py-3 px-2 text-center font-bold text-slate-300">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                    <td className="py-3 px-2 text-center text-slate-400">-</td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Prediction section */}
                        <div className="mt-6 pt-4 border-t border-white/5">
                          <p className="text-[10px] font-black tracking-wider uppercase text-slate-400 text-center mb-3">
                            Predice el orden final del Grupo {selectedGroup}
                          </p>
                          <div className="space-y-2">
                            {['1°', '2°', '3°', '4°'].map((pos, idx) => (
                              <div key={pos} className="flex items-center gap-3">
                                <span className="text-xs font-bold text-emerald-400 w-8">{pos}</span>
                                <select
                                  value={pred[idx + 1]}
                                  onChange={(e) => handleGroupPrediction(selectedGroup, idx + 1, e.target.value)}
                                  className="flex-1 bg-slate-950/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                                >
                                  <option value="">Seleccionar equipo...</option>
                                  {teams.map(t => (
                                    <option key={t.name} value={t.name}>{t.flag} {t.name}</option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* All groups summary */}
                  <div className="mt-6">
                    <h3 className="text-sm font-display font-black text-slate-200 mb-3">Resumen de Predicciones</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {PHASE_ORDER.map((g) => {
                        const pred = getUserGroupPrediction(g)
                        const allFilled = pred && pred.position_1 && pred.position_2 && pred.position_3 && pred.position_4
                        return (
                          <button key={g} onClick={() => setSelectedGroup(g)}
                            className={`p-3 rounded-xl border text-left transition-all ${allFilled ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-sports-card/50 border-white/5 hover:border-white/10'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-black text-emerald-400">Grupo {g}</span>
                              {allFilled && <span className="text-[10px]">✅</span>}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {pred ? `${pred.position_1 || '?'} · ${pred.position_2 || '?'}` : 'Sin predicción'}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ===== KNOCKOUTS TAB ===== */}
              {dashTab === 'eliminatorias' && (
                <div className="space-y-8">
                  {/* Phase points info */}
                  <div className="bg-sports-card/60 glass-card rounded-2xl border border-white/5 p-5">
                    <h3 className="text-sm font-display font-black text-slate-200 mb-3">Sistema de Puntos por Fase</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PHASE_POINTS.map((pp) => (
                        <div key={pp.phase} className="bg-slate-950/30 rounded-xl p-3 text-center border border-white/5">
                          <div className="text-lg font-black text-emerald-400">{pp.points_per_team} pts</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase">{pp.phase}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Round of 32 */}
                  <div>
                    <h3 className="text-base font-display font-black text-yellow-400 mb-3">🏅 Dieciseisavos de Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ROUND_OF_32.map((match) => {
                        const pred = getBracketPrediction(match.id)
                        return (
                          <div key={match.id} className="bg-sports-card/60 glass-card rounded-xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">{match.phase}</span>
                              <span className="text-[10px] text-slate-500">{match.slot}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_home_template}</div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 mx-2">VS</span>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_away_template}</div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <select
                                value={pred}
                                onChange={(e) => handleBracketPrediction(match.id, e.target.value)}
                                className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                              >
                                <option value="">¿Quién gana?</option>
                                <option value={match.team_home_template}>{match.team_home_template}</option>
                                <option value={match.team_away_template}>{match.team_away_template}</option>
                              </select>
                              {pred && (
                                <div className="mt-1 text-[10px] text-emerald-400 text-center font-bold">
                                  Tu pick: {pred}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Round of 16 */}
                  <div>
                    <h3 className="text-base font-display font-black text-yellow-400 mb-3">🏅 Octavos de Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {ROUND_OF_16.map((match) => {
                        const pred = getBracketPrediction(match.id)
                        return (
                          <div key={match.id} className="bg-sports-card/60 glass-card rounded-xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">{match.phase}</span>
                              <span className="text-[10px] text-slate-500">{match.slot}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_home_template}</div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 mx-2">VS</span>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_away_template}</div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <select
                                value={pred}
                                onChange={(e) => handleBracketPrediction(match.id, e.target.value)}
                                className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                              >
                                <option value="">¿Quién avanza?</option>
                                <option value={match.team_home_template}>{match.team_home_template}</option>
                                <option value={match.team_away_template}>{match.team_away_template}</option>
                              </select>
                              {pred && (
                                <div className="mt-1 text-[10px] text-emerald-400 text-center font-bold">
                                  Tu pick: {pred}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Quarterfinals */}
                  <div>
                    <h3 className="text-base font-display font-black text-yellow-400 mb-3">🏅 Cuartos de Final</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {QUARTERFINALS.map((match) => {
                        const pred = getBracketPrediction(match.id)
                        return (
                          <div key={match.id} className="bg-sports-card/60 glass-card rounded-xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">{match.phase}</span>
                              <span className="text-[10px] text-slate-500">{match.slot}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_home_template}</div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 mx-2">VS</span>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_away_template}</div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <select
                                value={pred}
                                onChange={(e) => handleBracketPrediction(match.id, e.target.value)}
                                className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                              >
                                <option value="">¿Quién avanza?</option>
                                <option value={match.team_home_template}>{match.team_home_template}</option>
                                <option value={match.team_away_template}>{match.team_away_template}</option>
                              </select>
                              {pred && (
                                <div className="mt-1 text-[10px] text-emerald-400 text-center font-bold">Tu pick: {pred}</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Semifinals */}
                  <div>
                    <h3 className="text-base font-display font-black text-yellow-400 mb-3">🏅 Semifinales</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {SEMIFINALS.map((match) => {
                        const pred = getBracketPrediction(match.id)
                        return (
                          <div key={match.id} className="bg-sports-card/60 glass-card rounded-xl border border-white/5 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[10px] font-bold text-emerald-400 uppercase">{match.phase}</span>
                              <span className="text-[10px] text-slate-500">{match.slot}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_home_template}</div>
                              </div>
                              <span className="text-xs font-bold text-slate-600 mx-2">VS</span>
                              <div className="flex-1 text-center">
                                <div className="text-xs font-bold text-slate-200">{match.team_away_template}</div>
                              </div>
                            </div>
                            <div className="mt-3">
                              <select
                                value={pred}
                                onChange={(e) => handleBracketPrediction(match.id, e.target.value)}
                                className="w-full bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-emerald-500/50"
                              >
                                <option value="">¿Quién avanza?</option>
                                <option value={match.team_home_template}>{match.team_home_template}</option>
                                <option value={match.team_away_template}>{match.team_away_template}</option>
                              </select>
                              {pred && (
                                <div className="mt-1 text-[10px] text-emerald-400 text-center font-bold">Tu pick: {pred}</div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Final & Third Place */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {/* Third Place */}
                    <div className="bg-sports-card/60 glass-card rounded-xl border border-white/5 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Tercer Puesto</span>
                        <span className="text-[10px] text-slate-500">18 Jul</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="text-xs font-bold text-slate-200">{THIRD_PLACE.team_home_template}</div>
                        </div>
                        <span className="text-xs font-bold text-slate-600 mx-2">VS</span>
                        <div className="flex-1 text-center">
                          <div className="text-xs font-bold text-slate-200">{THIRD_PLACE.team_away_template}</div>
                        </div>
                      </div>
                    </div>

                    {/* Final */}
                    <div className="bg-gradient-to-br from-yellow-500/10 to-emerald-500/10 glass-card rounded-xl border border-yellow-500/20 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-yellow-400 uppercase">⭐ FINAL</span>
                        <span className="text-[10px] text-yellow-400">19 Jul · 17:00 COT</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-center">
                          <div className="text-xs font-bold text-slate-200">{FINAL.team_home_template}</div>
                        </div>
                        <span className="text-xs font-bold text-yellow-400 mx-2">VS</span>
                        <div className="flex-1 text-center">
                          <div className="text-xs font-bold text-slate-200">{FINAL.team_away_template}</div>
                        </div>
                      </div>
                      <div className="mt-3">
                        <select
                          value={getBracketPrediction(FINAL.id)}
                          onChange={(e) => handleBracketPrediction(FINAL.id, e.target.value)}
                          className="w-full bg-slate-950/40 border border-yellow-500/30 rounded-lg px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-yellow-500/50"
                        >
                          <option value="">🏆 ¿Quién será el campeón? (15 pts)</option>
                          <option value={FINAL.team_home_template}>{FINAL.team_home_template}</option>
                          <option value={FINAL.team_away_template}>{FINAL.team_away_template}</option>
                        </select>
                        {getBracketPrediction(FINAL.id) && (
                          <div className="mt-1 text-[10px] text-yellow-400 text-center font-bold">
                            Tu campeón: {getBracketPrediction(FINAL.id)} (+15 pts)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== POINTS TAB ===== */}
              {dashTab === 'puntos' && (
                <div className="bg-sports-card/60 glass-card rounded-2xl border border-white/5 p-6">
                  <h3 className="text-lg font-display font-black text-slate-200 mb-4">📋 Resumen de Puntos</h3>
                  <div className="space-y-3">
                    {PHASE_POINTS.map((pp) => {
                      const predCount = pp.phase === 'Grupos'
                        ? groupPredictions.filter(p => p.position_1 && p.position_2 && p.position_3 && p.position_4).length
                        : bracketPredictions.filter(p => p.predicted_winner).length

                      return (
                        <div key={pp.phase} className="flex items-center justify-between bg-slate-950/30 rounded-xl p-4 border border-white/5">
                          <div>
                            <div className="text-sm font-bold text-slate-200">{pp.phase}</div>
                            <div className="text-[10px] text-slate-400">{pp.description}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-emerald-400">{pp.points_per_team} pts</div>
                            <div className="text-[10px] text-slate-400">{predCount} predicción{predCount !== 1 ? 'es' : ''}</div>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-slate-200">Total de predicciones</span>
                      <span className="text-lg font-black text-emerald-400">
                        {groupPredictions.filter(p => p.position_1 && p.position_2 && p.position_3 && p.position_4).length + bracketPredictions.filter(p => p.predicted_winner).length} / {12 + 16 + 8 + 4 + 2 + 1 + 1}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== PROFILE TAB ==================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto my-8">
            <div className="bg-sports-card/50 glass-card rounded-3xl border border-white/5 p-8 text-center mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-yellow-500 to-emerald-500"></div>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-sports-bg text-3xl font-black flex items-center justify-center mx-auto mb-4 border-2 border-emerald-400/30 shadow-lg shadow-emerald-500/10">
                {user?.name ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
              <h2 className="text-2xl font-display font-black text-slate-100">{user?.name}</h2>
              <p className="text-xs text-emerald-400 font-semibold uppercase tracking-widest mt-1">Participante Oficial</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-sports-card/40 glass-card rounded-2xl border border-white/5 p-6 text-center">
                <Target className="w-6 h-6 text-emerald-400 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-100">
                  {groupPredictions.filter(p => p.position_1 && p.position_2 && p.position_3 && p.position_4).length}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Grupos Completados</p>
              </div>
              <div className="bg-sports-card/40 glass-card rounded-2xl border border-white/5 p-6 text-center">
                <Star className="w-6 h-6 text-yellow-400 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-100">
                  {bracketPredictions.filter(p => p.predicted_winner).length}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Eliminatorias</p>
              </div>
              <div className="bg-sports-card/40 glass-card rounded-2xl border border-white/5 p-6 text-center">
                <TrendingUp className="w-6 h-6 text-teal-400 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-100">
                  {leaderboard.find(l => l.name === user?.name)?.total_points || 0}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Puntos Totales</p>
              </div>
            </div>
          </div>
        )}

        {/* ==================== ADMIN TAB ==================== */}
        {activeTab === 'admin' && (
          <div className="max-w-4xl mx-auto my-8">
            <div className="bg-sports-card/50 glass-card rounded-3xl border border-white/5 p-8 mb-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-red-500 via-emerald-500 to-yellow-500"></div>
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-emerald-400" />
                </div>
                <h2 className="text-xl font-display font-black text-slate-100">Panel de Administración</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-2xl p-5 flex flex-col">
                  <span className="text-2xl font-black text-emerald-400">{leaderboard.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Participantes</span>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-5 flex flex-col">
                  <span className="text-2xl font-black text-blue-400">{completedGroups.size}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Grupos Completados</span>
                </div>
                <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-5 flex flex-col">
                  <span className="text-2xl font-black text-yellow-400">{groupPredictions.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Predicciones</span>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-2">Resultados de Grupos</h3>
              <p className="text-xs text-slate-400 mb-4">
                Ingresa los resultados de los partidos de cada grupo para liquidar las pollas.
              </p>

              {/* Group results input */}
              <div className="space-y-4">
                {PHASE_ORDER.map((groupLetter) => {
                  const isCompleted = completedGroups.has(groupLetter)
                  return (
                    <details key={groupLetter} className={`rounded-xl border ${isCompleted ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-slate-950/20'}`}>
                      <summary className="px-4 py-3 cursor-pointer text-sm font-bold text-slate-200 flex items-center justify-between">
                        <span>Grupo {groupLetter}</span>
                        {isCompleted ? <span className="text-xs text-emerald-400">✅ Completado</span> : <span className="text-xs text-slate-500">Pendiente</span>}
                      </summary>
                      <div className="px-4 pb-4 space-y-2">
                        {(() => {
                          const teams = GROUPS[groupLetter] || []
                          return teams.map((team, idx) => (
                            <div key={team.name} className="flex items-center gap-3">
                              <span className="text-sm w-6">{team.flag}</span>
                              <span className="text-xs font-bold text-slate-300 flex-1">{team.name}</span>
                              <input
                                type="number"
                                placeholder="Goles"
                                className="w-16 bg-slate-950/40 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-center text-slate-200 outline-none focus:border-emerald-500/50"
                              />
                            </div>
                          ))
                        })()}
                      </div>
                    </details>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
