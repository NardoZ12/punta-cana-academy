'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEmailVerification } from '@/hooks/useEmailVerification';

export function EmailVerificationBanner() {
  const { user, isVerified, isLoading } = useEmailVerification();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Agregar clase al body cuando el banner esté visible
    if (user && !isVerified && !isDismissed && !isLoading) {
      document.body.classList.add('body-with-banner');
    } else {
      document.body.classList.remove('body-with-banner');
    }
    
    return () => {
      document.body.classList.remove('body-with-banner');
    };
  }, [user, isVerified, isDismissed, isLoading]);

  // No mostrar si está cargando, no hay usuario, el email ya está verificado, o fue dismisseado
  if (isLoading || !user || isVerified || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white p-3 shadow-lg z-50 email-verification-banner">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Contenido principal */}
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <div>
            <p className="text-sm font-medium">
              ⚠️ <span className="font-bold">Tu email no está verificado</span>
            </p>
            <p className="text-xs opacity-90">
              Verifica tu correo ({user.email}) para acceder a todas las funciones
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center space-x-2">
          <Link href={`/verificar-email?email=${encodeURIComponent(user.email || '')}`}>
            <button className="bg-white text-orange-600 px-3 py-1 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors">
              Verificar ahora
            </button>
          </Link>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white hover:text-gray-200 transition-colors ml-2"
            aria-label="Cerrar notificación"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default EmailVerificationBanner;