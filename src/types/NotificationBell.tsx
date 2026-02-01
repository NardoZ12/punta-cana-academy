'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from '@/hooks/useNotifications'
import { Notification } from '@/types/lms'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setIsOpen(false)
  }

  // Formateador de fecha simple
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.round(diffMs / 60000)
    const diffHours = Math.round(diffMs / 3600000)
    const diffDays = Math.round(diffMs / 86400000)

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    if (diffHours < 24) return `Hace ${diffHours} h`
    if (diffDays === 1) return 'Ayer'
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón de Campana */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-pca-blue transition-colors rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pca-blue"
        aria-label="Notificaciones"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-red-600 rounded-full min-w-[1.25rem]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden origin-top-right">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">Notificaciones</h3>
            {unreadCount > 0 && (
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs text-pca-blue hover:text-blue-800 font-medium transition-colors"
              >
                Marcar todo como leído
              </button>
            )}
          </div>

          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center text-gray-500">
                <span className="text-4xl mb-2">🔕</span>
                <p className="text-sm">No tienes notificaciones nuevas</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id} 
                    className={`transition-colors duration-150 ${!notification.is_read ? 'bg-blue-50/60' : 'hover:bg-gray-50'}`}
                  >
                    <div 
                      onClick={() => handleNotificationClick(notification)}
                      className="block w-full text-left cursor-pointer"
                    >
                      {notification.link ? (
                         <Link href={notification.link} className="block p-4">
                           <NotificationItemContent notification={notification} formatDate={formatDate} />
                         </Link>
                      ) : (
                        <div className="block p-4">
                          <NotificationItemContent notification={notification} formatDate={formatDate} />
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-100 bg-gray-50 text-center">
            <Link 
              href="/dashboard/student/notifications" 
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 hover:text-pca-blue font-medium block py-1 transition-colors"
            >
              Ver historial completo
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItemContent({ notification, formatDate }: { notification: Notification, formatDate: (d: string) => string }) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return <span className="text-green-500 text-lg">✅</span>
      case 'warning': return <span className="text-yellow-500 text-lg">⚠️</span>
      case 'error': return <span className="text-red-500 text-lg">❌</span>
      default: return <span className="text-blue-500 text-lg">ℹ️</span>
    }
  }

  return (
    <div className="flex gap-3 items-start">
      <div className="flex-shrink-0 mt-0.5">
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-700'}`}>
          {notification.title}
        </p>
        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1.5">
          {formatDate(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <div className="flex-shrink-0 self-center ml-2">
          <div className="h-2.5 w-2.5 bg-pca-blue rounded-full ring-2 ring-white"></div>
        </div>
      )}
    </div>
  )
}