'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { WORLD_CUP_MATCHES, getMatchesByPhase, PHASE_ORDER } from '@/data/world-cup-2026'
import type { Match, Prediction, PredictionRecord, Score, User, UserStats } from '@/types'
import { Trophy, Target, Calendar, TrendingUp, ArrowLeft, LogOut, Shield } from 'lucide-react'

const TEAM_FLAGS: Record<string, string> = {
  'USA': '🇺🇸', 'China': '🇨🇳', 'Portugal': '🇵🇹', 'Ghana': '🇬🇭', 'Uruguay': '🇺🇾',
  'Czech Republic': '🇨🇿', 'France': '🇫🇷', 'Canada': '🇨🇦', 'Mexico': '🇲🇽',
  'South Africa': '🇿🇦', 'Japan': '🇯🇵', 'Morocco': '🇲🇦', 'Argentina': '🇦🇷',
  'Estonia': '🇪🇪', 'Saudi Arabia': '🇸🇦', 'Denmark': '🇩🇰', 'Nigeria': '🇳🇬',
  'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Serbia': '🇷🇸', 'Switzerland': '🇨🇭',
  'Cameroon': '🇨🇲', 'Colombia': '🇨🇴', 'Uzbekistan': '🇺🇿', 'Germany': '🇩🇪',
  'New Zealand': '🇳🇿', 'Spain': '🇪🇸', 'Costa Rica': '🇨🇷', 'Australia': '🇦🇺',
  'Iran': '🇮🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Austria': '🇦🇹', 'Egypt': '🇪🇬',
  'Iraq': '🇮🇶', 'Korea Republic': '🇰🇷', 'Netherlands': '🇳🇱', 'Paraguay': '🇵🇾',
  'Senegal': '🇸🇳', 'Qatar': '🇶🇦', 'Ecuador': '🇪🇨', 'Jamaica': '🇯🇲',
  'Croatia': '🇭🇷', 'Bolivia': '🇧🇴', 'Iceland': '🇮🇸', 'Tunisia': '🇹🇳',
  'Venezuela': '🇻🇪'
}

const getFlag = (team: string) => {
  return TEAM_FLAGS[team] || '⚽'
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [userPredictions, setUserPredictions] = useState<Map<string, Prediction>>(new Map())
  const [userScores, setUserScores] = useState<Map<string, Score>>(new Map())
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'profile' | 'admin'>('dashboard')
  const [selectedPhase, setSelectedPhase] = useState('Todos')
  const router = useRouter()
  const supabase = createClient()

  // Check if user is logged in
  useEffect(() => {
    const userId = localStorage.getItem('polla_user_id')
    const userName = localStorage.getItem('polla_user_name')
    const groupId = localStorage.getItem('polla_group_id')
    const isAdmin = localStorage.getItem('polla_is_admin') === 'true'

    if (!userId || !groupId) {
      router.push('/')
      return
    }

    const fetchUser = async () => {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single()

        if (userData) {
          setUser({ ...userData, avatar: userName || userData.name })
          setActiveTab(isAdmin ? 'admin' : 'dashboard')
        } else {
          router.push('/')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        router.push('/')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router, supabase])

  // Fetch matches
  useEffect(() => {
    if (!user) return

    const fetchMatches = async () => {
      const { data } = await supabase
        .from('matches')
        .select('*')
        .eq('group_id', user.group_id)
        .order('scheduled_at', { ascending: true })

      if (data && data.length > 0) {
        setMatches(data)
      } else {
        // No matches in DB, use hardcoded data with temp IDs
        const tempMatches: Match[] = WORLD_CUP_MATCHES.map((m, i) => ({
          id: `temp-${i}`,
          group_id: user.group_id,
          team_home: m.team_home,
          team_away: m.team_away,
          phase: m.phase,
          scheduled_at: m.scheduled_at,
          status: 'pending',
          result_home: null,
          result_away: null,
          predictions_closed: false,
        }))
        setMatches(tempMatches)
      }
    }

    fetchMatches()
  }, [user, supabase])

  // Fetch leaderboard
  useEffect(() => {
    if (!user) return

    const fetchLeaderboard = async () => {
      const { data } = await supabase.rpc('get_leaderboard', { p_group_id: user.group_id })
      if (data) {
        setLeaderboard(data)
      } else {
        // Fallback: fetch users and calculate manually
        const { data: users } = await supabase
          .from('users')
          .select('*')
          .eq('group_id', user.group_id)
          .order('created_at', { ascending: false })

        if (users) {
          setLeaderboard(
            users.map((u: any, i: number) => ({
              name: u.name,
              avatar: u.avatar,
              total_points: 0,
              correct_predictions: 0,
              total_predictions: 0,
              rank: i + 1,
            }))
          )
        }
      }
    }

    fetchLeaderboard()
  }, [user, supabase])

  // Fetch user predictions and scores
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      const [predictionsRes, scoresRes, statsRes] = await Promise.all([
        supabase
          .from('predictions')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('scores')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('user_stats')
          .select('*')
          .eq('user_id', user.id)
          .single(),
      ])

      if (predictionsRes.data) {
        const predMap = new Map<string, Prediction>()
        predictionsRes.data.forEach((p: PredictionRecord) => predMap.set(p.match_id, p.prediction))
        setUserPredictions(predMap)
      }

      if (scoresRes.data) {
        const scoreMap = new Map<string, Score>()
        scoresRes.data.forEach((s: Score) => scoreMap.set(s.match_id, s))
        setUserScores(scoreMap)
      }

      if (statsRes.data) {
        setUserStats(statsRes.data)
      }
    }

    fetchData()
  }, [user, supabase])

  const [predictionError, setPredictionError] = useState('')

  const handlePrediction = async () => {
    if (!selectedMatch || !user || !selectedPrediction) return

    setSaving(true)
    setPredictionError('')

    // Save current state for rollback
    const prevPredictions = new Map(userPredictions)

    try {
      // Check if prediction already exists
      const existing = userPredictions.get(selectedMatch.id)

      if (existing) {
        // Update existing
        await supabase
          .from('predictions')
          .update({ prediction: selectedPrediction })
          .eq('user_id', user.id)
          .eq('match_id', selectedMatch.id)
      } else {
        // Create new
        await supabase.from('predictions').insert({
          user_id: user.id,
          match_id: selectedMatch.id,
          prediction: selectedPrediction,
        })
      }

      // Update local state
      const newPredMap = new Map(userPredictions)
      newPredMap.set(selectedMatch.id, selectedPrediction)
      setUserPredictions(newPredMap)

      setSelectedMatch(null)
      setSelectedPrediction(null)
    } catch (err) {
      console.error('Error saving prediction:', err)
      // Rollback on error
      setUserPredictions(prevPredictions)
      setPredictionError('No se pudo guardar el pronóstico. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const getMatchResult = (match: Match): 'home' | 'away' | 'draw' | null => {
    if (match.result_home === null || match.result_away === null) return null
    if (match.result_home > match.result_away) return 'home'
    if (match.result_home < match.result_away) return 'away'
    return 'draw'
  }

  const getUserPrediction = (matchId: string): Prediction | undefined => {
    return userPredictions.get(matchId) as Prediction | undefined
  }

  const getPredictionLabel = (pred: Prediction): string => {
    switch (pred) {
      case '1': return 'Local'
      case 'X': return 'Empate'
      case '2': return 'Visitante'
    }
  }

  const filteredMatches = selectedPhase === 'Todos'
    ? matches
    : matches.filter((m) => m.phase === selectedPhase)

  const phases = ['Todos', ...Array.from(new Set(matches.map((m) => m.phase)))]

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
      {/* Ambient background glow effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] left-[-15%] w-[60%] h-[40%] rounded-full bg-emerald-500/5 blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-15%] w-[60%] h-[40%] rounded-full bg-yellow-500/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-4 pt-6">
        <div className="glass-card rounded-2xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-white/5 shadow-xl shadow-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" />
            </div>
            <div>
              <h1 className="text-lg font-display font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-200">
                Polla Mundial
              </h1>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Copa 2026</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex items-center gap-1.5 bg-slate-950/40 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500 text-sports-bg shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                activeTab === 'profile'
                  ? 'bg-emerald-500 text-sports-bg shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              Mi Perfil
            </button>
            {localStorage.getItem('polla_is_admin') === 'true' && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-1.5 ${
                  activeTab === 'admin'
                    ? 'bg-emerald-500 text-sports-bg shadow-md shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Admin
              </button>
            )}
          </div>

          {/* User badge and Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-white/5 border border-white/5 py-1.5 pl-3 pr-2.5 rounded-xl">
              <span className="text-xs font-bold text-slate-300">{user?.name}</span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white text-[10px] font-black">
                {user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}
              </div>
            </div>
            <button
              onClick={() => {
                localStorage.clear()
                router.push('/')
              }}
              className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 hover:border-red-500/30 rounded-xl transition duration-200"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leaderboard */}
            <div className="lg:col-span-1">
              <div className="bg-sports-card/50 glass-card rounded-3xl border border-white/5 p-6 shadow-xl relative overflow-hidden sticky top-6">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/30 to-yellow-500/30"></div>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.4)]" />
                  </div>
                  <h2 className="text-base font-display font-black tracking-tight text-slate-100">Tabla de Posiciones</h2>
                </div>
                
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {leaderboard.map((entry: any, index: number) => {
                    const isCurrentUser = entry.name === user?.name;
                    const isTopThree = index < 3;
                    const rankColors = [
                      'text-yellow-400 bg-yellow-400/10 border-yellow-400/20', // 1st
                      'text-slate-300 bg-slate-300/10 border-slate-300/20',   // 2nd
                      'text-amber-600 bg-amber-600/10 border-amber-600/20',   // 3rd
                    ];
                    
                    return (
                      <div
                        key={`lb-${index}-${entry.name}`}
                        className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 border ${
                          isCurrentUser
                            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-glow-green'
                            : 'bg-slate-950/20 border-white/5 hover:border-white/10 hover:bg-slate-950/30'
                        }`}
                      >
                        {/* Rank Badge */}
                        <span className={`text-xs font-black w-6 h-6 rounded-md flex items-center justify-center border ${
                          isTopThree ? rankColors[index] : 'text-slate-500 bg-white/5 border-white/5'
                        }`}>
                          {index + 1}
                        </span>
                        
                        {/* User Avatar */}
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0 relative overflow-hidden ${
                          isCurrentUser ? 'bg-emerald-500 text-sports-bg font-black' : 'bg-slate-800'
                        }`}>
                          {entry.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        
                        {/* Username and Prediction stats */}
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${isCurrentUser ? 'text-emerald-400' : 'text-slate-200'}`}>
                            {entry.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-medium tracking-wide">
                            Aciertos: {entry.correct_predictions || 0}/{entry.total_predictions || 0}
                          </p>
                        </div>
                        
                        {/* Total Points */}
                        <div className="text-right">
                          <span className={`text-sm font-black tracking-wider px-2.5 py-1 rounded-lg ${
                            isCurrentUser 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : index === 0 
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                              : 'bg-white/5 text-slate-300 border border-white/5'
                          }`}>
                            {entry.total_points || 0} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Matches */}
            <div className="lg:col-span-2">
              {/* Phase Filter */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-white/10">
                {phases.map((phase) => (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wider uppercase whitespace-nowrap transition-all duration-200 border ${
                      selectedPhase === phase
                        ? 'bg-emerald-500 text-sports-bg border-emerald-500 shadow-md shadow-emerald-500/10'
                        : 'bg-sports-card/50 text-slate-400 border-white/5 hover:border-white/10 hover:text-slate-200'
                    }`}
                  >
                    {phase === 'Todos' ? 'Todos los Partidos' : phase}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {filteredMatches.map((match) => {
                  const result = getMatchResult(match)
                  const userPred = getUserPrediction(match.id)
                  const score = userScores.get(match.id)
                  const flagHome = getFlag(match.team_home)
                  const flagAway = getFlag(match.team_away)
                  
                  return (
                    <div
                      key={match.id}
                      className="bg-sports-card/60 glass-card rounded-2xl p-5 border border-white/5 hover:border-emerald-500/20 transition-all duration-300 hover:shadow-xl shadow-slate-950/20 group"
                    >
                      {/* Card Header */}
                      <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                        <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-2.5 py-1 rounded-md border border-emerald-500/20">
                          {match.phase}
                        </span>
                        <span className="text-[10px] font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(match.scheduled_at).toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      {/* Teams and Score display */}
                      <div className="grid grid-cols-7 items-center my-4">
                        {/* Home Team */}
                        <div className="col-span-2 flex flex-col items-center text-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-3xl mb-1.5 filter drop-shadow-md select-none">{flagHome}</span>
                          <span className="text-xs font-black tracking-wide text-slate-200">{match.team_home}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Local</span>
                        </div>

                        {/* Score / VS display */}
                        <div className="col-span-3 flex flex-col items-center justify-center px-4">
                          {result ? (
                            <div className="bg-slate-950/40 px-5 py-2 rounded-2xl border border-white/5 flex items-center gap-3">
                              <span className={`text-2xl font-black ${result === 'home' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {match.result_home}
                              </span>
                              <span className="text-slate-600 font-bold text-sm">-</span>
                              <span className={`text-2xl font-black ${result === 'away' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                {match.result_away}
                              </span>
                            </div>
                          ) : (
                            <div className="bg-slate-950/20 px-3 py-1.5 rounded-full border border-white/5">
                              <span className="text-[10px] tracking-widest font-black text-slate-500 uppercase">VS</span>
                            </div>
                          )}
                        </div>

                        {/* Away Team */}
                        <div className="col-span-2 flex flex-col items-center text-center group-hover:scale-105 transition-transform duration-200">
                          <span className="text-3xl mb-1.5 filter drop-shadow-md select-none">{flagAway}</span>
                          <span className="text-xs font-black tracking-wide text-slate-200">{match.team_away}</span>
                          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Visitante</span>
                        </div>
                      </div>

                      {/* Prediction section */}
                      <div className="mt-4 pt-4 border-t border-white/5">
                        {/* If user has made a prediction */}
                        {userPred && (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/30 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tu apuesta:</span>
                              <span className="text-xs font-black text-emerald-400 uppercase tracking-wide bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {getPredictionLabel(userPred)} ({userPred === '1' ? match.team_home : userPred === '2' ? match.team_away : 'Empate'})
                              </span>
                            </div>
                            
                            {result && (
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                                  score?.correct 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                }`}>
                                  {score?.correct ? '✓ ACERTADO' : '✗ FALLADO'}
                                </span>
                                {score?.points !== undefined && (
                                  <span className="text-xs font-black text-yellow-400 bg-yellow-500/10 px-2.5 py-1 rounded-lg border border-yellow-500/20">
                                    +{score.points} pts
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        {/* If match is pending and user hasn't predicted yet */}
                        {!result && !userPred && (
                          <div>
                            <p className="text-[10px] font-black tracking-wider uppercase text-slate-400 text-center mb-2.5">Realizar Pronóstico</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('1')
                                }}
                                className="flex-1 py-3 bg-slate-950/40 hover:bg-emerald-500 hover:text-sports-bg border border-white/5 hover:border-emerald-500 text-xs font-bold rounded-xl transition duration-200"
                              >
                                Gana {match.team_home}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('X')
                                }}
                                className="px-6 py-3 bg-slate-950/40 hover:bg-slate-800 border border-white/5 hover:border-white/20 text-xs font-bold rounded-xl transition duration-200"
                              >
                                Empate
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('2')
                                }}
                                className="flex-1 py-3 bg-slate-950/40 hover:bg-emerald-500 hover:text-sports-bg border border-white/5 hover:border-emerald-500 text-xs font-bold rounded-xl transition duration-200"
                              >
                                Gana {match.team_away}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* If match is pending and user wants to UPDATE their prediction */}
                        {!result && userPred && (
                          <div className="mt-3">
                            <p className="text-[9px] font-black tracking-wider uppercase text-slate-500 text-center mb-2.5">Modificar Pronóstico</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('1')
                                }}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition duration-200 border ${
                                  userPred === '1'
                                    ? 'bg-emerald-500 text-sports-bg border-emerald-500 shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-950/20 hover:bg-slate-950/40 text-slate-400 border-white/5'
                                }`}
                              >
                                Gana {match.team_home}
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('X')
                                }}
                                className={`px-6 py-2.5 text-xs font-bold rounded-xl transition duration-200 border ${
                                  userPred === 'X'
                                    ? 'bg-emerald-500 text-sports-bg border-emerald-500 shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-950/20 hover:bg-slate-950/40 text-slate-400 border-white/5'
                                }`}
                              >
                                Empate
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedMatch(match)
                                  setSelectedPrediction('2')
                                }}
                                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition duration-200 border ${
                                  userPred === '2'
                                    ? 'bg-emerald-500 text-sports-bg border-emerald-500 shadow-md shadow-emerald-500/10'
                                    : 'bg-slate-950/20 hover:bg-slate-950/40 text-slate-400 border-white/5'
                                }`}
                              >
                                Gana {match.team_away}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

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
                  {userStats?.total_predictions || 0}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Pronósticos Realizados</p>
              </div>
              <div className="bg-sports-card/40 glass-card rounded-2xl border border-white/5 p-6 text-center">
                <TrendingUp className="w-6 h-6 text-teal-400 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-100">
                  {userStats?.accuracy ? userStats.accuracy.toFixed(1) : '0'}%
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Precisión de Acierto</p>
              </div>
              <div className="bg-sports-card/40 glass-card rounded-2xl border border-white/5 p-6 text-center">
                <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-3" />
                <p className="text-3xl font-display font-black text-slate-100">
                  {userStats?.current_streak || 0}
                </p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Racha de Aciertos</p>
              </div>
            </div>
          </div>
        )}

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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Participantes Activos</span>
                </div>
                <div className="bg-blue-950/20 border border-blue-500/20 rounded-2xl p-5 flex flex-col">
                  <span className="text-2xl font-black text-blue-400">
                    {matches.filter((m) => m.result_home !== null).length}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Partidos Completados</span>
                </div>
                <div className="bg-yellow-950/20 border border-yellow-500/20 rounded-2xl p-5 flex flex-col">
                  <span className="text-2xl font-black text-yellow-400">
                    {userPredictions.size || 0}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Apuestas Registradas</span>
                </div>
              </div>

              <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider mb-2">Ingresar Resultados de Partidos</h3>
              <p className="text-xs text-slate-400 mb-6">
                Ingresá los marcadores de los partidos terminados para liquidar las pollas y recalcular la tabla general.
              </p>

              <div className="space-y-3">
                {matches
                  .filter((m) => m.status === 'completed' || (m.result_home !== null && m.result_away !== null))
                  .slice(0, 10)
                  .map((match) => {
                    const flagHome = getFlag(match.team_home)
                    const flagAway = getFlag(match.team_away)
                    return (
                      <div key={match.id} className="flex items-center justify-between p-4 bg-slate-950/30 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3">
                          <span className="text-base">{flagHome}</span>
                          <span className="text-xs font-bold text-slate-300 w-12 text-center">{match.team_home}</span>
                          <span className="text-xs text-slate-500 font-bold">vs</span>
                          <span className="text-base">{flagAway}</span>
                          <span className="text-xs font-bold text-slate-300 w-12 text-center">{match.team_away}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 font-medium mr-2">{match.phase}</span>
                          <span className="text-sm font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-lg">
                            {match.result_home} - {match.result_away}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                {matches.filter((m) => m.result_home !== null).length === 0 && (
                  <div className="text-center py-8 bg-slate-950/20 rounded-2xl border border-white/5 border-dashed">
                    <p className="text-xs text-slate-500 font-medium">No se han registrado resultados de partidos completados en este grupo.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Prediction Modal */}
      {selectedMatch && (
        <div
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setSelectedMatch(null)
              setSelectedPrediction(null)
              setPredictionError('')
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setSelectedMatch(null)
              setSelectedPrediction(null)
              setPredictionError('')
            }
          }}
          role="dialog"
          aria-modal="true"
          aria-label="Confirmar Pronóstico"
        >
          <div className="bg-sports-card glass-card rounded-2xl p-6 max-w-sm w-full border border-white/10 relative overflow-hidden shadow-2xl animate-scale-up">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            {predictionError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2.5 rounded-xl text-xs mb-4 font-semibold">
                {predictionError}
              </div>
            )}
            
            <h3 className="text-base font-display font-black text-slate-100 mb-1 text-center">
              Confirmar Pronóstico
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              ¿Confirmás tu apuesta para este partido?
            </p>

            <div className="flex items-center justify-center gap-6 bg-slate-950/40 p-4 rounded-xl border border-white/5 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{getFlag(selectedMatch.team_home)}</span>
                <span className="text-xs font-bold text-slate-300">{selectedMatch.team_home}</span>
              </div>
              <span className="text-xs font-black text-slate-500">VS</span>
              <div className="flex flex-col items-center">
                <span className="text-2xl mb-1">{getFlag(selectedMatch.team_away)}</span>
                <span className="text-xs font-bold text-slate-300">{selectedMatch.team_away}</span>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center mb-6">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Tu Elección</span>
              <span className="text-sm font-black text-emerald-400 uppercase tracking-wide">
                {selectedPrediction === '1' ? `Gana ${selectedMatch.team_home}` : selectedPrediction === '2' ? `Gana ${selectedMatch.team_away}` : 'Empate'}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedMatch(null)
                  setSelectedPrediction(null)
                }}
                className="flex-1 py-3 border border-white/10 hover:border-white/20 text-xs font-bold text-slate-300 rounded-xl hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePrediction}
                disabled={!selectedPrediction || saving}
                className="flex-1 py-3 bg-emerald-500 text-sports-bg text-xs font-black uppercase tracking-wider rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
