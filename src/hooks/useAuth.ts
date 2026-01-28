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
  const supabase = createClient()

  useEffect(() => {
    // Obtener sesión inicial
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error obteniendo sesión:', error)
        setState(prev => ({ ...prev, loading: false }))
        return
      }

      if (session?.user) {
        const profile = await fetchProfile(session.user.id)
        setState({
          user: session.user,
          profile,
          session,
          loading: false,
        })
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    }

    getInitialSession()

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 Auth state change:', event, session?.user?.email)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfile(session.user.id)
          setState({
            user: session.user,
            profile,
            session,
            loading: false,
          })
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
      subscription.unsubscribe()
    }
  }, [router, supabase])

  // Obtener perfil del usuario
  const fetchProfile = async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error obteniendo perfil:', error)
        return null
      }

      return data as Profile
    } catch (error) {
      console.error('Error fetchProfile:', error)
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

      console.log('🔧 Creando perfil con datos:', profileData)

      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) {
        console.error('❌ Error creando perfil:', error)
        throw error
      }

      console.log('✅ Perfil creado exitosamente:', data)
      return data as Profile
    } catch (error) {
      console.error('❌ Error createProfile:', error)
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

      // Si el usuario se crea exitosamente, crear perfil
      if (data.user && !error) {
        try {
          const profile = await createProfile(data.user, userData)
          console.log('✅ Perfil creado exitosamente para:', profile.full_name)
        } catch (profileError) {
          console.error('❌ Error creando perfil después del registro:', profileError)
          // El usuario se creó pero el perfil falló, devolver el error del perfil
          throw new Error(`Database error saving new user: ${profileError.message}`)
        }
      }

      setState(prev => ({ ...prev, loading: false }))
      return { data, error: null }
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