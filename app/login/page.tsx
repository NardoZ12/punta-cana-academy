'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuthContext()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: authError } = await signIn(email, password)

      if (authError) {
        setError(authError.message || authError)
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Intenta nuevamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,180,255,0.18),_transparent_25%),linear-gradient(135deg,#071421_0%,#0d1b2a_45%,#0c2341_100%)] px-4 py-12">
      <div className="w-full max-w-md rounded-[28px] border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(8,19,33,0.55)] backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-2xl shadow-[0_0_22px_rgba(59,180,255,0.18)]">
            🎓
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Iniciar sesión</h2>
          <p className="mt-2 text-sm text-slate-300">Accede a tu cuenta de Punta Cana Academy</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                Correo electrónico
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-4 py-3 text-sm font-bold text-slate-950 shadow-[0_20px_30px_rgba(59,180,255,0.2)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" />
                Iniciando sesión...
              </span>
            ) : (
              'Ingresar'
            )}
          </button>

          <div className="text-center text-sm text-slate-300">
            ¿No tienes una cuenta?{' '}
            <Link href="/registro" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Regístrate aquí
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
              ← Volver al inicio
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}