'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/atoms/Button';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export default function EmailVerifiedPage() {
  const router = useRouter();
  const { user, isVerified, refreshStatus } = useEmailVerification();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar el estado cuando se monta el componente
    const checkStatus = async () => {
      await refreshStatus();
      setIsLoading(false);
      
      // Si el usuario ya está verificado, redirigir después de unos segundos
      if (isVerified && user) {
        setTimeout(() => {
          router.push('/dashboard/student');
        }, 3000);
      }
    };

    checkStatus();
  }, [refreshStatus, isVerified, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-pca-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pca-blue mx-auto mb-4"></div>
          <p className="text-white">Verificando estado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pca-black flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="text-3xl font-bold text-white tracking-wider mb-6 inline-block">
          PCA
        </Link>
        
        {/* Icono de éxito */}
        <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-3xl font-extrabold text-white mb-4">
          ¡Email verificado!
        </h2>
        
        <div className="text-gray-300 space-y-4">
          <p>
            Tu correo electrónico ha sido verificado exitosamente.
          </p>
          <p className="text-sm">
            Ya puedes acceder a todas las funciones de Punta Cana Academy.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-gray-900 py-8 px-4 shadow-2xl sm:rounded-lg sm:px-10 border border-gray-800">
          
          <div className="space-y-6">
            
            {/* Mensaje de éxito */}
            <div className="bg-green-500/10 border border-green-500 text-green-300 text-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                ¡Verificación completa!
              </h3>
              <p className="text-sm">
                Tu cuenta está ahora completamente activada y lista para usar.
              </p>
            </div>

            {/* Próximos pasos */}
            <div className="bg-blue-500/10 border border-blue-500 text-blue-300 text-sm p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Próximos pasos:</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Completa tu perfil</li>
                <li>Explora nuestros cursos</li>
                <li>Únete a tu primera clase</li>
              </ul>
            </div>

            {/* Botones de acción */}
            <div className="space-y-3">
              <Link href="/dashboard/student">
                <Button variant="primary" fullWidth>
                  Ir a mi Dashboard
                </Button>
              </Link>
              
              <Link href="/cursos">
                <Button variant="outline" fullWidth>
                  Explorar Cursos
                </Button>
              </Link>
              
              <p className="text-center">
                <Link 
                  href="/" 
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  ← Volver al inicio
                </Link>
              </p>
            </div>

            {/* Auto-redirección */}
            <div className="pt-4 border-t border-gray-700">
              <p className="text-xs text-gray-500 text-center">
                Serás redirigido automáticamente a tu dashboard en unos segundos...
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}