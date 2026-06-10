'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [name, setName] = useState('')
  const [groupCode, setGroupCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!name.trim() || !groupCode.trim()) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    try {
      // Check if group exists
      const { data: groups, error: groupError } = await supabase
        .from('groups')
        .select('id')
        .eq('code', groupCode.toUpperCase())
        .single()

      if (groupError || !groups) {
        setError('Código de grupo no encontrado')
        setLoading(false)
        return
      }

      // Create or get user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          avatar: generateAvatar(name.trim()),
          group_id: groups.id,
        })
        .select()
        .single()

      if (userError) {
        // User might already exist — try to find by name + group
        const { data: existingUsers, error: findError } = await supabase
          .from('users')
          .select('*')
          .eq('name', name.trim())
          .eq('group_id', groups.id)

        if (findError || !existingUsers || existingUsers.length === 0) {
          setError('Error al entrar. Intenta con otro nombre.')
          setLoading(false)
          return
        }

        // Use first match (handles duplicate names gracefully)
        const existingUser = existingUsers[0]

        // Save session for existing user
        localStorage.setItem('polla_user_id', existingUser.id)
        localStorage.setItem('polla_group_id', existingUser.group_id)
        localStorage.setItem('polla_user_name', existingUser.name)
      } else {
        // Save session for new user
        localStorage.setItem('polla_user_id', user.id)
        localStorage.setItem('polla_group_id', user.group_id)
        localStorage.setItem('polla_user_name', user.name)
      }

      router.push('/dashboard')
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    setError('')
    setLoading(true)

    if (!name.trim() || !groupCode.trim()) {
      setError('Por favor completa todos los campos')
      setLoading(false)
      return
    }

    try {
      const groupCodeUpper = groupCode.toUpperCase()

      // Check if group already exists
      const { data: existingGroup } = await supabase
        .from('groups')
        .select('id')
        .eq('code', groupCodeUpper)
        .single()

      if (existingGroup) {
        setError('Este código de grupo ya existe. Usa otro o ingresa como participante.')
        setLoading(false)
        return
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          code: groupCodeUpper,
          name: `${name.trim()} - Polla Mundial`,
        })
        .select()
        .single()

      if (groupError) {
        setError('Error al crear el grupo')
        setLoading(false)
        return
      }

      // Create admin user
      const { data: user, error: userError } = await supabase
        .from('users')
        .insert({
          name: name.trim(),
          avatar: generateAvatar(name.trim()),
          group_id: group.id,
        })
        .select()
        .single()

      if (userError) {
        setError('Error al crear tu usuario')
        setLoading(false)
        return
      }

      // Save session
      localStorage.setItem('polla_user_id', user.id)
      localStorage.setItem('polla_group_id', user.group_id)
      localStorage.setItem('polla_user_name', user.name)
      localStorage.setItem('polla_is_admin', 'true')

      router.push('/dashboard')
    } catch (err) {
      console.error('Error:', err)
      setError('Error de conexión. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-sports-bg select-none flex items-center justify-center p-4">
      {/* Background glow effects - Stadium Lights */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-yellow-500/5 blur-[120px]" />
        <div className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full bg-emerald-600/5 blur-[100px]" />
        {/* Subtle grid pattern overlay */}
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px'
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md my-8">
        {/* Logo / Header */}
        <div className="text-center mb-8 animate-fade-in">
          {/* Soccer ball icon with glowing outer ring */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 relative">
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-500 to-yellow-500 opacity-20 blur-md animate-pulse"></div>
            <div className="w-20 h-20 rounded-full bg-sports-card border border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-950/50">
              <svg className="w-11 h-11 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-display font-black tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-emerald-200 to-yellow-400">
            Polla Mundial
          </h1>
          <p className="text-emerald-400 text-sm font-semibold tracking-widest uppercase">
            Copa Mundial FIFA 2026
          </p>
          <div className="flex items-center justify-center gap-3 mt-3 opacity-60">
            <span className="h-[1px] w-8 bg-emerald-500/30"></span>
            <span className="text-[11px] font-medium tracking-wider text-slate-400">USA · CANADÁ · MÉXICO</span>
            <span className="h-[1px] w-8 bg-emerald-500/30"></span>
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 via-yellow-500 to-emerald-500"></div>
          
          <h2 className="text-xl font-bold font-display text-slate-100 mb-1 text-center">
            Unite a la Competencia
          </h2>
          <p className="text-slate-400 text-xs text-center mb-6">
            Ingresá tu código y demostrá tus dotes de DT
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="block text-[11px] font-bold tracking-wider uppercase text-emerald-400 mb-2"
              >
                Nombre del Participante
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Leo Messi"
                className="w-full px-4 py-3.5 rounded-xl glass-input text-sm outline-none font-medium"
                required
              />
            </div>

            <div>
              <label
                htmlFor="groupCode"
                className="block text-[11px] font-bold tracking-wider uppercase text-emerald-400 mb-2"
              >
                Código del Grupo
              </label>
              <input
                id="groupCode"
                type="text"
                value={groupCode}
                onChange={(e) => setGroupCode(e.target.value.toUpperCase())}
                placeholder="Ej: FULBO-2026"
                className="w-full px-4 py-3.5 rounded-xl glass-input text-sm outline-none font-mono tracking-wider font-bold"
                required
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3.5 rounded-xl text-xs flex items-center gap-2.5 animate-shake">
                <svg className="w-5 h-5 flex-shrink-0 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] text-sports-bg font-bold py-4 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-sports-bg border-t-transparent"></div>
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                  <span>Ingresar a la Polla</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest mb-3">¿Querés armar tu propio torneo?</p>
            <button
              onClick={handleCreateGroup}
              disabled={loading}
              className="w-full border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 active:scale-[0.98] font-bold py-3.5 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 text-xs uppercase tracking-wider"
            >
              Crear Nuevo Grupo
            </button>
          </div>
        </div>

        {/* Footer info pill */}
        <div className="mt-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2.5 bg-sports-card/40 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/5 shadow-md">
            <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <p className="text-slate-400 text-xs font-semibold">
              48 Equipos · 104 Partidos · 16 Sedes
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function generateAvatar(name: string): string {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const hexColors = [
    '#22c55e',
    '#3b82f6',
    '#a855f7',
    '#ef4444',
    '#eab308',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
  ]

  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }

  const color = hexColors[Math.abs(hash) % hexColors.length]

  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="55" text-anchor="middle" fill="white" font-size="40" font-family="Arial" font-weight="bold">${initials}</text></svg>`
  )}`
}
