'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  Users,
  FileQuestion,
  Settings,
  LogOut,
  ChevronRight,
  Award,
  BarChart3,
  Plus
} from 'lucide-react';

interface SidebarProps {
  role: string;
  userName: string;
  userEmail: string;
}

export default function DashboardSidebar({ role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isInstructor = role === 'instructor' || role === 'teacher';
  const basePath = isInstructor ? '/dashboard/teacher' : '/dashboard/student';

  const studentLinks = [
    { href: '/dashboard/student', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/student/courses', label: 'Mis Cursos', icon: BookOpen },
    { href: '/dashboard/student/tasks', label: 'Tareas', icon: FileQuestion },
    { href: '/dashboard/student', label: 'Calificaciones', icon: Award, hash: '#grades' },
  ];

  const instructorLinks = [
    { href: '/dashboard/teacher', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: '/dashboard/teacher/manage-courses', label: 'Mis Cursos', icon: BookOpen },
    { href: '/dashboard/teacher/create-course', label: 'Crear Curso', icon: Plus },
    { href: '/dashboard/teacher', label: 'Estudiantes', icon: Users, hash: '#students' },
    { href: '/dashboard/teacher', label: 'Analiticas', icon: BarChart3, hash: '#analytics' },
  ];

  const links = isInstructor ? instructorLinks : studentLinks;

  const isActive = (href: string, exact?: boolean, hash?: string) => {
    if (hash) return false;
    if (exact) return pathname === href;
    // Check for student or teacher base paths
    const studentBase = '/dashboard/student';
    const teacherBase = '/dashboard/teacher';
    if (href === studentBase || href === teacherBase) {
      return pathname.startsWith(href + '/');
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#161b22] border-r border-[#30363d] flex flex-col z-20">
      {/* Logo */}
      <div className="p-6 border-b border-[#30363d]">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-white">LMS</span>
            <span className="text-xs text-[#8b949e] block capitalize">{role}</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <p className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
          Menu Principal
        </p>
        
        {links.map((link) => {
          const Icon = link.icon;
          const active = isActive(link.href, link.exact, link.hash);
          
          return (
            <Link
              key={link.label}
              href={link.hash ? `${link.href}${link.hash}` : link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                active
                  ? 'bg-cyan-500/10 text-cyan-400'
                  : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-cyan-400' : 'text-[#8b949e] group-hover:text-white'}`} />
              {link.label}
              {active && <ChevronRight className="h-4 w-4 ml-auto" />}
            </Link>
          );
        })}

        {/* Settings section */}
        <div className="pt-4 mt-4 border-t border-[#30363d]">
          <p className="px-3 py-2 text-xs font-semibold text-[#8b949e] uppercase tracking-wider">
            Configuracion
          </p>
          
          <Link
            href={`${basePath}/settings`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
              pathname.includes('/settings')
                ? 'bg-cyan-500/10 text-cyan-400'
                : 'text-[#8b949e] hover:text-white hover:bg-[#21262d]'
            }`}
          >
            <Settings className="h-5 w-5" />
            Ajustes
          </Link>
        </div>
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-[#30363d]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-medium">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{userName}</p>
            <p className="text-xs text-[#8b949e] truncate">{userEmail}</p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesion
        </button>
      </div>
    </aside>
  );
}
