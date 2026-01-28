'use client'

import { useAuth } from '@/hooks/useAuth'
import { Profile } from '@/types/lms'
import { User, Session } from '@supabase/supabase-js'
import React, { createContext, useContext, ReactNode } from 'react'

interface AuthContextType {
  // Estado
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  
  // Métodos de autenticación
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string, userData?: Partial<Profile>) => Promise<any>
  signOut: () => Promise<any>
  
  // Métodos de perfil
  updateProfile: (updates: Partial<Profile>) => Promise<any>
  createProfile: (user: User, userData?: Partial<Profile>) => Promise<Profile>
  
  // Utilidades
  isTeacher: () => boolean
  isAdmin: () => boolean
  isStudent: () => boolean
  isAuthenticated: boolean
  userType?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const auth = useAuth()
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext debe usarse dentro de un AuthProvider')
  }
  return context
}

// HOC para proteger rutas que requieren autenticación
export function withAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    requireAuth?: boolean
    requireRole?: 'student' | 'teacher' | 'admin'
    redirectTo?: string
  } = {}
) {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, loading, userType, signOut } = useAuthContext()
    const { requireAuth = true, requireRole, redirectTo = '/login' } = options

    // Mostrar loading mientras se verifica la autenticación
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
        </div>
      )
    }

    // Verificar autenticación
    if (requireAuth && !isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = redirectTo
      }
      return null
    }

    // Verificar rol específico
    if (requireRole && userType !== requireRole) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Acceso Denegado
            </h1>
            <p className="text-gray-600 mb-4">
              No tienes permisos para acceder a esta página.
            </p>
            <button
              onClick={() => signOut()}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

// Hook para proteger componentes
export function useRequireAuth(options: {
  requireAuth?: boolean
  requireRole?: 'student' | 'teacher' | 'admin'
} = {}) {
  const { isAuthenticated, userType, loading } = useAuthContext()
  const { requireAuth = true, requireRole } = options

  const isAuthorized = 
    (!requireAuth || isAuthenticated) &&
    (!requireRole || userType === requireRole)

  return {
    isAuthenticated,
    isAuthorized,
    loading,
    userType,
  }
}