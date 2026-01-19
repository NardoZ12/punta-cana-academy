'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando verificación...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      const supabase = createClient();

      try {
        // Obtener los parámetros de URL de Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error in auth callback:', error);
          setStatus('error');
          setMessage('Error al verificar el email');
          
          // Redirigir a login después de unos segundos
          setTimeout(() => {
            router.push('/login?error=verification_failed');
          }, 3000);
          return;
        }

        if (data.session) {
          const { user } = data.session;
          
          if (user.email_confirmed_at) {
            setStatus('success');
            setMessage('¡Email verificado exitosamente!');
            
            // Obtener el tipo de usuario para redirigir correctamente
            const { data: profile } = await supabase
              .from('profiles')
              .select('user_type')
              .eq('id', user.id)
              .single();
            
            setTimeout(() => {
              if (profile?.user_type === 'teacher') {
                router.push('/dashboard/teacher');
              } else {
                router.push('/dashboard/student');
              }
            }, 2000);
          } else {
            setStatus('error');
            setMessage('El email aún no está verificado');
            
            setTimeout(() => {
              router.push('/verificar-email');
            }, 3000);
          }
        } else {
          setStatus('error');
          setMessage('No se pudo encontrar una sesión válida');
          
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setMessage('Error inesperado al procesar la verificación');
        
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  const getIcon = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pca-blue"></div>
        );
      case 'success':
        return (
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-blue-400';
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
    }
  };

  return (
    <div className="min-h-screen bg-pca-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-800">
          
          <div className="text-center space-y-6">
            
            {/* Logo */}
            <div className="text-3xl font-bold text-white tracking-wider mb-6">
              PCA
            </div>
            
            {/* Icono de estado */}
            <div className="flex justify-center">
              {getIcon()}
            </div>
            
            {/* Mensaje */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Verificando Email
              </h2>
              <p className={`text-sm ${getStatusColor()}`}>
                {message}
              </p>
            </div>
            
            {/* Información adicional */}
            <div className="text-xs text-gray-500">
              {status === 'loading' && 'Por favor espera mientras procesamos tu verificación...'}
              {status === 'success' && 'Serás redirigido automáticamente a tu dashboard'}
              {status === 'error' && 'Serás redirigido para intentar nuevamente'}
            </div>
            
          </div>
          
        </div>
      </div>
    </div>
  );
}