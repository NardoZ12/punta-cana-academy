'use client'

import { createClient } from '@/utils/supabase/client'
import { Profile, USER_TYPES } from '@/types/lms'
import { User, Session } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface AuthState {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    session: null,
    loading: true,
  })
  
  const router = useRouter()
  // createClient() is now a singleton — same instance every call
  const supabase = createClient()

  useEffect(() => {
    let mounted = true
    let initialSessionHandled = false

    // Obtener sesión inicial
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error obteniendo sesión:', error)
          setState(prev => ({ ...prev, loading: false }))
          return
        }

        if (session?.user) {
          const profile = await fetchProfile(session.user.id)
          if (!mounted) return
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
          })
        } else {
          setState(prev => ({ ...prev, loading: false }))
        }
        initialSessionHandled = true
      } catch (err) {
        console.error('Error en getInitialSession:', err)
        if (mounted) setState(prev => ({ ...prev, loading: false }))
        initialSessionHandled = true
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Skip INITIAL_SESSION — we already handle it above via getInitialSession()
        if (event === 'INITIAL_SESSION') return
        
        if (event === 'SIGNED_IN' && session?.user) {
          // If getInitialSession already handled this session, skip the redundant fetch
          if (initialSessionHandled && state.user?.id === session.user.id) return
          
          const profile = await fetchProfile(session.user.id)
          if (!mounted) return
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
          })
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Session refreshed — update session but keep existing profile
          setState(prev => ({
            ...prev,
            user: session.user,
            session,
          }))
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
          })
          router.push('/login')
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Obtener perfil del usuario
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // Si el perfil no existe, intentar crearlo
        if (error.code === 'PGRST116') {
          const user = await supabase.auth.getUser();
          if (user.data.user) {
            return await createProfile(user.data.user);
          }
        }
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('💥 Error fetchProfile:', error)
      return null
    }
  }

  // Crear perfil automáticamente
  const createProfile = async (user: User, userData: Partial<Profile> = {}) => {
    try {
      const profileData: Partial<Profile> = {
        id: user.id,
        full_name: userData.full_name || user.user_metadata?.full_name || '',
        phone: userData.phone || '',
        user_type: userData.user_type || USER_TYPES.STUDENT,
        language: userData.language || 'es',
        ...userData,
      }

      // Usar upsert para evitar error de clave duplicada (el trigger puede haberlo creado ya)
      const { data, error } = await supabase
        .from('profiles')
        .upsert([profileData], { onConflict: 'id' })
        .select()
        .single()

      if (error) throw error

      return data as Profile
    } catch (error) {
      console.error('Error createProfile:', error)
      throw error
    }
  }

  // Login con email y contraseña
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      return { data, error: null }
    } catch (error: any) {
      console.error('Error en signIn:', error)
      setState(prev => ({ ...prev, loading: false }))
      return { data: null, error: error.message }
    }
  }

  // Registro de nuevo usuario
  const signUp = async (email: string, password: string, userData: Partial<Profile> = {}) => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      console.log('🔧 Iniciando registro para:', email, 'como:', userData.user_type)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: userData.full_name,
            user_type: userData.user_type || USER_TYPES.STUDENT,
          }
        }
      })

      if (error) {
        console.error('❌ Error en auth.signUp:', error)
        throw error
      }

      console.log('✅ Usuario de auth creado:', data.user?.email)

      // Si el usuario se crea exitosamente, intentar crear/actualizar perfil
      if (data.user && !error) {
        try {
          const profile = await createProfile(data.user, userData)
          console.log('✅ Perfil creado/actualizado exitosamente para:', profile.full_name)
          
          // Actualizar estado con el usuario y perfil
          setState({
            user: data.user,
            profile,
            session: data.session,
            loading: false,
          })
        } catch (profileError: any) {
          console.warn('⚠️ Error creando perfil (puede que el trigger ya lo haya creado):', profileError)
          // No lanzar error - el trigger de la DB probablemente ya creó el perfil
          // Intentar obtener el perfil existente
          const existingProfile = await fetchProfile(data.user.id)
          setState({
            user: data.user,
            profile: existingProfile,
            session: data.session,
            loading: false,
          })
        }
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }

      return { data, error: null, userType: userData.user_type || USER_TYPES.STUDENT }
    } catch (error: any) {
      console.error('❌ Error en signUp:', error)
      setState(prev => ({ ...prev, loading: false }))
      return { data: null, error: error.message }
    }
  }

  // Logout
  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, loading: true }))
      
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setState({
        user: null,
        profile: null,
        session: null,
        loading: false,
      })
      
      router.push('/login')
      return { error: null }
    } catch (error: any) {
      console.error('Error en signOut:', error)
      setState(prev => ({ ...prev, loading: false }))
      return { error: error.message }
    }
  }

  // Actualizar perfil
  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      if (!state.user) throw new Error('No hay usuario autenticado')

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', state.user.id)
        .select()
        .single()

      if (error) throw error

      setState(prev => ({
        ...prev,
        profile: { ...prev.profile, ...data } as Profile
      }))

      return { data, error: null }
    } catch (error: any) {
      console.error('Error actualizando perfil:', error)
      return { data: null, error: error.message }
    }
  }

  // Verificar si el usuario es profesor
  const isTeacher = () => {
    return state.profile?.user_type === USER_TYPES.TEACHER
  }

  // Verificar si el usuario es admin
  const isAdmin = () => {
    return state.profile?.user_type === USER_TYPES.ADMIN
  }

  // Verificar si el usuario es estudiante
  const isStudent = () => {
    return state.profile?.user_type === USER_TYPES.STUDENT
  }

  return {
    // Estado
    ...state,
    
    // Métodos de autenticación
    signIn,
    signUp,
    signOut,
    
    // Métodos de perfil
    updateProfile,
    createProfile,
    
    // Utilidades
    isTeacher,
    isAdmin,
    isStudent,
    
    // Datos útiles
    isAuthenticated: !!state.user,
    userType: state.profile?.user_type,
  }
}