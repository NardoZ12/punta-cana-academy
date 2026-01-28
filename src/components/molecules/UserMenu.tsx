'use client'

import { useState, useRef } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { useRealtime } from '@/hooks/useRealtime'
import Link from 'next/link'
import Image from 'next/image'
import NotificationCenter from '@/components/organisms/NotificationCenter'
import { 
  User, 
  Settings, 
  LogOut, 
  Camera, 
  Edit3,
  Bell,
  Shield,
  HelpCircle,
  ChevronDown
} from 'lucide-react'

export default function UserMenu() {
  const { user, profile, signOut } = useAuthContext()
  const [isOpen, setIsOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleProfileImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // TODO: Implementar subida de imagen a Supabase Storage
      console.log('Nueva imagen seleccionada:', file)
    }
  }

  // Obtener iniciales del nombre para el avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('')
  }

  const profileImage = profile?.avatar_url

  return (
    <>
      <div className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {/* Avatar */}
          <div className="relative">
            {profileImage ? (
              <Image
                src={profileImage}
                alt={profile?.full_name || 'Usuario'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                {profile?.full_name ? getInitials(profile.full_name) : 'U'}
              </div>
            )}
          </div>
          
          {/* User Info */}
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">
              {profile?.full_name || 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {profile?.user_type || 'Profesor'}
            </p>
          </div>
          
          <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={profile?.full_name || 'Usuario'}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{profile?.full_name || 'Usuario'}</h3>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize mt-1">
                    {profile?.user_type || 'Profesor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button
                onClick={() => {
                  setShowProfileModal(true)
                  setIsOpen(false)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <User className="h-4 w-4 mr-3 text-gray-400" />
                Editar Perfil
              </button>

              <Link
                href="/dashboard/teacher/settings"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4 mr-3 text-gray-400" />
                Configuración
              </Link>

              <button
                onClick={() => {
                  setShowNotifications(!showNotifications)
                }}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Bell className="h-4 w-4 mr-3 text-gray-400" />
                Notificaciones
              </button>

              <Link
                href="/dashboard/teacher/security"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Shield className="h-4 w-4 mr-3 text-gray-400" />
                Seguridad
              </Link>

              <Link
                href="/help"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <HelpCircle className="h-4 w-4 mr-3 text-gray-400" />
                Ayuda
              </Link>
            </div>

            {/* Sign Out */}
            <div className="border-t border-gray-100 pt-2">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        )}

        {/* Click outside to close */}
        {isOpen && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Editar Perfil</h2>
            
            {/* Profile Image */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative">
                {profileImage ? (
                  <Image
                    src={profileImage}
                    alt={profile?.full_name || 'Usuario'}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-2xl">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </div>
                )}
                <button
                  onClick={handleProfileImageClick}
                  className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo
                </label>
                <input
                  type="text"
                  defaultValue={profile?.full_name || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="tel"
                  defaultValue={profile?.phone || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Biografía
                </label>
                <textarea
                  rows={3}
                  defaultValue={profile?.bio || ''}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Cuéntanos un poco sobre ti..."
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // TODO: Implementar guardado
                  setShowProfileModal(false)
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NotificationCenter */}
      {showNotifications && (
        <div className="absolute right-0 mt-12 z-50">
          <NotificationCenter onClose={() => setShowNotifications(false)} />
        </div>
      )}
    </>
  );
};