'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';

interface UserMenuProps {
  userType?: 'student' | 'teacher';
}

export function UserMenu({ userType }: UserMenuProps) {
  const [user, setUser] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Obtener datos del perfil
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, user_type')
          .eq('id', user.id)
          .single();
        
        setUser({ ...user, profile });
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {user.profile?.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div className="text-left hidden sm:block">
          <div className="text-white text-sm font-medium">
            {user.profile?.full_name || 'Usuario'}
          </div>
          <div className="text-gray-400 text-xs">
            {user.profile?.user_type === 'teacher' ? 'Profesor' : 'Estudiante'}
          </div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="text-white font-medium">{user.profile?.full_name || 'Usuario'}</div>
            <div className="text-gray-400 text-sm">{user.email}</div>
            <div className="text-xs text-gray-500 mt-1">
              {user.profile?.user_type === 'teacher' ? '👨‍🏫 Profesor' : '🎓 Estudiante'}
            </div>
          </div>
          <div className="p-2">
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 rounded transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}