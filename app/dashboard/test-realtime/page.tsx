'use client'

import { useRealtime, useRealtimeStudents, useRealtimeTasks, useRealtimeCourses } from '@/hooks/useRealtime'
import { useRealtimeContext } from '@/contexts/RealtimeContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { useState } from 'react'
import { Bell, Users, BookOpen, CheckCircle, Clock, RefreshCw } from 'lucide-react'

export default function RealtimeTestPage() {
  const { user, profile } = useAuthContext()
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    isConnected 
  } = useRealtimeContext()
  
  const { students } = useRealtimeStudents()
  const { tasks, grades } = useRealtimeTasks()
  const { courses } = useRealtimeCourses()
  
  const [testNotificationSent, setTestNotificationSent] = useState(false)

  const createTestNotification = async () => {
    if (!user) return
    
    try {
      // Simular una nueva notificación insertándola en la base de datos
      const { supabase } = await import('@/utils/supabase/client')
      
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          title: 'Notificación de Prueba',
          message: `Prueba de tiempo real - ${new Date().toLocaleTimeString()}`,
          type: 'general'
        })
      
      if (error) {
        console.error('Error creando notificación de prueba:', error)
      } else {
        setTestNotificationSent(true)
        setTimeout(() => setTestNotificationSent(false), 3000)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const createTestEnrollment = async () => {
    if (!user) return
    
    try {
      const { supabase } = await import('@/utils/supabase/client')
      
      // Simular una nueva inscripción
      const { error } = await supabase
        .from('student_enrollments')
        .insert({
          student_id: user.id,
          course_id: 'test-course-' + Date.now(),
          instructor_id: user.id, // Para simplificar, usar el mismo usuario
          status: 'active'
        })
      
      if (error) {
        console.error('Error creando inscripción de prueba:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const createTestTask = async () => {
    if (!user) return
    
    try {
      const { supabase } = await import('@/utils/supabase/client')
      
      // Simular una nueva tarea
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: `Tarea de prueba - ${new Date().toLocaleTimeString()}`,
          description: 'Esta es una tarea de prueba para el sistema en tiempo real',
          course_id: 'test-course-001',
          instructor_id: user.id,
          type: 'assignment',
          is_published: true,
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 días
        })
      
      if (error) {
        console.error('Error creando tarea de prueba:', error)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Panel de Pruebas - Tiempo Real
              </h1>
              <p className="text-gray-600 mt-1">
                Prueba las funcionalidades en tiempo real del sistema
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-2 rounded-lg ${
                isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`}></div>
                <span className="text-sm font-medium">
                  {isConnected ? 'Conectado' : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Estado de Conexión */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bell className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Notificaciones</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
                <p className="text-xs text-blue-600">{unreadCount} sin leer</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Estudiantes RT</p>
                <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                <p className="text-xs text-green-600">En tiempo real</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tareas RT</p>
                <p className="text-2xl font-bold text-gray-900">{tasks.length}</p>
                <p className="text-xs text-purple-600">En tiempo real</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Calificaciones RT</p>
                <p className="text-2xl font-bold text-gray-900">{grades.length}</p>
                <p className="text-xs text-yellow-600">En tiempo real</p>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de Prueba */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Controles de Prueba</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={createTestNotification}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed transition-colors ${
                testNotificationSent 
                ? 'border-green-300 bg-green-50 text-green-700' 
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
              }`}
            >
              <Bell className="h-5 w-5 mr-2" />
              {testNotificationSent ? 'Notificación Enviada!' : 'Crear Notificación'}
            </button>

            <button
              onClick={createTestEnrollment}
              className="flex items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50 transition-colors"
            >
              <Users className="h-5 w-5 mr-2" />
              Simular Inscripción
            </button>

            <button
              onClick={createTestTask}
              className="flex items-center justify-center px-4 py-3 rounded-lg border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-colors"
            >
              <BookOpen className="h-5 w-5 mr-2" />
              Crear Tarea
            </button>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={markAllAsRead}
              className="flex items-center px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar Todas como Leídas
            </button>
          </div>
        </div>

        {/* Lista de Notificaciones */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Notificaciones Recientes</h2>
          </div>
          <div className="p-6">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sin notificaciones
                </h3>
                <p className="text-gray-500">
                  Las notificaciones aparecerán aquí en tiempo real
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`flex items-start space-x-4 p-4 rounded-lg border ${
                      notification.is_read 
                      ? 'bg-gray-50 border-gray-200' 
                      : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`p-2 rounded-lg ${
                        notification.type === 'enrollment' ? 'bg-green-100' :
                        notification.type === 'grade_updated' ? 'bg-blue-100' :
                        notification.type === 'task_assigned' ? 'bg-purple-100' :
                        'bg-gray-100'
                      }`}>
                        {notification.type === 'enrollment' && <Users className="h-4 w-4 text-green-600" />}
                        {notification.type === 'grade_updated' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                        {notification.type === 'task_assigned' && <BookOpen className="h-4 w-4 text-purple-600" />}
                        {!['enrollment', 'grade_updated', 'task_assigned'].includes(notification.type) && <Bell className="h-4 w-4 text-gray-600" />}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="flex-shrink-0 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de información del usuario
function UserInfo() {
  const { user, profile } = useAuthContext()
  
  if (!user || !profile) return null
  
  return (
    <div className="bg-gray-100 rounded-lg p-4 mb-6">
      <h3 className="font-medium text-gray-900 mb-2">Información del Usuario</h3>
      <div className="text-sm text-gray-600 space-y-1">
        <p><span className="font-medium">Email:</span> {user.email}</p>
        <p><span className="font-medium">Nombre:</span> {profile.full_name}</p>
        <p><span className="font-medium">Tipo:</span> {profile.user_type}</p>
        <p><span className="font-medium">ID:</span> {user.id}</p>
      </div>
    </div>
  )
}