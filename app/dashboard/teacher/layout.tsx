'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  Home,
  BookOpen,
  PlusCircle,
  Users,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  LogOut,
  BarChart3
} from 'lucide-react';

interface TeacherLayoutProps {
  children: React.ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard/teacher', icon: Home },
    { name: 'Mis Cursos', href: '/dashboard/teacher/manage-courses', icon: BookOpen },
    { name: 'Crear Curso', href: '/dashboard/teacher/create-course', icon: PlusCircle },
  ];

  return (
    <div className="min-h-screen bg-[#0f1115] text-white flex">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#161b22] border-r border-[#30363d] transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 lg:flex lg:flex-col`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-[#30363d]">
          <Link href="/dashboard/teacher" className="flex items-center space-x-3">
            <img src="/images/logos/favicon-definitivo.png" alt="PCA" className="w-8 h-8 rounded-lg object-contain" />
            <span className="text-lg font-bold">Punta Cana Academy</span>
          </Link>

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
            const isActive =
              pathname === item.href ||
              (item.href === '/dashboard/teacher/manage-courses' &&
                pathname.startsWith('/dashboard/teacher/course/'));
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

        {/* User Profile + Logout */}
        <div className="p-4 border-t border-[#30363d]">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-[#21262d]">
            <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() ||
                  user?.email?.charAt(0)?.toUpperCase() ||
                  'P'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">
                {profile?.full_name || 'Profesor'}
              </div>
              <div className="text-xs text-gray-400">Profesor</div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-400 rounded-md hover:bg-gray-700 transition-colors"
              title="Cerrar Sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#161b22] border-b border-[#30363d] h-16 flex items-center justify-between px-6 sticky top-0 z-40">
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
                placeholder="Buscar cursos, estudiantes..."
                className="block w-full pl-10 pr-3 py-2 border border-[#30363d] rounded-md leading-5 bg-[#0d1117] text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <button className="sm:hidden p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
              <Search className="w-5 h-5" />
            </button>

            <button className="relative p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-700">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-[#161b22]"></span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">
                  {profile?.full_name?.charAt(0)?.toUpperCase() ||
                    user?.email?.charAt(0)?.toUpperCase() ||
                    'P'}
                </span>
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-medium">
                  {profile?.full_name || 'Profesor'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-[#0f1115] p-6">{children}</main>
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
