'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import { createClient } from '@/utils/supabase/client';
import { 
  Home, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  Settings, 
  Search, 
  Bell, 
  Menu, 
  X,
  User 
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

interface StudentLayoutProps {
  children: React.ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const { user, profile, signOut } = useAuthContext();
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Error signing out:', e);
    } finally {
      window.location.href = '/login';
    }
  };

  // Load notifications via direct fetch
  useEffect(() => {
    if (!user) return;
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const headers = {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`,
        };

        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 8000);
        const res = await fetch(
          `${supabaseUrl}/rest/v1/notifications?user_id=eq.${user.id}&select=id,title,message,type,link,is_read,created_at&order=created_at.desc&limit=20`,
          { headers, signal: ctrl.signal }
        );
        clearTimeout(t);
        
        if (res.ok && mounted) {
          const data = await res.json();
          if (Array.isArray(data)) {
            setNotifications(data);
            setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
          }
        }
      } catch (err) {
        console.log('[Notifications] Error loading:', err);
      }
    };

    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [user]);

  // Close notification dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notifId: string) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      await fetch(`${supabaseUrl}/rest/v1/notifications?id=eq.${notifId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_read: true }),
      });
    } catch (err) {
      console.error('[markAsRead] Error:', err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token || !user) return;
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      
      await fetch(`${supabaseUrl}/rest/v1/notifications?user_id=eq.${user.id}&is_read=eq.false`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ is_read: true }),
      });
    } catch (err) {
      console.error('[markAllAsRead] Error:', err);
    }
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/student', icon: Home },
    { name: 'Mis Cursos', href: '/dashboard/student/courses', icon: BookOpen },
    { name: 'Tareas', href: '/dashboard/student/tasks', icon: CheckSquare },
    { name: 'Configuración', href: '/dashboard/student/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161b22] border-r border-[#30363d] transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col`}>
        
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#30363d]">
          <Link href="/dashboard/student" className="flex items-center space-x-3">
            <img src="/images/logos/favicon-definitivo.png" alt="PCA" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold">Punta Cana Academy</span>
          </Link>
          
          {/* Close button for mobile */}
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 mt-8 px-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href === '/dashboard/student/courses' && pathname.startsWith('/dashboard/student/course/'));
            const Icon = item.icon;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-cyan-600 text-white'
                    : 'text-gray-300 hover:bg-[#21262d] hover:text-white'
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#30363d]">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#21262d]">
            <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'Usuario'}
              </div>
              <div className="text-xs text-gray-400">Estudiante</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
              title="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#161b22] border-b border-[#30363d] h-16 flex items-center justify-between px-6 sticky top-0 z-40">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8 hidden sm:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar cursos, lecciones..."
                className="block w-full pl-10 pr-3 py-2 border border-[#30363d] rounded-md leading-5 bg-[#0d1117] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Search icon for mobile */}
            <button className="sm:hidden p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
              <Search className="w-5 h-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-[#161b22]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-[#161b22] border border-[#30363d] rounded-xl shadow-2xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
                    <h3 className="text-sm font-semibold text-white">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                      >
                        Marcar todas como leídas
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Sin notificaciones</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div 
                          key={notif.id}
                          className={`px-4 py-3 border-b border-[#30363d]/50 hover:bg-[#21262d] cursor-pointer transition-colors ${
                            !notif.is_read ? 'bg-cyan-500/5' : ''
                          }`}
                          onClick={() => {
                            if (!notif.is_read) markAsRead(notif.id);
                            if (notif.link) {
                              setShowNotifications(false);
                              window.location.href = notif.link;
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            {!notif.is_read && (
                              <span className="mt-1.5 h-2 w-2 rounded-full bg-cyan-400 flex-shrink-0"></span>
                            )}
                            <div className={`flex-1 ${notif.is_read ? 'pl-5' : ''}`}>
                              <p className={`text-sm ${notif.is_read ? 'text-gray-400' : 'text-white font-medium'}`}>
                                {notif.title}
                              </p>
                              {notif.message && (
                                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                              )}
                              <p className="text-xs text-gray-600 mt-1">
                                {new Date(notif.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="px-4 py-2 border-t border-[#30363d]">
                      <Link 
                        href="/dashboard/student/tasks" 
                        className="text-xs text-cyan-400 hover:text-cyan-300"
                        onClick={() => setShowNotifications(false)}
                      >
                        Ver todas las tareas
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Avatar */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">
                  {profile?.full_name || 'Usuario'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-[#0f1115] p-6">
          {children}
        </main>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}