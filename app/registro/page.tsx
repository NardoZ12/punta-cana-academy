'use client'

import { useState, useEffect } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { UserType } from '@/types/lms'

export default function RegistroPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'student' as UserType
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signUp, isAuthenticated, profile } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.user_type === 'teacher') {
        router.push('/dashboard/teacher')
      } else if (profile.user_type === 'admin') {
        router.push('/dashboard/admin')
      } else {
        router.push('/dashboard/student')
      }
    }
  }, [isAuthenticated, profile, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      setLoading(false)
      return
    }

    const { error: authError } = await signUp(
      formData.email,
      formData.password,
      {
        full_name: `${formData.firstName} ${formData.lastName}`,
        phone: formData.phone,
        user_type: formData.userType
      }
    )

    if (authError) {
      setError(authError)
      setLoading(false)
    } else {
      if (formData.userType === 'teacher') {
        router.push('/dashboard/teacher?registered=true')
      } else {
        router.push('/dashboard/student?registered=true')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(59,180,255,0.18),_transparent_25%),linear-gradient(135deg,#071421_0%,#0d1b2a_45%,#0c2341_100%)] px-4 py-12">
      <div className="w-full max-w-xl rounded-[28px] border border-cyan-400/20 bg-slate-950/80 p-8 shadow-[0_30px_80px_rgba(8,19,33,0.55)] backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10 text-2xl shadow-[0_0_22px_rgba(59,180,255,0.18)]">
            ✨
          </div>
          <h2 className="text-3xl font-black tracking-tight text-white">Crear cuenta</h2>
          <p className="mt-2 text-sm text-slate-300">Únete a Punta Cana Academy y empieza tu camino de aprendizaje</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="userType" className="mb-2 block text-sm font-medium text-slate-200">
                Tipo de usuario
              </label>
              <select
                id="userType"
                name="userType"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                value={formData.userType}
                onChange={handleChange}
              >
                <option value="student">Estudiante</option>
                <option value="teacher">Profesor</option>
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="mb-2 block text-sm font-medium text-slate-200">Nombre</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Juan"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="mb-2 block text-sm font-medium text-slate-200">Apellido</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                  placeholder="Pérez"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-200">Número de teléfono</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="+1 809 555 0123"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">Correo electrónico</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="tu@email.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">Contraseña</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Mínimo 6 caracteres"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-200">Confirmar contraseña</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-white placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20"
                placeholder="Repite tu contraseña"
                value={formData.confirmPassword}
                onChange={handleChange}
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
                Creando cuenta...
              </span>
            ) : (
              'Crear cuenta'
            )}
          </button>

          <div className="text-center text-sm text-slate-300">
            ¿Ya tienes una cuenta?{' '}
            <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
              Inicia sesión aquí
            </Link>
          </div>

          <div className="text-center">
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-200">
              ← Volver al inicio
            </Link>
          </div>
        </form>

        <div className="mt-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">
          Después de registrarte, deberás verificar tu correo electrónico para completar tu acceso.
        </div>
      </div>
    </div>
  )
}